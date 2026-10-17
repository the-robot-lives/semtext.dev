/**
 * Sem hydration + SSR parity contract — browser-level.
 *
 * Two Sem attributes, two tiers (attribute split per the component model:
 * `Sem` panes carry `data-sem-html`; `data-sem-theme` also marks non-pane
 * theme chrome — previews, viewer chrome).
 *
 * Tier SSR (deterministic, cy.request against the app):
 *   - pane count: `data-sem-html` occurrences must equal the `panes` table
 *     (which routes instantiate the Sem component).
 *   - theme-host count: `data-sem-theme` occurrences (scripts stripped,
 *     same methodology as the export measurement) must equal the export's
 *     count (`pages` / `tags` tables). Both sides measured identically, so
 *     any drift is a real markup parity delta, reported as such.
 *
 * Tier browser (the hydration contract): SSR panes render EMPTY and site
 * chrome must fill them after load — so post-load, no `data-sem-theme`
 * host may still be empty. On a pane route an empty host is an unhydrated
 * pane; elsewhere it is empty chrome, equally worth flagging. Deliberately
 * independent of the `data-sem-html` attribute lifecycle.
 *
 * Every manifest route is asserted EXPLICITLY — a route with no panes or
 * no theme hosts asserts 0 (by design), and the ledger test requires the
 * tables to cover the manifest exactly, so a route missing from an
 * expectation table can never read as a pass. Tables are generated from
 * the Next export + app SSR by `scripts/parity/gen-sem-expectations.mjs`
 * into `scripts/parity/sem-expectations.json`.
 */

import { visitOrGap } from '../support/parity'

const manifest = require('../../../scripts/parity/parity-routes.json')
const { pages: THEME, tags: TAG_THEME, panes: PANES } = require(
  '../../../scripts/parity/sem-expectations.json',
) as {
  pages: Record<string, number>
  tags: Record<string, number>
  panes: Record<string, number>
}

interface Route {
  path: string
  kind?: string
}

function tagOf(path: string): string {
  return path.replace('/reference/', '').replace(/\/$/, '')
}

function themeExpected(path: string): number {
  if (path in THEME) return THEME[path]
  return TAG_THEME[tagOf(path)]
}

describe('Sem hydration + SSR parity contract', () => {
  const template = (manifest.routes as Route[]).find((r) => r.kind === 'template') as Route
  const pageRoutes = (manifest.routes as Route[])
    .filter((r) => r.kind === 'page')
    .map((r) => r.path)
  const referenceTags = manifest.referenceTags as string[]
  const routes: string[] = [
    ...pageRoutes,
    ...referenceTags.map((tag) => template.path.replace('<tag>', tag)),
  ]

  it('ledger: expectation tables cover the manifest exactly', () => {
    expect(template, 'manifest has a reference-tag template route').to.exist
    const missingTags = referenceTags.filter((t) => !(t in TAG_THEME))
    expect(
      missingTags,
      `every reference tag needs a theme expectation (missing: ${missingTags.join(', ')})`,
    ).to.deep.eq([])
    const extraTags = Object.keys(TAG_THEME).filter((t) => !referenceTags.includes(t))
    expect(extraTags, `no stale tag expectations (extra: ${extraTags.join(', ')})`).to.deep.eq([])
    const missingPages = pageRoutes.filter((p) => !(p in THEME))
    expect(
      missingPages,
      `every page route needs a theme expectation (missing: ${missingPages.join(', ')})`,
    ).to.deep.eq([])
    const extraPages = Object.keys(THEME).filter((p) => !pageRoutes.includes(p))
    expect(extraPages, `no stale page expectations (extra: ${extraPages.join(', ')})`).to.deep.eq([])
    const missingPanes = routes.filter((p) => !(p in PANES))
    expect(
      missingPanes,
      `every driven route needs a pane expectation (missing: ${missingPanes.join(', ')})`,
    ).to.deep.eq([])
    const extraPanes = Object.keys(PANES).filter((p) => !routes.includes(p))
    expect(extraPanes, `no stale pane expectations (extra: ${extraPanes.join(', ')})`).to.deep.eq([])
    expect(routes.length, 'routes driven').to.be.greaterThan(0)
  })

  for (const path of routes) {
    const paneCount = PANES[path]
    const themeCount = themeExpected(path)

    it(`${path}: ${paneCount} pane(s) hydrated, ${themeCount} theme host(s)`, () => {
      // Deterministic SSR tiers first (no browser, no hydration interference).
      cy.request(path).then((res) => {
        // Parse with the browser's own HTML parser: attribute counts are DOM
        // queries, so script-payload bytes can never inflate them.
        const doc = new DOMParser().parseFromString(String(res.body), 'text/html')
        const ssrPanes = doc.querySelectorAll('[data-sem-html]').length
        expect(ssrPanes, `SSR Sem pane count (data-sem-html)`).to.eq(paneCount)
        const ssrTheme = doc.querySelectorAll('[data-sem-theme]').length
        expect(ssrTheme, `SSR theme-host count vs Next export`).to.eq(themeCount)
      })

      visitOrGap(path, 'sem-hydration')

      // Hydration contract: SSR panes render EMPTY (authored markup parked
      // in data-sem-html) and site chrome must fill them after load. So
      // post-load, NO theme host may still be empty — on a pane route an
      // empty host is an unhydrated pane; elsewhere it is empty chrome,
      // which equally warrants eyes. Hydration is observed to complete
      // before assertions run, so no scroll/visibility priming is needed.
      cy.get('body').should(($b) => {
        // find(), not cy.get(): a route with no theme hosts is a valid
        // 0-by-design state, not a missing element.
        $b.find('[data-sem-theme]').each((_, el) => {
          const $e = Cypress.$(el)
          expect(
            $e.children().length > 0 || $e.text().trim().length > 0,
            `theme host on ${path} renders non-empty after load`,
          ).to.be.true
        })
      })
    })
  }
})
