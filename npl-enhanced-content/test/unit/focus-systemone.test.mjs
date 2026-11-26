import { describe, expect, it } from 'vitest';
import { classify, MAX_STATE_CHARS, systemOneEndpoint } from '../../bin/lib/focus/systemone.mjs';
import { classifierSettings } from '../../bin/lib/focus/config.mjs';

const SETTINGS = classifierSettings({}, 'alibaba', {
  QWEN_API_KEY: 'fixture-key',
  QWEN_DECISION_BASE_URL: 'https://classifier.example/v1'
});

describe('focus classifier model id + state cap', () => {
  it('alibaba classifier default model is the GA decision-model id', () => {
    expect(classifierSettings({}, 'alibaba', {}).model).toBe('decision-model');
  });

  it('classify caps a string state at MAX_STATE_CHARS, keeping the head', async () => {
    const input = 'x'.repeat(MAX_STATE_CHARS + 3000);
    let captured = null;
    const fetchImpl = async (url, init) => {
      captured = { url, body: JSON.parse(init.body) };
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
    };
    const questions = [
      { id: 'task-match', type: 'choice', instructions: 'pick', options: [{ id: 'none', label: 'none' }] }
    ];
    await classify({ settings: SETTINGS, input, questions, fetchImpl });
    expect(captured).not.toBeNull();
    expect(captured.url).toBe(systemOneEndpoint(SETTINGS.base));
    expect(captured.body.model).toBe('decision-model');
    expect(captured.body.state.length).toBe(MAX_STATE_CHARS);
    expect(captured.body.state).toBe(input.slice(0, MAX_STATE_CHARS));
  });

  it('classify sends a short state unchanged', async () => {
    const input = 'deploy the service';
    let captured = null;
    const fetchImpl = async (_url, init) => {
      captured = { body: JSON.parse(init.body) };
      return { status: 200, json: async () => ({ answers: { 'task-match': { type: 'choice', choice: 'none', probabilities: { none: 1 } } } }) };
    };
    const questions = [
      { id: 'task-match', type: 'choice', instructions: 'pick', options: [{ id: 'none', label: 'none' }] }
    ];
    await classify({ settings: SETTINGS, input, questions, fetchImpl });
    expect(captured.body.state).toBe(input);
  });
});
