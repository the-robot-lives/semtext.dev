const TRL = "https://therobotlives.com";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slateink">
      <div className="token-rail" aria-hidden="true">
        <span>DET</span>
        <span>NOUN</span>
        <span>VERB</span>
        <span>ADP</span>
        <span>DET</span>
        <span>NOUN</span>
        <span>PUNCT</span>
        <span>embed(384)</span>
        <span>cosine</span>
        <span>k=5</span>
        <span>DET</span>
        <span>NOUN</span>
        <span>VERB</span>
        <span>ADP</span>
        <span>DET</span>
        <span>NOUN</span>
      </div>
      <div className="mx-auto flex max-w-docs flex-col items-center gap-3 px-4 py-10 text-center sm:px-6">
        <p className="font-mono font-semibold tracking-tight text-ink">
          sem<span className="text-violet-soft">text</span>
        </p>
        <p className="text-sm text-ink-mute">
          Part of The Robot Lives portfolio
        </p>
        <a
          href={TRL}
          className="inline-flex min-h-11 items-center text-sm font-medium text-violet-soft underline-offset-4 hover:underline"
        >
          The Robot Lives
        </a>
        <p className="font-mono text-xs text-ink-faint">© 2026 semtext</p>
      </div>
    </footer>
  );
}
