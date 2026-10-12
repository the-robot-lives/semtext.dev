const SHOWCASE = "http://localhost:4173";
const REPO = "https://github.com/noizu-labs-ml/npl-enhanced-content";
const SPEC = `${REPO}/blob/develop/spec`;
const TRL = "https://therobotlives.com";

const LINKS: Array<[string, string]> = [
  ["Format spec", `${SPEC}/conventions.md`],
  ["Extraction contract", `${SPEC}/extraction.md`],
  ["Repository", REPO],
  ["Vocabulary demo", `${SHOWCASE}/demo/`],
  ["Lit demo", `${SHOWCASE}/demo/standalone-lit.html`],
  ["Reading demo", `${SHOWCASE}/demo/reading.html`],
  ["Scripts stripped", `${SHOWCASE}/demo/index.nojs.html`],
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
          SemText · draft spec · part of Noizu Prompt Lingua.{" "}
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
