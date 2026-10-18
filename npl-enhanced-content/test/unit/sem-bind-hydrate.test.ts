// @vitest-environment happy-dom
// Unit spec — src/lit/bind.ts · hydration (payload → light DOM). The
// same render pipe for every source: percent + step/steps progress
// forms, plan body + per-step status dictionary with comment and choice
// (single object = taken fork, array = walked sequence), sanitize rules,
// pass-through for unknown keys and unbound tags.
import { describe, it, expect, beforeEach } from 'vitest';
import { SemProgress } from '../../src/lit/sem-progress.js';
import {
  hydrateProgress,
  hydratePlan,
  hydrateFor,
  sanitizeMarkup,
  renderBindState,
} from '../../src/lit/bind.js';

const el = (tag: string, html = ''): HTMLElement => {
  const node = document.createElement(tag);
  node.innerHTML = html;
  document.body.appendChild(node);
  return node;
};

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('hydrateProgress — percent form', () => {
  it('renders bar + label :: NN% + comment', () => {
    const p = el('sem-progress');
    hydrateProgress(p, { percent: 42, comment: 'scouting repos' });
    const wrap = p.querySelector('.sem-bind-progress') as HTMLElement;
    expect(wrap).toBeTruthy();
    expect((p.querySelector('.sem-bind-progress-label') as HTMLElement).textContent).toBe('progress :: 42%');
    const fill = p.querySelector('.sem-progress-fill') as HTMLElement;
    expect(fill.style.width).toBe('42%');
    expect((p.querySelector('.sem-bind-comment') as HTMLElement).textContent).toBe('scouting repos');
  });

  it('honours the authored data-label and clamps out-of-range percents', () => {
    const p = el('sem-progress');
    p.setAttribute('data-label', 'kv table');
    hydrateProgress(p, { percent: 250 });
    expect((p.querySelector('.sem-bind-progress-label') as HTMLElement).textContent).toBe('kv table :: 100%');
    expect((p.querySelector('.sem-progress-fill') as HTMLElement).style.width).toBe('100%');
  });

  it('renders no comment line when the payload has none', () => {
    const p = el('sem-progress');
    hydrateProgress(p, { percent: 10 });
    expect(p.querySelector('.sem-bind-comment')).toBeNull();
  });
});

describe('hydrateProgress — step/steps form', () => {
  it('renders the fraction caption and the step/steps bar', () => {
    const p = el('sem-progress');
    hydrateProgress(p, { step: 3, steps: 7, comment: 'building KV table' });
    expect((p.querySelector('.sem-bind-progress-label') as HTMLElement).textContent).toBe('step 3 / 7');
    const width = (p.querySelector('.sem-progress-fill') as HTMLElement).style.width;
    expect(Math.round(parseFloat(width))).toBe(Math.round((3 / 7) * 100));
    expect((p.querySelector('.sem-bind-comment') as HTMLElement).textContent).toBe('building KV table');
  });

  it('rejects an unrecognized payload with the error state, never blank', () => {
    const p = el('sem-progress');
    hydrateProgress(p, { status: 'nope' });
    const state = p.querySelector('.sem-bind-state') as HTMLElement;
    expect(state.classList.contains('sem-bind-error')).toBe(true);
    expect(state.textContent).toContain('unrecognized progress payload');
  });

  it('re-hydration replaces the previous bar instead of appending', () => {
    const p = el('sem-progress');
    hydrateProgress(p, { percent: 10 });
    hydrateProgress(p, { percent: 90 });
    expect(p.querySelectorAll('.sem-bind-progress').length).toBe(1);
    expect((p.querySelector('.sem-progress-fill') as HTMLElement).style.width).toBe('90%');
  });
});

describe('hydratePlan — body + status dictionary', () => {
  const PLAN = [
    '<sem-procedure kind="runbook">',
    '<sem-step id="s1">step one</sem-step>',
    '<sem-step id="s2">step two</sem-step>',
    '<sem-step id="s3">step three</sem-step>',
    '<sem-step id="s4">step four</sem-step>',
    '</sem-procedure>',
  ].join('');

  it('applies the catalog mapping, comments, and the taken fork', () => {
    const plan = el('sem-procedure', PLAN);
    hydratePlan(plan, {
      status: {
        s1: { status: 'complete', comment: 'done deal' },
        s2: { status: 'pending' },
        s3: { status: 'error', choice: { option: 'pin hostAPI', reason: 'cloud 401' } },
        s4: { status: 'skipped' },
      },
    });
    const step = (id: string): HTMLElement => plan.querySelector(`[id="${id}"]`) as HTMLElement;
    expect(step('s1').getAttribute('data-sem-bind-status')).toBe('complete');
    expect(step('s1').getAttribute('data-status')).toBe('done');
    expect((step('s1').querySelector('.sem-bind-comment') as HTMLElement).textContent).toBe('done deal');
    expect(step('s2').getAttribute('data-status')).toBe('todo');
    expect(step('s3').getAttribute('data-status')).toBe('blocked');
    const choice = step('s3').querySelector('.sem-bind-choice') as HTMLElement;
    expect((choice.querySelector('.sem-bind-choice-option') as HTMLElement).textContent).toBe('pin hostAPI');
    expect((choice.querySelector('.sem-bind-choice-reason') as HTMLElement).textContent).toContain('cloud 401');
    expect(step('s4').getAttribute('data-sem-bind-status')).toBe('skipped');
    expect(step('s4').hasAttribute('data-status')).toBe(false);
    expect(step('s4').querySelector('.sem-bind-choice-walk')).toBeNull();
  });

  it('renders a choice array as the walked sequence, numbered, in order', () => {
    const plan = el('sem-plan', `<sem-step id="a">only</sem-step>`);
    hydratePlan(plan, {
      status: {
        a: {
          status: 'complete',
          choice: [
            { option: 'first fork', reason: 'why first' },
            { option: 'second fork', reason: 'why second' },
          ],
        },
      },
    });
    const items = plan.querySelectorAll('.sem-bind-choice-walk li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('first fork');
    expect(items[1].textContent).toContain('second fork');
    expect((plan.querySelector('ol') as HTMLElement).tagName).toBe('OL');
  });

  it('a plan body replaces authored children (the definition is the record)', () => {
    const plan = el('sem-plan', '<p>authored</p>');
    hydratePlan(plan, { plan: '<sem-step id="x">fetched step</sem-step>', status: {} });
    expect(plan.querySelector('p')).toBeNull();
    expect(plan.querySelector('.sem-bind-body sem-step[id="x"]')).toBeTruthy();
  });

  it('a payload without plan leaves authored children alone', () => {
    const plan = el('sem-procedure', '<sem-step id="k1">authored step</sem-step>');
    hydratePlan(plan, { status: { k1: { status: 'complete' } } });
    expect((plan.querySelector('sem-step') as HTMLElement).textContent).toContain('authored step');
    expect((plan.querySelector('sem-step') as HTMLElement).getAttribute('data-status')).toBe('done');
  });

  it('sanitizes the fetched plan markup', () => {
    const plan = el('sem-runbook');
    hydratePlan(plan, {
      plan: '<p onclick="evil()">hi</p><script>alert(1)</script><a href="javascript:evil()">x</a>',
    });
    expect(plan.querySelector('script')).toBeNull();
    const p = plan.querySelector('p') as HTMLElement;
    expect(p.hasAttribute('onclick')).toBe(false);
    const a = plan.querySelector('a') as HTMLElement;
    expect(a.hasAttribute('href')).toBe(false);
    expect(a.textContent).toBe('x');
  });

  it('unknown step keys and unknown payload keys pass through harmlessly', () => {
    const plan = el('sem-plan', '<sem-step id="k1">step</sem-step>');
    hydratePlan(plan, {
      status: { ghost: { status: 'complete' } },
      revision: 7,
      future_field: { nested: true },
    });
    expect(plan.querySelectorAll('[data-sem-bind-status]').length).toBe(0);
    expect((plan.querySelector('sem-step') as HTMLElement).textContent).toContain('step');
    expect(plan.querySelector('.sem-bind-body')).toBeNull(); // no plan key → no body
  });

  it('a non-object status dictionary renders the error state', () => {
    const plan = el('sem-plan');
    hydratePlan(plan, { status: ['not', 'a', 'dict'] });
    expect((plan.querySelector('.sem-bind-state') as HTMLElement).classList.contains('sem-bind-error')).toBe(true);
  });
});

describe('hydrateFor dispatch', () => {
  it('renders the empty state for null payloads — never blank', () => {
    const p = el('sem-progress');
    hydrateFor(p, null);
    expect((p.querySelector('.sem-bind-state') as HTMLElement).classList.contains('sem-bind-empty')).toBe(true);
  });

  it('unbound tags get the payload attribute + event, nothing dropped', () => {
    const note = el('sem-note');
    let evented: unknown = null;
    note.addEventListener('sem-bind-payload', (ev: Event) => {
      evented = (ev as CustomEvent).detail;
    });
    hydrateFor(note, { custom: 'shape', n: 3 });
    expect(JSON.parse(note.getAttribute('data-sem-bind-payload') as string)).toEqual({ custom: 'shape', n: 3 });
    expect(evented).toEqual({ custom: 'shape', n: 3 });
  });
});

describe('renderBindState', () => {
  it('never stacks state lines — one node, re-labelled', () => {
    const p = el('sem-progress');
    renderBindState(p, 'pending');
    renderBindState(p, 'error', 'HTTP 500');
    expect(p.querySelectorAll('.sem-bind-state').length).toBe(1);
    expect((p.querySelector('.sem-bind-state') as HTMLElement).textContent).toContain('HTTP 500');
  });
});

describe('SemProgress payload property intake', () => {
  const mount = async (): Promise<SemProgress> => {
    const node = document.createElement('sem-progress');
    document.body.appendChild(node);
    if (!(node instanceof SemProgress)) customElements.upgrade(node);
    await new Promise((resolve) => setTimeout(resolve, 0));
    return node as SemProgress;
  };

  it('a direct payload property hydrates with no server', async () => {
    const node = await mount();
    node.payload = { step: 5, steps: 8, comment: 'same pipe, direct intake' };
    await node.updateComplete;
    expect((node.querySelector('.sem-bind-progress-label') as HTMLElement).textContent).toBe('step 5 / 8');
    expect((node.querySelector('.sem-bind-comment') as HTMLElement).textContent).toBe('same pipe, direct intake');
  });
});
