import { SemElement } from './base.js';
import { param } from '../shared/attr.js';

/**
 * sem-thought — display-only typed thought bubble (spec/schema/sem-thought.md).
 *
 * The lightweight, less-configurable sibling of tobor-kit's rich
 * tobor-thought-bubble: types, vocabulary styling, nothing else. No
 * collapsed state (that is sem-reveal / sem-note[collapsed territory), no
 * ttl/toast/sound, no events, no generated chrome — the content IS the
 * rendering, so the component's whole job is the typed self-annotation:
 *
 *   - known `type`    → `data-type` mirror (§2: data- wins) + the class
 *                       `sem-thought-<type`, both deferred past parse via
 *                       afterParse so a sem-source snapshot never sees the
 *                       runtime writes (same contract as sem-note);
 *   - unknown `type`  → warning class `sem-thought-unknown` and the content
 *                       degraded to its own plain text — never render
 *                       structured markup an unknown type did not promise
 *                       (the npl-thought rule). Text-preserving, so
 *                       extraction reads the same prose before and after;
 *   - no `type`       → a plain bubble; nothing applied, content untouched.
 *
 * `role="note` is set on upgrade (deferred like every parse-time write);
 * docs author it pre-set so machine readers see the role without JS.
 * `id`, `kind`, `tags`, `audience` ride the global attribute catalog.
 */

/** The thought types `sem-thought` renders (spec/schema/sem-thought.md). */
export const THOUGHT_TYPES = [
  'observation',
  'reflection',
  'assumption',
  'mind-read',
  'tangent',
  'concern',
] as const;

export type ThoughtType = (typeof THOUGHT_TYPES)[number];

const KNOWN_TYPES: ReadonlySet<string> = new Set<string>(THOUGHT_TYPES);

export class SemThought extends SemElement {
  static properties = {
    type: { type: String, reflect: true },
  };

  declare type: string;

  constructor() {
    super();
    this.type = '';
  }

  connectedCallback(): void {
    super.connectedCallback();
    // deferred: a parse-time write would leak into a sem-source snapshot
    this.afterParse('role', () => this.setAttribute('role', 'note'));
  }

  updated(): void {
    // Typed self-annotation, deferred past parse (the data-type mirror and
    // the unknown-type flatten must not leak into a sem-source snapshot).
    this.afterParse('type', () => this.#applyType());
  }

  /** Annotate this bubble per its `type`: mirror, class, degrade. */
  #applyType(): void {
    const authored = (param(this, 'type') ?? '').trim();
    const type = authored.toLowerCase();
    if (type) {
      this.setAttribute('data-type', authored);
    } else {
      this.removeAttribute('data-type');
    }
    this.classList.remove(
      'sem-thought-unknown',
      ...THOUGHT_TYPES.map((t) => `sem-thought-${t}`),
    );
    if (!type) return;
    if (KNOWN_TYPES.has(type)) {
      this.classList.add(`sem-thought-${type}`);
      return;
    }
    // Unknown type: warning class + plain-text degradation of the content.
    this.classList.add('sem-thought-unknown');
    this.warn(`sem-thought: unknown thought type "${authored}" — rendering as plain text`);
    const text = (this.textContent || '').trim();
    this.replaceChildren(this.ownerDocument.createTextNode(text));
  }
}

SemElement.register('sem-thought', SemThought);
