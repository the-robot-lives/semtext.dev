/*
 * Build-time renders of the two sem-md examples, written to match what
 * chunks/sem-md.js builds from the same authored Markdown
 * (noizu-labs-ml/npl-enhanced-content src/md/element.ts build() over
 * src/md/parse.ts: thead/th[scope=col] with the delimiter row's alignment
 * as inline text-align styles, tbody rows in authored order).
 *
 * Each constant is TWO views of the same authored block:
 *   - div.ref-md-static — the rendered table for the zero-JS HTML (the
 *     requirement: the static export shows the table, not raw text), and
 *     the visible render until the chunk arrives;
 *   - the authored <sem-md> element itself, hidden until the chunk
 *     upgrades it (it then builds chrome + rendered body + raw fence and
 *     the CSS swaps the static table out — the upgrade marker keys the
 *     swap, so there is no timing race).
 *
 * The element intentionally stays authored INSIDE the static HTML: the
 * chunk's enhance is driven by the element's own text, so it can build the
 * real, live-chrome component from it. The component's enhance is
 * idempotent on its own chrome; here it runs once, on first upgrade.
 *
 * Keep these two constants in sync with their sources:
 *   - REFERENCE_SEM_MD: web/data/elements.json → tags[sem-md].example
 *   - ELEMENTS_SEM_MD:  web/app/elements/data.ts → sem-md example
 * (both generated from spec/schema/sem-md.md upstream).
 */

const MD_TABLE = `| Token   | Lifetime | Rotates |
| :------ | -------: | :-----: |
| access  | 15 min   | no      |`;

/** /reference/ — data/elements.json's sem-md example ("30 days"). */
export const REFERENCE_SEM_MD_SOURCE = `<sem-md id="m-lifetimes" label="Token lifetimes" controls="toggle,copy">
  | Token   | Lifetime | Rotates |
  | :------ | -------: | :-----: |
  | access  | 15 min   | no      |
  | refresh | 30 days  | yes     |
</sem-md>`;

export const REFERENCE_SEM_MD_RENDERED = `<div class="ref-md-static">
  <div class="ref-md-static-label">Token lifetimes</div>
  <table>
    <thead>
      <tr>
        <th scope="col" style="text-align: left">Token</th>
        <th scope="col" style="text-align: right">Lifetime</th>
        <th scope="col" style="text-align: center">Rotates</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>access</td><td style="text-align: right">15 min</td><td style="text-align: center">no</td></tr>
      <tr><td>refresh</td><td style="text-align: right">30 days</td><td style="text-align: center">yes</td></tr>
    </tbody>
  </table>
</div>
<sem-md id="m-lifetimes" label="Token lifetimes" controls="toggle,copy">${MD_TABLE}
| refresh | 30 days  | yes     |</sem-md>`;

/** /elements/ — app/elements/data.ts's sem-md example ("per use"). */
export const ELEMENTS_SEM_MD_SOURCE = `<sem-md label="Token lifetimes">
| Token   | Lifetime | Rotates |
| :------ | -------: | :-----: |
| access  | 15 min   | no      |
| refresh | per use  | yes     |
</sem-md>`;

export const ELEMENTS_SEM_MD_RENDERED = `<div class="ref-md-static">
  <div class="ref-md-static-label">Token lifetimes</div>
  <table>
    <thead>
      <tr>
        <th scope="col" style="text-align: left">Token</th>
        <th scope="col" style="text-align: right">Lifetime</th>
        <th scope="col" style="text-align: center">Rotates</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>access</td><td style="text-align: right">15 min</td><td style="text-align: center">no</td></tr>
      <tr><td>refresh</td><td style="text-align: right">per use</td><td style="text-align: center">yes</td></tr>
    </tbody>
  </table>
</div>
<sem-md label="Token lifetimes">${MD_TABLE}
| refresh | per use  | yes     |</sem-md>`;
