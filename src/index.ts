/* Shared foundation */
export { SemElement } from './lit/base.js';
export { parseTokens, elementTokens } from './shared/tokens.js';
export { mulberry32, shuffle, resolveSeed, randomFor } from './shared/rng.js';
export {
  parseProfiles,
  buildClosure,
  closureFor,
  matches,
  warn,
} from './shared/audience.js';
export type { Profile, AudienceClosure } from './shared/audience.js';
export {
  hashSegments,
  bareSegments,
  getParam,
  setParam,
  readLocal,
  writeLocal,
  removeLocal,
} from './shared/state.js';

/* Elements — importing registers the custom element */
export { SemNote } from './lit/sem-note.js';
import './lit/sem-note.js';
/* sem-thought — display-only typed thought bubble (no fallback behavior) */
export { SemThought, THOUGHT_TYPES } from './lit/sem-thought.js';
import './lit/sem-thought.js';
export { SemFacts } from './lit/sem-facts.js';
import './lit/sem-facts.js';
export { SemDetails } from './lit/sem-details.js';
import './lit/sem-details.js';
/* R/W1 prose elements — thin wrappers over src/reading/* */
export { SemCode } from './lit/sem-code.js';
import './lit/sem-code.js';
export { SemReferences } from './lit/sem-references.js';
import './lit/sem-references.js';
export { SemProperties } from './lit/sem-properties.js';
import './lit/sem-properties.js';
/* R/W2 chrome + data — thin wrappers over src/reading/* */
export { SemReader } from './lit/sem-reader.js';
import './lit/sem-reader.js';
export { SemTable } from './lit/sem-table.js';
import './lit/sem-table.js';
/* sem-source — rendered/source section wrapper (thin wrapper over src/reading/source.ts) */
export { SemSource } from './lit/sem-source.js';
import './lit/sem-source.js';
/* R/W2.2 Markdown block — thin wrapper over src/md/* */
export { SemMd } from './lit/sem-md.js';
import './lit/sem-md.js';

/* Vanilla tiers — the former dist/semtext-fallback.js, dist/semtext-md.js and
 * dist/semtext-reading.js entry points, folded into this one bundle (0.9.0
 * one-bundle contract: interactivity lives in semtext.js alone). Each folded
 * entry point still self-initialises on DOMContentLoaded unless
 * `window.__semJsOff` is set; import order is load-bearing — the core's
 * sem-source snapshot pass must precede every handler that adds chrome, and
 * the reading pass (which renders the snapshot copy) runs last. */
import { enhance as enhanceCore } from './fallback/index.js';
export type { FallbackHandler } from './fallback/index.js';
export {
  enhanceSource,
  enhanceAttrs,
  enhanceFacts,
  enhanceDetails,
  enhanceNote,
  enhanceProperties,
  enhanceViews,
  enhanceReveal,
  enhanceProgress,
  enhanceAudience,
  enhanceTarget,
} from './fallback/index.js';
import { enhance as enhanceMdScan } from './md/index.js';
export { enhanceMd, enhanceMdElement, normalizeMd, parseBlocks, safeUrl } from './md/index.js';
import { enhance as enhanceReading } from './reading/index.js';
export {
  enhanceCodeElement,
  enhanceReferencesElement,
  enhanceGlossaryElement,
  enhanceTableElement,
  enhanceSourceElement,
  enhanceReaderElement,
  disposeReaderElement,
} from './reading/index.js';
export { enhanceCore, enhanceMdScan as enhanceMdDocument, enhanceReading };
