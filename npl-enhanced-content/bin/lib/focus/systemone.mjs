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
 * and the serialized state is produced by a bounded JSON writer that
 * measures real utf-8 bytes as it writes and stops within MAX_STATE_BYTES.
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
 *   - MAX_STATE_BYTES: utf-8 bytes of the whole serialized state. The
 *     bounded writer below charges Buffer.byteLength of every piece as it
 *     writes it and stops admitting values once STATE_WRITE_BUDGET_BYTES
 *     is reached; markers and closers finish the structure within the
 *     closing reserve — the output is valid JSON of at most this many
 *     bytes by construction, and JSON.stringify is never called on the
 *     whole input structure (only on individual capped strings).
 *   - MAX_STATE_DEPTH: object/array levels the walk descends; a container
 *     deeper than this becomes a DEPTH_MARKER string, never recursed into.
 *   - MAX_STATE_NODES: keys + scalar leaves the writer may emit in total;
 *     once gone, no further values are expanded (a second guard beside
 *     the byte budget) so a DAG of shared references or a simply huge
 *     state cannot explode the walk or the stack.
 *
 * No cut ever splits a utf-8 codepoint: char cuts walk codepoints with
 * Array.from, and the writer charges whole utf-8 bytes per piece (never a
 * surrogate half).
 */
export const MAX_STATE_CHARS = 6000;

/** Items kept (head + tail) per array value sent in state. */
export const MAX_STATE_ARRAY_ITEMS = 100;

/** Codepoints ("chars") kept per object key sent in state. */
export const MAX_STATE_KEY_CHARS = 120;

/** Keys kept (head + tail) per object value sent in state; one marker key
 * stands in for the omitted rest. */
export const MAX_STATE_OBJECT_KEYS = 100;

/** Hard utf-8 byte ceiling on the serialized state. */
export const MAX_STATE_BYTES = 32768;

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

/** Bytes held back from MAX_STATE_BYTES for the closing phase: once the
 * value budget is gone, each open container still gets one `"cut":
 * "[state limit]"` marker (a bare `"[state limit]"` in arrays) as its last
 * member plus its closing bracket — worst case MAX_STATE_DEPTH × 23 ≈ 552
 * bytes, plus the closers of containers that finish normally (≤ 24). The
 * reserve only limits how far into the budget values may go; markers and
 * closers are charged like every other piece, so the output stays within
 * MAX_STATE_BYTES by construction. */
const CLOSING_RESERVE_BYTES = 1024;
const STATE_WRITE_BUDGET_BYTES = MAX_STATE_BYTES - CLOSING_RESERVE_BYTES;

function truncationMarker(dropped, unit) {
  return ` …[semtext focus: ${dropped} ${unit} dropped]… `;
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
 * Bounded JSON writer for one classifier state. The state's JSON text is
 * written piece by piece while the real utf-8 length of every piece is
 * charged against STATE_WRITE_BUDGET_BYTES — the size is measured as it is
 * produced, so no JSON.stringify ever runs on the whole input structure
 * and the output can never pass MAX_STATE_BYTES.
 *
 *   - strings are cut to MAX_STATE_CHARS codepoints (head + tail) by
 *     capStateString, escaped alone with JSON.stringify, and admitted by
 *     their exact escaped length; one that does not fit is replaced by a
 *     short STATE_LIMIT_MARKER string at its position (when even that no
 *     longer fits, the closing marker of its container stands in for it);
 *   - object keys are cut to MAX_STATE_KEY_CHARS and every member is
 *     written atomically (prefix + value), so the text is valid JSON at
 *     every point;
 *   - containers keep the cycle detection (an object that is one of its
 *     own ancestors becomes CYCLE_MARKER — a shared but acyclic reference
 *     is written again in full, bounded by the byte budget), the depth
 *     cap and the node budget; once the budget is gone nothing more is
 *     written except markers and closers: on the way out, each open
 *     container gets one `"cut": "[state limit]"` marker (bare in arrays)
 *     as its last member and then its closing bracket.
 *
 * `cuts` collects one note per cut that happened anywhere in the write.
 * Returns the JSON text: valid JSON, at most MAX_STATE_BYTES utf-8 bytes.
 */
export function serializeStateJson(input, cuts = []) {
  if (input === undefined || typeof input === 'function' || typeof input === 'symbol' || typeof input === 'bigint') {
    // JSON.stringify yields undefined for such a top-level state — fail
    // with one clear error before any request instead of mid-write.
    throw new ClassifierError(
      'classifier state is not JSON-serializable (undefined, function or symbol) — the endpoint requires a state'
    );
  }
  const ctx = { pieces: [], bytes: 0, nodes: 0, depth: 0, exhausted: false, depthNoted: false, seen: new WeakSet() };
  writeValue(ctx, input, cuts, '');
  if (ctx.pieces.length === 0) emit(ctx, JSON.stringify(STATE_LIMIT_MARKER)); // defensive: a bare marker is still valid JSON
  return ctx.pieces.join('');
}

/** Append one piece unconditionally, charging its real utf-8 bytes. Used
 * for markers and closers: exempt from the value budget (they are what
 * CLOSING_RESERVE_BYTES holds room for) but still accounted, so the byte
 * count stays exact. */
function emit(ctx, piece) {
  ctx.bytes += Buffer.byteLength(piece);
  ctx.pieces.push(piece);
}

/** Note the state-limit cut once and stop admitting further values. */
function noteLimit(ctx, cuts) {
  if (!ctx.exhausted) {
    cuts.push('state limit');
    ctx.exhausted = true;
  }
}

/** True when one more value of `cost` bytes may still be written: not yet
 * exhausted, node budget left, and the value stays within the write
 * budget (the reserve is reserved for markers and closers). */
function fits(ctx, cost) {
  return !ctx.exhausted && ctx.nodes < MAX_STATE_NODES && ctx.bytes + cost <= STATE_WRITE_BUDGET_BYTES;
}

/** Admit one JSON-encoded scalar piece (`text`) with its member prefix,
 * or stop the budget when it does not fit. Returns true when written. */
function writeScalarText(ctx, cuts, prefix, prefixCost, text) {
  if (fits(ctx, prefixCost + Buffer.byteLength(text))) {
    emit(ctx, prefix + text);
    ctx.nodes += 2; // the key (if any) and the value
    return true;
  }
  noteLimit(ctx, cuts);
  return false;
}

/**
 * Write `prefix + value` — a complete member, or a bare root value when
 * the prefix is ''. `prefix` carries the separating comma, the escaped
 * key and the colon for object members, or just the separating comma for
 * array elements, so a member is written whole or not at all and the text
 * is valid JSON at every point. Returns true when something was written.
 */
function writeValue(ctx, input, cuts, prefix) {
  const prefixCost = Buffer.byteLength(prefix);
  if (typeof input === 'string') {
    const { value, dropped } = capStateString(input);
    if (dropped > 0) cuts.push(`string −${dropped} chars`);
    const text = JSON.stringify(value); // escape only the capped string
    if (fits(ctx, prefixCost + Buffer.byteLength(text))) {
      emit(ctx, prefix + text);
      ctx.nodes += 2;
      return true;
    }
    const markerCost = prefixCost + Buffer.byteLength(STATE_LIMIT_MARKER);
    if (fits(ctx, markerCost)) {
      // a short marker string in place of the string that did not fit
      noteLimit(ctx, cuts);
      emit(ctx, prefix + JSON.stringify(STATE_LIMIT_MARKER));
      ctx.nodes += 2;
      return true;
    }
    noteLimit(ctx, cuts);
    return false;
  }
  if (typeof input === 'number') {
    return writeScalarText(ctx, cuts, prefix, prefixCost, Number.isFinite(input) ? String(input) : 'null');
  }
  if (typeof input === 'boolean') return writeScalarText(ctx, cuts, prefix, prefixCost, input ? 'true' : 'false');
  if (input === null) return writeScalarText(ctx, cuts, prefix, prefixCost, 'null');
  if (input === undefined || typeof input === 'function' || typeof input === 'symbol') {
    return false; // JSON.stringify drops these members / nulls these elements — the caller decides
  }
  if (typeof input === 'bigint') {
    throw new ClassifierError('classifier state is not JSON-serializable — Do not know how to serialize a BigInt');
  }
  // object or array
  if (ctx.seen.has(input)) {
    cuts.push('cycle');
    return writeScalarText(ctx, cuts, prefix, prefixCost, JSON.stringify(CYCLE_MARKER));
  }
  if (ctx.depth >= MAX_STATE_DEPTH) {
    if (!ctx.depthNoted) {
      cuts.push(`depth > ${MAX_STATE_DEPTH} levels`);
      ctx.depthNoted = true;
    }
    return writeScalarText(ctx, cuts, prefix, prefixCost, JSON.stringify(DEPTH_MARKER));
  }
  if (!fits(ctx, prefixCost + 2)) {
    noteLimit(ctx, cuts); // no room even to open this container (and close it)
    return false;
  }
  ctx.nodes += 2; // the key (if any) and the container
  ctx.seen.add(input);
  ctx.depth++;
  const isArray = Array.isArray(input);
  emit(ctx, prefix + (isArray ? '[' : '{'));
  const wrote = isArray ? writeArrayItems(ctx, input, cuts) : writeObjectMembers(ctx, input, cuts);
  if (ctx.exhausted) {
    // each open container that was cut gets one marker as its last member
    const marker = isArray ? JSON.stringify(STATE_LIMIT_MARKER) : '"cut":' + JSON.stringify(STATE_LIMIT_MARKER);
    emit(ctx, (wrote ? ',' : '') + marker);
  }
  emit(ctx, isArray ? ']' : '}');
  ctx.depth--;
  ctx.seen.delete(input);
  return true;
}

function writeArrayItems(ctx, arr, cuts) {
  let wrote = false;
  const writeItem = (item) => {
    const result = writeValue(ctx, item, cuts, wrote ? ',' : '');
    wrote = wrote || result;
  };
  if (arr.length <= MAX_STATE_ARRAY_ITEMS) {
    for (const item of arr) {
      if (ctx.exhausted) break;
      if (item === undefined || typeof item === 'function' || typeof item === 'symbol') {
        writeItem(null); // JSON.stringify nulls non-serializable array elements
        continue;
      }
      writeItem(item);
    }
    return wrote;
  }
  const headLen = Math.ceil(MAX_STATE_ARRAY_ITEMS / 2);
  const tailLen = MAX_STATE_ARRAY_ITEMS - headLen;
  const dropped = arr.length - headLen - tailLen;
  cuts.push(`array −${dropped} items`);
  for (const item of arr.slice(0, headLen)) {
    if (ctx.exhausted) break;
    writeItem(item);
  }
  if (!ctx.exhausted) writeItem(truncationMarker(dropped, 'items').trim());
  for (const item of arr.slice(arr.length - tailLen)) {
    if (ctx.exhausted) break;
    writeItem(item);
  }
  return wrote;
}

function writeObjectMembers(ctx, obj, cuts) {
  const keys = Object.keys(obj);
  let keptKeys = keys;
  let omittedMarker = null;
  if (keys.length > MAX_STATE_OBJECT_KEYS) {
    const headLen = Math.ceil(MAX_STATE_OBJECT_KEYS / 2);
    const tailLen = MAX_STATE_OBJECT_KEYS - headLen;
    omittedMarker = truncationMarker(keys.length - MAX_STATE_OBJECT_KEYS, 'keys').trim();
    keptKeys = [...keys.slice(0, headLen), omittedMarker, ...keys.slice(keys.length - tailLen)];
  }
  let wrote = false;
  for (const key of keptKeys) {
    if (ctx.exhausted) break;
    if (key === omittedMarker) {
      // the marker key carries its own count; null keeps it on the wire
      const prefix = (wrote ? ',' : '') + JSON.stringify(key) + ':';
      if (writeScalarText(ctx, cuts, prefix, Buffer.byteLength(prefix), 'null')) wrote = true;
      continue;
    }
    const { value: name, dropped } = capStateString(key, MAX_STATE_KEY_CHARS);
    if (dropped > 0) cuts.push(`key −${dropped} chars`);
    if (writeValue(ctx, obj[key], cuts, (wrote ? ',' : '') + JSON.stringify(name) + ':')) wrote = true;
  }
  return wrote;
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
  let state;
  try {
    // serializeStateJson produces the state's JSON text, bounded by
    // construction (≤ MAX_STATE_BYTES); parsing it back keeps `state` a
    // JSON value on the wire — the receiver's shape — without JSON.stringify
    // ever seeing the input structure. Parsing text the writer produced
    // cannot fail; the catch only forwards its ClassifierError.
    state = JSON.parse(serializeStateJson(input, cuts));
  } catch (e) {
    if (e instanceof ClassifierError) throw e;
    throw new ClassifierError(`classifier state is not JSON-serializable — ${e && e.message ? e.message : e}`);
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
