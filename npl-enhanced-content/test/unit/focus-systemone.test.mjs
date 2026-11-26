import { describe, expect, it } from 'vitest';
import {
  classify,
  MAX_STATE_ARRAY_ITEMS,
  MAX_STATE_BYTES,
  MAX_STATE_CHARS,
  MAX_STATE_KEY_CHARS,
  MAX_STATE_OBJECT_KEYS,
  systemOneEndpoint
} from '../../bin/lib/focus/systemone.mjs';
import { classifierSettings } from '../../bin/lib/focus/config.mjs';

const SETTINGS = classifierSettings({}, 'alibaba', {
  QWEN_API_KEY: 'fixture-key',
  QWEN_DECISION_BASE_URL: 'https://classifier.example/v1'
});

const QUESTIONS = [
  { id: 'task-match', type: 'choice', instructions: 'pick', options: [{ id: 'none', label: 'none' }] }
];

function wireAnswer() {
  return {
    status: 200,
    json: async () => ({
      model: 'decision-model',
      request_id: 'req-1',
      answers: {
        'task-match': { type: 'choice', choice: 'none', probabilities: { none: 1 }, confidence: 0.9 }
      }
    })
  };
}

/** Capture the state a classify call would put on the wire (no network). */
async function capturedState(input) {
  let captured = null;
  const fetchImpl = async (url, init) => {
    captured = { url, body: JSON.parse(init.body) };
    return wireAnswer();
  };
  await classify({ settings: SETTINGS, input, questions: QUESTIONS, fetchImpl });
  return captured;
}

/** A string of `n` distinct, distinguishable ASCII chars (cyclic alphabet). */
function asciiOf(n) {
  return Array.from({ length: n }, (_, i) => String.fromCharCode(0x41 + (i % 26))).join('');
}

/** True when `s` carries no lone surrogate (every codepoint is whole). */
function noLoneSurrogates(s) {
  for (const ch of Array.from(s)) {
    const cp = ch.codePointAt(0);
    if (cp >= 0xd800 && cp <= 0xdfff) return false;
  }
  return true;
}

describe('focus classifier model id + state cap', () => {
  it('alibaba classifier default model is the GA decision-model id', () => {
    expect(classifierSettings({}, 'alibaba', {}).model).toBe('decision-model');
  });

  it('classify caps a string state at MAX_STATE_CHARS keeping the head AND the tail', async () => {
    const input = asciiOf(MAX_STATE_CHARS + 3000);
    const { body } = await capturedState(input);
    expect(body.model).toBe('decision-model');
    expect(body.state).toContain('…[semtext focus: 3000 chars dropped]…');
    const headLen = Math.ceil(MAX_STATE_CHARS / 2);
    const tailLen = MAX_STATE_CHARS - headLen;
    expect(body.state.startsWith(input.slice(0, headLen))).toBe(true);
    expect(body.state.endsWith(input.slice(input.length - tailLen))).toBe(true);
    // exactly MAX_STATE_CHARS source chars survive, split around the marker
    const stripped = body.state.replace(/ …\[semtext focus: 3000 chars dropped\]… /, '');
    expect(stripped.length).toBe(MAX_STATE_CHARS);
  });

  it('a string cut never splits a surrogate pair (multibyte emoji)', async () => {
    const input = '🙂'.repeat(MAX_STATE_CHARS + 10); // astral codepoints = surrogate pairs
    const { body } = await capturedState(input);
    expect(body.state).toContain('…[semtext focus: 10 chars dropped]…');
    expect(noLoneSurrogates(body.state)).toBe(true);
    expect(body.state.startsWith('🙂'.repeat(Math.ceil(MAX_STATE_CHARS / 2)))).toBe(true);
    expect(body.state.endsWith('🙂'.repeat(MAX_STATE_CHARS - Math.ceil(MAX_STATE_CHARS / 2)))).toBe(true);
  });

  it('classify sends a short state unchanged', async () => {
    const { body } = await capturedState('deploy the service');
    expect(body.state).toBe('deploy the service');
  });

  it('small object and array states pass through uncapped', async () => {
    const input = { transcript: 'deploy the service', turns: ['a', 'b'] };
    const { body } = await capturedState(input);
    expect(body.state).toEqual(input);
  });

  it('caps every string nested inside an object or array state', async () => {
    const input = { transcript: asciiOf(7000), meta: { turns: [asciiOf(7000), 'keep'] } };
    const { body } = await capturedState(input);
    expect(typeof body.state).toBe('object');
    expect(body.state.transcript).toContain('…[semtext focus: 1000 chars dropped]…');
    expect(body.state.transcript.startsWith(asciiOf(3000))).toBe(true);
    expect(body.state.meta.turns[0]).toContain('…[semtext focus: 1000 chars dropped]…');
    expect(body.state.meta.turns[1]).toBe('keep');
  });

  it('limits the number of array items with a marker element between head and tail', async () => {
    const items = Array.from({ length: MAX_STATE_ARRAY_ITEMS + 5 }, (_, i) => `item-${i}`);
    const { body } = await capturedState(items);
    expect(Array.isArray(body.state)).toBe(true);
    expect(body.state.length).toBe(MAX_STATE_ARRAY_ITEMS + 1); // kept + marker element
    expect(body.state[0]).toBe('item-0');
    expect(body.state[body.state.length - 1]).toBe(`item-${items.length - 1}`);
    expect(body.state[Math.floor(MAX_STATE_ARRAY_ITEMS / 2)]).toBe('…[semtext focus: 5 items dropped]…');
  });

  it('byte backstop cuts the serialized state head+tail to MAX_STATE_BYTES (multibyte CJK)', async () => {
    // 100 array items x 6000 CJK chars = ~1.8 MB serialized >> 32 KiB cap
    const item = '日'.repeat(MAX_STATE_CHARS);
    const input = Array.from({ length: MAX_STATE_ARRAY_ITEMS }, () => item);
    const { body } = await capturedState(input);
    expect(typeof body.state).toBe('string');
    expect(body.state).toMatch(/…\[semtext focus: \d+ bytes dropped\]…/);
    const wireBytes = new TextEncoder().encode(body.state).length;
    expect(wireBytes).toBeLessThanOrEqual(MAX_STATE_BYTES);
    expect(noLoneSurrogates(body.state)).toBe(true); // byte cut never splits a codepoint
    const serialized = JSON.stringify(input);
    expect(body.state.startsWith(serialized.slice(0, 102))).toBe(true); // "[" + 100 CJK chars
    expect(body.state.endsWith(serialized.slice(-102))).toBe(true); // 100 CJK chars + closing quote/bracket
  });

  it('scalar states pass through', async () => {
    expect((await capturedState(42)).body.state).toBe(42);
    expect((await capturedState(null)).body.state).toBe(null);
  });

  it('a non-serializable state fails with one clear error before any request', async () => {
    let captured = null;
    const fetchImpl = async (_url, init) => {
      captured = { body: JSON.parse(init.body) };
      return wireAnswer();
    };
    await expect(
      classify({ settings: SETTINGS, input: undefined, questions: QUESTIONS, fetchImpl })
    ).rejects.toThrow(/not JSON-serializable/);
    expect(captured).toBeNull(); // no request was built or sent
  });

  it('a circular object state is capped — repeated references become a marker, no recursion blowup', async () => {
    const node = { label: 'self' };
    node.self = node;
    const { body } = await capturedState({ transcript: 'hello', node });
    expect(body.state.node.label).toBe('self');
    expect(body.state.node.self).toContain('cyclic reference omitted');
  });

  it('object keys are capped — long keys cut, thousands of keys kept head+tail with one marker key', async () => {
    const input = {};
    for (let i = 0; i < 3000; i++) input[`k${i}-` + 'L'.repeat(2000)] = 1;
    const { body } = await capturedState(input);
    const keys = Object.keys(body.state);
    expect(keys.length).toBe(MAX_STATE_OBJECT_KEYS + 1); // kept keys + the marker key
    const markerKey = keys.find((k) => k.includes('keys dropped'));
    expect(markerKey).toContain('…[semtext focus: 2900 keys dropped]…');
    expect(keys.every((k) => Array.from(k).length <= MAX_STATE_KEY_CHARS + 60)).toBe(true); // key cut + marker overhead
    expect(keys[0].startsWith('k0-')).toBe(true); // head keys survive
    expect(new TextEncoder().encode(JSON.stringify(body.state)).length).toBeLessThanOrEqual(MAX_STATE_BYTES);
  });
});
