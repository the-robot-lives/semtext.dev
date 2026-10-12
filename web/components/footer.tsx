const TRL = "https://therobotlives.com";

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
      <div className="mx-auto flex max-w-docs flex-col items-center gap-3 px-4 py-10 text-center sm:px-6">
        <p className="font-mono font-semibold tracking-tight text-ink">
          Sem<span className="text-violet-soft">Text</span>
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
