const REPO = "https://github.com/noizu-labs-ml/npl-enhanced-content";
const SPEC = `${REPO}/blob/develop/spec`;
const TRL = "https://therobotlives.com";

/* All links stay on this site: the demo documents live on the dev preview
   origin only and are not part of the site export, so these point at the
   closest local content — the /reference/ tag reference, and the landing
   Try / Reading / Tiers sections (live views and the no-JS tier). */
const LINKS: Array<[string, string]> = [
  ["Format spec", `${SPEC}/conventions.md`],
  ["Extraction contract", `${SPEC}/extraction.md`],
  ["Repository", REPO],
  ["Vocabulary", `/reference/`],
  ["Lit views", `/#try`],
  ["Reading", `/#reading`],
  // ["Scripts-off tier", `/#tiers`], // Degradation section disabled (2026-10-14)
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slateink">
      <div className="token-rail" aria-hidden="true">
        <span>sem-note</span>
        <span>sem-facts</span>
        <span>sem-procedure</span>
        <span>sem-code</span>
        <span>sem-table</span>
        <span>sem-reader</span>
        <span>one file</span>
        <span>three readers</span>
        <span>no build step</span>
        <span>sem-note</span>
        <span>sem-facts</span>
        <span>sem-procedure</span>
        <span>sem-code</span>
        <span>sem-table</span>
        <span>sem-reader</span>
      </div>
      <div className="mx-auto max-w-docs px-4 py-10 sm:px-6">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {LINKS.map(([label, href]) => (
            <li key={label}>
              <a
                href={href}
                className="inline-flex min-h-8 items-center text-sm text-ink-mute underline-offset-4 hover:text-violet-soft hover:underline"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-ink-mute">
          SemText · draft spec · part of Noizu Prompt Lingua. Noizu Labs, Inc.
          and The Robot Lives use SemText internally.{" "}
          <a
            href={TRL}
            className="text-violet-soft underline-offset-4 hover:underline"
          >
            The Robot Lives
          </a>{" "}
          portfolio.
        </p>
        <p className="mt-1 font-mono text-xs text-ink-faint">
          © 2026 semtext
        </p>
      </div>
    </footer>
  );
}
