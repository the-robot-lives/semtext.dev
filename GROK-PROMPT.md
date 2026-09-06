# GROK-PROMPT — semtext.dev

Paste this prompt into Grok to generate the stub site.

## Task
Build a one-page static website for **semtext.dev**.

## Site concept
"semtext": dev tool landing for semantic text processing — parsing, embeddings, meaning-aware text utils. Developer-docs styling, code samples front and center.

## Requirements
1. Single `index.html` with inline or single-file CSS. No frameworks, no build tooling, no JS dependencies.
2. Generate 2–3 thematic images (hero + accents) and store them under `assets/`; every image gets descriptive alt text.
3. Visual style: modern robot/AI-flavored, clean, responsive (mobile-first), system font stack.
4. Branding: this site is part of The Robot Lives portfolio.
5. Links: header AND footer link to `https://therobotlives.com` (anchor text exactly "The Robot Lives"); footer adds "Part of The Robot Lives portfolio".
6. Commit the finished site on `develop` (PRs target `develop`; `main` is CI/CD-only — never push `main` by hand).
