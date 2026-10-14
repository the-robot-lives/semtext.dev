/**
 * Sem hydration contract — browser-level parity assertion.
 *
 * Contract (lib/semtext_web/hologram/components/site/sem.ex): a `Sem` pane
 * SSRs EMPTY with its authored markup in `data-sem-html` (attribute-escaped,
 * lossless); site chrome must hydrate it (attribute -> innerHTML) after
 * load. Until that ran, panes rendered empty even with JS on — invisible to
 * fetch-based parity (SSR carries the source) and to the console-error guard.
 *
 * This spec drives every manifest route — `page` routes plus the
 * `reference/<tag>/` template expanded over `referenceTags` (the tag catalog
 * instantiates Sem on every tag page) — finds `[data-sem-html]` hosts, and
 * asserts each has non-empty rendered children after load. Routes without
 * Sem hosts assert nothing (presence check is lenient by design), so the
 * spec automatically covers exactly the routes that use Sem.
 */

import { visitOrGap } from '../support/parity'

const manifest = require('../../../scripts/parity/parity-routes.json')

interface Route {
  path: string
  kind?: string
}

function expandedRoutes(): string[] {
  const paths: string[] = []
  for (const route of manifest.routes as Route[]) {
    if (route.kind === 'template') {
      for (const tag of manifest.referenceTags as string[]) {
        paths.push(route.path.replace('<tag>', tag))
      }
    } else if (route.kind !== 'soft-redirect') {
      paths.push(route.path)
    }
  }
  return paths
}

describe('Sem hydration contract', () => {
  const routes = expandedRoutes()

  it('ledger: manifest routes driven', () => {
    cy.log(`${routes.length} routes`)
    expect(routes.length, 'expanded manifest routes present').to.be.greaterThan(0)
  })

  for (const path of routes) {
    it(`${path}: every [data-sem-html] host renders non-empty children`, () => {
      visitOrGap(path, 'sem-hydration')

      cy.get('body').then(($body) => {
        const hosts = $body.find('[data-sem-html]')
        cy.log(`${path}: ${hosts.length} Sem host(s)`)
        if (hosts.length === 0) return // route does not use Sem

        // Hydration is synchronous after the boot script runs, but allow
        // the deferred bundle a bounded window before judging.
        cy.wrap(hosts, { timeout: 10_000 }).each(($host) => {
          expect(
            $host.children().length > 0 || $host.text().trim().length > 0,
            `Sem host on ${path} hydrated (non-empty rendered content)`,
          ).to.be.true
        })
      })
    })
  }
})
