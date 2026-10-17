#!/usr/bin/env node
/**
 * Generate the Sem pane expectations consumed by e2e/cypress/e2e/sem-hydration.cy.ts.
 *
 * Counts `data-sem-theme` hosts per route in the Next export (scripts
 * stripped, so only real markup is counted) and writes
 * scripts/parity/sem-expectations.json: { pages: {route: n}, tags: {tag: n} }.
 * Page routes and reference tags are read from scripts/parity/parity-routes.json,
 * so the two tables always cover exactly the manifest's route set.
 *
 * Usage:
 *   PARITY_NEXT_OUT=../landing-preview/web/out node scripts/parity/gen-sem-expectations.mjs
 * (default path assumes the sibling landing-preview worktree checkout)
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(readFileSync(join(here, 'parity-routes.json'), 'utf8'))
const nextOut = process.env.PARITY_NEXT_OUT ?? '/Users/keithbrings/Work/Space/Noizu/Projects/semtext.dev/.claude/worktrees/landing-preview/web/out'

function countSemPanes(routePath) {
  const rel = routePath === '/' ? 'index.html' : `${routePath.replace(/^\//, '')}index.html`
  const html = readFileSync(join(nextOut, rel), 'utf8')
  const visible = html.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
  return (visible.match(/data-sem-theme/g) ?? []).length
}

const pages = {}
const tags = {}
const routes = []
for (const route of manifest.routes) {
  if (route.kind === 'page') {
    pages[route.path] = countSemPanes(route.path)
    routes.push(route.path)
  }
}
for (const tag of manifest.referenceTags) {
  tags[tag] = countSemPanes(`/reference/${tag}/`)
  routes.push(`/reference/${tag}/`)
}

// Pane expectations come from the APP's SSR (which routes instantiate the
// Sem component = carry data-sem-html). Requires the app server running.
const appBase = process.env.PARITY_APP_BASE
const panes = {}
if (appBase) {
  for (const route of routes) {
    const html = await (await fetch(appBase + route)).text()
    panes[route] = (html.match(/data-sem-html/g) ?? []).length
  }
}

const out = join(here, 'sem-expectations.json')
writeFileSync(out, JSON.stringify({ pages, tags, panes }, null, 2) + '\n')
const paneTotal = Object.values(panes).reduce((a, b) => a + b, 0)
console.log(
  `sem-expectations.json: ${Object.keys(pages).length} page routes, ${Object.keys(tags).length} tags` +
    (appBase ? `, ${Object.keys(panes).length} pane routes (${paneTotal} panes)` : ', no panes (set PARITY_APP_BASE)'),
)
