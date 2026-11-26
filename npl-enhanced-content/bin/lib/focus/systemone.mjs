/**
 * focus/systemone — wire port of the TypeSafe System One classifier
 * protocol (mirror of GenAI.Provider.SystemOne / .Rounded, Elixir → JS).
 *
 * Endpoint: POST `<base>/systemone` (an existing `/systemone` or `/models`
 * suffix on the base is stripped before joining). Bearer auth; the key is
 * never logged or echoed.
 *
 * Request body: `{ model, state: <input>, questions: { id -> wire } }` with
 *   - boolean  -> `{ type: "noul", instructions }`
 *   - choice   -> `{ type: "choice", instructions, criteria: { id -> label } }` (<= 255)
 *   - score    -> `{ type: "score", instructions, criteria: [labels] }` (<= 10)
 *
 * `state` is capped before the request is built (see the MAX_STATE_* wire
 * caps below): every string is cut to MAX_STATE_CHARS codepoints keeping
 * the head and the tail with an in-band `…[semtext focus: N chars
 * dropped]…` marker, arrays keep MAX_STATE_ARRAY_ITEMS head+tail items,
 * and a MAX_STATE_BYTES utf-8 backstop bounds the whole serialized state.
 *
 * Response `json.answers` keyed by question id. Decoding honours the
 * distribution policy:
 *   - strict: probabilities must key-match and sum to 1 within 1e-6; a
 *     score answer's probability-weighted index must match the wire score.
 *   - alibaba_rounded_hundredths (qwen decision-model — the GA id; the
 *     legacy decision-model-preview id is accepted identically): the wire
 *     carries hundredths-rounded display estimates; when strict decoding
 *     fails, the distribution is canonicalised (unit-normalised) and the
 *     wire score is validated against the attainable-mean range, exactly
 *     like the Elixir Rounded module.
 *
 * Returns `{ [questionId]: { type, value, probability, confidence } }`
 * where boolean values are thresholded noul probabilities, choice values
 * are option ids, and score values are the caller's numeric scale mapped
 * through the answer distribution (expected score).
 */

const EPSILON = 1e-6;

/**
 * Wire caps on what one classifier call may send as `state` — the decision
 * model must never see a huge dataset (owner word 2026-11-26).
 *
 *   - MAX_STATE_CHARS: codepoints ("chars") kept per string value sent in
 *     state. The cut keeps the head and the tail with an in-band marker
 *     between them, so the end of a transcript never silently disappears
 *     and a cut is never mistaken for the model's own text.
 *   - MAX_STATE_ARRAY_ITEMS: items kept per array value (head + tail items,
 *     marker element between). Objects and arrays are walked recursively;
 *     every string inside is cut to MAX_STATE_CHARS.
 *   - MAX_STATE_BYTES: utf-8 bytes of the whole serialized state — the
 *     hard backstop. If the capped state still serializes larger than
 *     this, the serialized text is replaced by a string cut to this byte
 *     budget (head + bytes-dropped marker + tail). The walk below already
 *     keeps every state within this budget (see MAX_STATE_NODES and the
 *     walk's size estimate), so the backstop fires only as a last resort
 *     (non-ASCII text: utf-16 lengths under-count utf-8 bytes).
 *   - MAX_STATE_DEPTH: object/array levels the walk descends; a container
 *     deeper than this becomes a DEPTH_MARKER string, never recursed into.
 *   - MAX_STATE_NODES: keys + scalar leaves the walk may write in total;
 *     once gone, every value still unwritten becomes a STATE_LIMIT_MARKER
 *     and nothing further is expanded, so a DAG of shared references or a
 *     simply huge state cannot explode the walk or the stack.
 *
 * No cut ever splits a utf-8 codepoint: char cuts walk codepoints with
 * Array.from, and the byte cut accumulates whole codepoints within each
 * byte budget (never a surrogate half).
 */
export const MAX_STATE_CHARS = 6000;

/** Items kept (head + tail) per array value sent in state. */
export const MAX_STATE_ARRAY_ITEMS = 100;

/** Codepoints ("chars") kept per object key sent in state. */
export const MAX_STATE_KEY_CHARS = 120;

/** Keys kept (head + tail) per object value sent in state; one marker key
 * stands in for the omitted rest. */
export const MAX_STATE_OBJECT_KEYS = 100;

/** Hard utf-8 byte ceiling on the serialized state (wire backstop). */
export const MAX_STATE_BYTES = 32768;

/** Bytes held back from MAX_STATE_BYTES so the truncation marker always fits. */
const TRUNCATION_MARKER_RESERVE_BYTES = 80;

/** Object/array levels the walk descends; a container at this depth or
 * beyond becomes DEPTH_MARKER and is never recursed into (scalar leaves
 * are bounded by the node and size budgets, not the depth). */
export const MAX_STATE_DEPTH = 24;

/** Keys + scalar leaves the walk may write in total; once gone, every
 * value still unwritten becomes STATE_LIMIT_MARKER with nothing further
 * expanded (a shared-reference DAG cannot explode the walk or the stack). */
export const MAX_STATE_NODES = 5000;

/** In-band marker replacing a container past the depth cap. */
export const DEPTH_MARKER = '[depth limit]';

/** In-band marker replacing any value the exhausted walk budget never wrote. */
export const STATE_LIMIT_MARKER = '[state limit]';

/** In-band marker replacing a cyclic reference (an object that is its own ancestor). */
const CYCLE_MARKER = '…[semtext focus: cyclic reference omitted]…';

/** Walk size trigger: the byte backstop's own constant minus the reserve
 * its marker needs, minus room for the STATE_LIMIT_MARKER entries that are
 * still written after the budget trips (one per unwritten value of the
 * objects already open). A pathological breadth of open objects can still
 * pass this room — the byte backstop stays the last resort for that. */
const STATE_LIMIT_MARKER_HEADROOM_CHARS = 4096;
const STATE_WALK_SIZE_CHARS = MAX_STATE_BYTES - TRUNCATION_MARKER_RESERVE_BYTES - STATE_LIMIT_MARKER_HEADROOM_CHARS;

function truncationMarker(dropped, unit) {
  return ` …[semtext focus: ${dropped} ${unit} dropped]… `;
}

/** utf-8 bytes one codepoint encodes to (lone surrogates cannot occur in
 * valid text and JSON-escape to 6 ASCII bytes, an acceptable over-count). */
function utf8Bytes(cp) {
  return cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
}

/**
 * Codepoint head+tail cut of one string to `maxChars` codepoints; the
 * marker (which rides on top of the cap) counts the dropped chars.
 * Returns `{ value, dropped }` — dropped === 0 means no cut.
 */
export function capStateString(s, maxChars = MAX_STATE_CHARS) {
  const cps = Array.from(s);
  if (cps.length <= maxChars) return { value: s, dropped: 0 };
  const headLen = Math.ceil(maxChars / 2);
  const tailLen = maxChars - headLen;
  const dropped = cps.length - headLen - tailLen;
  const value =
    cps.slice(0, headLen).join('') +
    truncationMarker(dropped, 'chars') +
    cps.slice(cps.length - tailLen).join('');
  return { value, dropped };
}

/**
 * Byte-budgeted head+tail cut of an already-serialized state string to
 * `maxBytes` utf-8 bytes. Walks codepoints and accumulates whole
 * codepoints within each byte budget, so the cut never splits a codepoint
 * (nor a surrogate pair). The marker counts dropped bytes.
 */
export function capSerializedState(serialized, maxBytes = MAX_STATE_BYTES) {
  if (typeof serialized !== 'string') {
    // JSON.stringify yields undefined for a top-level undefined, function or
    // symbol state — fail with one clear error before any request instead of
    // throwing from the middle of the walk below.
    throw new ClassifierError(
      'classifier state is not JSON-serializable (undefined, function or symbol) — the endpoint requires a state'
    );
  }
  let total = 0;
  for (const ch of serialized) total += utf8Bytes(ch.codePointAt(0));
  if (total <= maxBytes) return { value: serialized, dropped: 0 };
  const keep = maxBytes - TRUNCATION_MARKER_RESERVE_BYTES;
  const headBudget = Math.ceil(keep / 2);
  const tailBudget = keep - headBudget;
  const cps = Array.from(serialized);
  let headEnd = 0;
  let headBytes = 0;
  while (headEnd < cps.length) {
    const b = utf8Bytes(cps[headEnd].codePointAt(0));
    if (headBytes + b > headBudget) break;
    headBytes += b;
    headEnd++;
  }
  let tailStart = cps.length;
  let tailBytes = 0;
  while (tailStart > headEnd) {
    const b = utf8Bytes(cps[tailStart - 1].codePointAt(0));
    if (tailBytes + b > tailBudget) break;
    tailBytes += b;
    tailStart--;
  }
  const dropped = total - headBytes - tailBytes;
  const value =
    cps.slice(0, headEnd).join('') +
    truncationMarker(dropped, 'bytes') +
    cps.slice(tailStart).join('');
  return { value, dropped };
}

/**
 * Walking budget shared across one capStateValue walk: recursion depth,
 * nodes (keys + scalar leaves) written, a running serialized-size estimate,
 * and latches so the depth/limit cuts are noted once, not per occurrence.
 */
function stateWalkBudget() {
  return { depth: 0, nodes: 0, size: 0, exhausted: false, depthNoted: false };
}

/** Rough wire charge for one written value: string/key length plus a
 * cushion for the JSON punctuation around it, deliberately at or above the
 * real size for ASCII text so the running estimate never under-counts.
 * Non-ASCII can still under-count (a utf-16 unit may encode to 2–3 utf-8
 * bytes) — MAX_STATE_BYTES remains the hard backstop for that case. */
function walkCharge(value) {
  if (typeof value === 'string') return value.length + 4;
  if (typeof value === 'number') return String(value).length + 3;
  if (typeof value === 'boolean' || value === null) return 6;
  return 4; // container opening brackets, cushioned
}

/** True when writing a value of `charge` would pass the walk budget —
 * already exhausted, node budget gone, or the size estimate would cross
 * the byte trigger. */
function budgetGone(ctx, charge = 0) {
  return ctx.exhausted || ctx.nodes >= MAX_STATE_NODES || ctx.size + charge > STATE_WALK_SIZE_CHARS;
}

/** Replace an unwritten value with STATE_LIMIT_MARKER; the cut is noted once. */
function limitMarker(ctx, cuts) {
  if (!ctx.exhausted) {
    cuts.push('state limit');
    ctx.exhausted = true;
  }
  ctx.nodes++;
  ctx.size += 20; // quotes + "[state limit]" + comma, cushioned
  return STATE_LIMIT_MARKER;
}

/**
 * Recursive wire cap on a classifier state. Every string is cut to
 * MAX_STATE_CHARS (head + tail), every array keeps MAX_STATE_ARRAY_ITEMS
 * head+tail items with a marker element between, object keys are cut to
 * MAX_STATE_KEY_CHARS and each object keeps MAX_STATE_OBJECT_KEYS
 * head+tail keys with one marker key standing in for the omitted rest,
 * and scalars pass through.
 *
 * The walk itself is bounded, so no input can blow it up:
 *   - an object that is one of its own ancestors (a cycle) is replaced by
 *     CYCLE_MARKER instead of recursing forever — a shared but acyclic
 *     reference is serialized again in full;
 *   - a container at MAX_STATE_DEPTH or beyond becomes DEPTH_MARKER and is
 *     never recursed into;
 *   - MAX_STATE_NODES bounds the keys + scalar leaves written, and a
 *     running size estimate (walkCharge) triggers at the byte constant:
 *     once the budget is gone, every value still unwritten becomes
 *     STATE_LIMIT_MARKER and nothing further is expanded — JSON.stringify
 *     therefore only ever runs on a structure already known to fit, and
 *     the MAX_STATE_BYTES backstop remains a last resort.
 *
 * `cuts` collects one note per cut that happened anywhere in the walk.
 */
function capStateValue(input, cuts, seen = new WeakSet(), ctx = stateWalkBudget()) {
  if (typeof input === 'string') {
    if (budgetGone(ctx, input.length + 4)) return limitMarker(ctx, cuts);
    const { value, dropped } = capStateString(input);
    if (dropped > 0) cuts.push(`string −${dropped} chars`);
    ctx.nodes++;
    ctx.size += value.length + 4;
    return value;
  }
  if (input && typeof input === 'object') {
    // `seen` holds the CURRENT recursion path only: an object met again
    // while still on the path is a cycle; off the path it is a legitimate
    // shared reference and is capped again in full.
    if (seen.has(input)) {
      cuts.push('cycle');
      return CYCLE_MARKER;
    }
    if (ctx.depth >= MAX_STATE_DEPTH) {
      if (!ctx.depthNoted) {
        cuts.push(`depth > ${MAX_STATE_DEPTH} levels`);
        ctx.depthNoted = true;
      }
      return DEPTH_MARKER;
    }
    if (budgetGone(ctx)) return limitMarker(ctx, cuts);
    seen.add(input);
    ctx.depth++;
    ctx.size += 4; // opening bracket(s) of this container, cushioned
    const capped = Array.isArray(input)
      ? capStateArray(input, cuts, seen, ctx)
      : capStateObject(input, cuts, seen, ctx);
    ctx.depth--;
    seen.delete(input);
    return capped;
  }
  // number / boolean / null (and the passthrough non-serializables below,
  // which capSerializedState rejects before any request)
  if (budgetGone(ctx, walkCharge(input))) return limitMarker(ctx, cuts);
  ctx.nodes++;
  ctx.size += walkCharge(input);
  return input;
}

function capStateArray(arr, cuts, seen, ctx) {
  const cap = (v) => capStateValue(v, cuts, seen, ctx);
  if (arr.length <= MAX_STATE_ARRAY_ITEMS) return arr.map(cap);
  const headLen = Math.ceil(MAX_STATE_ARRAY_ITEMS / 2);
  const tailLen = MAX_STATE_ARRAY_ITEMS - headLen;
  const dropped = arr.length - headLen - tailLen;
  cuts.push(`array −${dropped} items`);
  return [
    ...arr.slice(0, headLen).map(cap),
    truncationMarker(dropped, 'items').trim(),
    ...arr.slice(arr.length - tailLen).map(cap)
  ];
}

function capStateObject(obj, cuts, seen, ctx) {
  const keys = Object.keys(obj);
  let keptKeys = keys;
  let omittedMarker = null;
  if (keys.length > MAX_STATE_OBJECT_KEYS) {
    const headLen = Math.ceil(MAX_STATE_OBJECT_KEYS / 2);
    const tailLen = MAX_STATE_OBJECT_KEYS - headLen;
    omittedMarker = truncationMarker(keys.length - MAX_STATE_OBJECT_KEYS, 'keys').trim();
    keptKeys = [...keys.slice(0, headLen), omittedMarker, ...keys.slice(keys.length - tailLen)];
  }
  const out = {};
  for (const key of keptKeys) {
    if (key === omittedMarker) {
      out[key] = null; // the marker key carries its own count; null keeps it on the wire
      continue;
    }
    const { value: name, dropped } = capStateString(key, MAX_STATE_KEY_CHARS);
    if (dropped > 0) cuts.push(`key −${dropped} chars`);
    ctx.nodes++;
    ctx.size += name.length + 8; // the key itself always goes on the wire
    if (budgetGone(ctx, walkCharge(obj[key]))) {
      out[name] = limitMarker(ctx, cuts); // its value is replaced, never expanded
      continue;
    }
    out[name] = capStateValue(obj[key], cuts, seen, ctx);
  }
  return out;
}

export class ClassifierError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ClassifierError';
    this.envHint = options.envHint || null;
  }
}

/** `<base>/systemone` without duplicating an existing v1/operation suffix. */
export function systemOneEndpoint(base) {
  if (!base || typeof base !== 'string') throw new ClassifierError('classifier base URL is missing');
  let url;
  try {
    url = new URL(base);
  } catch {
    throw new ClassifierError(`classifier base URL is not a valid URL: ${base}`);
  }
  if (!/^https?:$/.test(url.protocol) || !url.host || url.username || url.password || url.search || url.hash) {
    throw new ClassifierError(`classifier base URL must be a plain http(s) endpoint: ${base}`);
  }
  const path = (url.pathname || '').replace(/\/+$/, '').replace(/\/(systemone|models)$/, '');
  url.pathname = path + '/systemone';
  return url.toString();
}

/** Focus question shape → System One wire question. */
export function encodeQuestion(q) {
  if (q.type === 'boolean') {
    return { type: 'noul', instructions: q.instructions || 'Is the statement true?' };
  }
  if (q.type === 'choice') {
    const ids = q.options.map((o) => o.id);
    if (ids.length > 255) throw new ClassifierError('choice question exceeds 255 options');
    if (new Set(ids).size !== ids.length) throw new ClassifierError('choice question has duplicate option ids');
    const criteria = {};
    for (const o of q.options) criteria[o.id] = String(o.label).slice(0, 255);
    return {
      type: 'choice',
      instructions: q.instructions || 'Which option best describes the state?',
      criteria
    };
  }
  if (q.type === 'score') {
    const labels = (q.levels || []).map((l) => l.label);
    if (labels.length > 10) throw new ClassifierError('score question exceeds 10 levels');
    return {
      type: 'score',
      instructions: q.instructions || 'Which rubric level best describes the state?',
      criteria: labels
    };
  }
  throw new ClassifierError(`unknown question type "${q.type}"`);
}

function probabilityOk(v) {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
}

function weightedIndex(values) {
  let total = 0;
  for (let i = 0; i < values.length; i++) total += values[i] * i;
  return total;
}

function sum(values) {
  return values.reduce((a, b) => a + b, 0);
}

/**
 * Canonicalise a hundredths-rounded wire distribution (port of
 * GenAI.Provider.SystemOne.Rounded). Returns the unit-normalised values or
 * null when the wire shape cannot be a rounded estimate.
 */
export function normalizeRoundedHundredths(values, type, nativeScore) {
  const count = values.length;
  const eps = 1e-10;
  const halfStep = 0.005;
  const grid = (v) => Math.abs(v * 100 - Math.round(v * 100)) <= eps;
  const allProb = values.every(probabilityOk);
  if (count < 2 || count > 10 || !allProb) return null;
  const total = sum(values);
  if (!(total > 0)) return null;
  if (!values.every(grid)) return null;
  if (Math.abs(total - 1) > Math.min(count * halfStep, 0.01) + eps) return null;
  const bounds = values.map((v) => [Math.max(0, v - halfStep), Math.min(1, v + halfStep)]);
  if (!bounds.every(([lo, hi]) => lo <= hi)) return null;
  const lowerSum = sum(bounds.map((b) => b[0]));
  const upperSum = sum(bounds.map((b) => b[1]));
  if (lowerSum > 1 + eps || upperSum < 1 - eps) return null;
  const attainableMean = (descending) => {
    let indexed = bounds.map((b, i) => [b, i]);
    if (descending) indexed = indexed.slice().reverse();
    let mass = Math.max(0, 1 - lowerSum);
    let mean = 0;
    for (const [[lo, hi], i] of indexed) {
      const extra = Math.min(mass, hi - lo);
      mass = Math.max(0, mass - extra);
      mean += (lo + extra) * i;
    }
    return mean;
  };
  if (type === 'score') {
    const minimum = attainableMean(false);
    const maximum = attainableMean(true);
    const okScore =
      typeof nativeScore === 'number' &&
      Number.isFinite(nativeScore) &&
      nativeScore >= 0 &&
      nativeScore <= count - 1 &&
      grid(nativeScore) &&
      nativeScore >= minimum - halfStep - eps &&
      nativeScore <= maximum + halfStep + eps;
    if (!okScore) return null;
  }
  return values.map((v) => v / total);
}

/**
 * Decode one wire response against the questions. `policy` is
 * 'strict' | 'alibaba_rounded_hundredths'; `threshold` gates booleans
 * (noul probability > threshold → true, strict greater-than).
 */
export function decodeAnswers(json, questions, policy, threshold = 0.5) {
  const answers = json && json.answers;
  if (!answers || typeof answers !== 'object') throw new ClassifierError('classifier response has no answers map');
  const expected = questions.map((q) => q.id).sort();
  const received = Object.keys(answers).sort();
  if (expected.length !== received.length || expected.some((v, i) => v !== received[i])) {
    throw new ClassifierError(`classifier response question ids do not match the request (${received.join(',')} ≠ ${expected.join(',')})`);
  }
  const out = {};
  for (const q of questions) {
    const wire = answers[q.id];
    if (!wire || typeof wire !== 'object') throw new ClassifierError(`classifier answer "${q.id}" is malformed`);
    if (q.type === 'boolean') {
      const p = wire.noul;
      if (!probabilityOk(p)) throw new ClassifierError(`classifier answer "${q.id}" has no valid noul probability`);
      out[q.id] = {
        type: 'boolean',
        value: p > threshold,
        probability: p,
        confidence: probabilityOk(wire.confidence) ? wire.confidence : undefined
      };
      continue;
    }
    if (q.type === 'choice') {
      const ids = q.options.map((o) => o.id);
      const index = ids.indexOf(wire.choice);
      if (index < 0) throw new ClassifierError(`classifier answer "${q.id}" chose an unknown option`);
      const wireMap = wire.probabilities;
      let values = null;
      if (wireMap && typeof wireMap === 'object' && ids.every((id) => probabilityOk(wireMap[id])) && Object.keys(wireMap).length === ids.length) {
        const vals = ids.map((id) => wireMap[id]);
        const meanCheck = Math.abs(sum(vals) - 1) <= EPSILON;
        if (policy === 'alibaba_rounded_hundredths') {
          if (meanCheck) values = vals;
          else values = normalizeRoundedHundredths(vals, 'choice', undefined);
        } else if (meanCheck) {
          values = vals;
        }
      }
      if (!values) throw new ClassifierError(`classifier answer "${q.id}" has an invalid probability distribution`);
      const max = Math.max(...values);
      if (values[index] + EPSILON < max) {
        throw new ClassifierError(`classifier answer "${q.id}" chose an option that is not the distribution maximum`);
      }
      out[q.id] = {
        type: 'choice',
        value: ids[index],
        index,
        probability: values[index],
        confidence: probabilityOk(wire.confidence) ? wire.confidence : undefined
      };
      continue;
    }
    if (q.type === 'score') {
      const n = q.levels.length;
      const indices = Array.from({ length: n }, (_, i) => String(i));
      const wireMap = wire.probabilities;
      const legend = wire.legend;
      const legendOk =
        legend &&
        typeof legend === 'object' &&
        indices.every((k) => legend[k] === q.levels[i2(k)].label);
      if (!legendOk) throw new ClassifierError(`classifier answer "${q.id}" legend does not match the rubric`);
      let values = null;
      if (
        wireMap &&
        typeof wireMap === 'object' &&
        Object.keys(wireMap).length === n &&
        indices.every((k) => probabilityOk(wireMap[k]))
      ) {
        const vals = indices.map((k) => wireMap[k]);
        const nativeMean = weightedIndex(vals);
        const scoreOk =
          typeof wire.score === 'number' &&
          Number.isFinite(wire.score) &&
          wire.score >= 0 &&
          wire.score <= n - 1;
        if (!scoreOk) {
          // fall through to rounded validation below, which re-checks score
        }
        if (policy === 'alibaba_rounded_hundredths') {
          if (scoreOk && Math.abs(nativeMean - wire.score) <= EPSILON * Math.max(1, Math.abs(nativeMean))) {
            values = vals;
          } else {
            values = normalizeRoundedHundredths(vals, 'score', typeof wire.score === 'number' ? wire.score : NaN);
          }
        } else if (
          scoreOk &&
          Math.abs(nativeMean - wire.score) <= EPSILON * Math.max(1, Math.abs(nativeMean))
        ) {
          values = vals;
        }
      }
      if (!values) throw new ClassifierError(`classifier answer "${q.id}" has an invalid score distribution`);
      // Map the answer index onto the caller's numeric scale: expected
      // score = Σ p(level) * level.score (levels carry normalized 0..1 scores).
      const expectedScore = q.levels.reduce((acc, level, i) => acc + values[i] * level.score, 0);
      out[q.id] = {
        type: 'score',
        value: expectedScore,
        expectedIndex: weightedIndex(values),
        distribution: values,
        confidence: probabilityOk(wire.confidence) ? wire.confidence : undefined
      };
      continue;
    }
    throw new ClassifierError(`unknown question type "${q.type}"`);
  }
  return out;
}

function i2(i) {
  return Number(i);
}

/**
 * One classify round-trip. `settings` = classifierSettings() shape
 * ({provider, base, key, model, policy, keyEnv, baseEnv}); `questions` =
 * focus question array. Returns the decoded answers map — a fixed wire
 * shape with no room for a truncation flag — so state capping is reported
 * via one stderr line plus the in-band `…[semtext focus: N unit dropped]…`
 * markers left in what was sent. Throws ClassifierError (with .envHint) on
 * missing credentials or wire errors.
 */
export async function classify({ settings, input, questions, threshold = 0.5, fetchImpl, timeoutMs = 60000 }) {
  if (!settingsReady(settings)) {
    throw new ClassifierError(
      `classifier "${settings.provider}" is not configured — ${settingsHint(settings)} (or rerun with --no-llm)`,
      { envHint: settingsHint(settings) }
    );
  }
  const wireQuestions = {};
  for (const q of questions) wireQuestions[q.id] = encodeQuestion(q);
  const cuts = [];
  let state = capStateValue(input, cuts);
  let serialized;
  try {
    serialized = JSON.stringify(state);
  } catch (e) {
    throw new ClassifierError(`classifier state is not JSON-serializable — ${e && e.message ? e.message : e}`);
  }
  const byteCut = capSerializedState(serialized);
  if (byteCut.dropped > 0) {
    state = byteCut.value;
    cuts.push(`serialized state −${byteCut.dropped} bytes`);
  }
  if (cuts.length > 0) {
    console.error(`[semtext focus] classifier state truncated: ${cuts.join('; ')}`);
  }
  const body = { model: settings.model, state, questions: wireQuestions };
  const doFetch = fetchImpl || globalThis.fetch;
  if (!doFetch) throw new ClassifierError('no fetch implementation available (Node >= 18 required)');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await doFetch(systemOneEndpoint(settings.base), {
      method: 'POST',
      headers: { authorization: 'Bearer ' + settings.key, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch (e) {
    throw new ClassifierError(`classifier transport error — ${e && e.message ? e.message : e}`);
  } finally {
    clearTimeout(timer);
  }
  if (res.status !== 200) throw new ClassifierError(`classifier HTTP ${res.status} from ${settings.provider}`);
  let json;
  try {
    json = await res.json();
  } catch {
    throw new ClassifierError('classifier response is not valid JSON');
  }
  return decodeAnswers(json, questions, settings.policy, threshold);
}

function settingsReady(s) {
  return !!(s.key && s.base);
}

function settingsHint(s) {
  const parts = [];
  if (s.keyEnv && s.keyEnv.length) parts.push(`set ${s.keyEnv.join(' or ')}`);
  if (s.baseEnv) parts.push(`set ${s.baseEnv}`);
  return parts.join(' and ');
}
