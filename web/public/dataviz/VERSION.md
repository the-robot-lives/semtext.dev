# /dataviz/ assets — copied from npl-enhanced-content

`semtext-reading.js` and `vocabulary.css` are copied verbatim from the
`dist/` + `themes/` output of `noizu-labs-ml/npl-enhanced-content`:

- branch: `feat/data-viz-phase6` @ `67d75bb` (data visualizer phases 1-6;
  the reading bundle carries `src/reading/data*.ts` + `src/data/*`)
- artifact: `dist/semtext-reading.js`, 59.5 KB (budget 61) — installs the
  global `SemTextReading`, auto-wires the document on load
- copied: 2026-10-13

`data/services.csv` and `data/regions.yaml` are the demo fixtures from
that branch's `web/demo/data/`, referenced by the /dataviz/ page's second
example (`source="data/…"` resolves against the document base, so the
files live next to the page).

## Local patch (matches public/semtext/themes)

`vocabulary.css` (= `themes/_vocabulary.css`) carries the same
body-paint patch as `public/semtext/themes/_vocabulary.css`: the
`background`/`color` paint rule is scoped to `[data-sem-theme]` instead
of `body`, so themes mounting on an embedded subtree (the /dataviz/ page
puts `data-sem-theme` on the example wrapper) do not resolve
`var(--sem-fg)` at body scope. Re-copying a newer `_vocabulary.css` over
this file must re-apply that patch — see `public/semtext/VERSION.md` for
the upstream-tracking note.

Unlike `public/semtext/`, this directory loads nothing on other pages:
only /dataviz/ requests these files.
