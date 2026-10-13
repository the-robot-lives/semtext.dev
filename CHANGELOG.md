# Changelog

## 2026-10-14
- landing: section-by-section copy, tone and display polish (hero, the idea, degradation, reading, quick start, surface, scope); "Add-ons" renamed "Integrations" with a link to `/integrations`; tier-2 size claim corrected to "Under 14 KB"; `semtext.js` contents corrected (integration/landing-preview)
- docs: sidebar rebuilt (Guides, SemText element buckets, Showcase, Platform, GitHub; no landing links); header search over tags + CLI; 9 showcase pages; new /integrations, /extend (scaffold + vocab-proposal wizard), /themes; reference grouped into 7 buckets, shipped-bundle line per tag, provenance footer removed; elements.json resynced (49 tags) (integration/landing-preview)
- web: render snapshot harness (`npm run snap:tag`; managed dev server, concurrent-safe, <10px gate) (integration/landing-preview)
- reference: one-card split view (source | render) default on every tag page, all example variants rendered, bundle-driven Render gate, harness anchor pairing + 1024 width; sem-distractor renamed to incorrect-statement in site copy; tag-review data + media prompts checkpoint (integration/landing-preview)
