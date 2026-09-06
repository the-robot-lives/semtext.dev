const TRL = "https://therobotlives.com";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slateink/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-docs items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href="#main"
          className="flex items-center gap-2.5 font-mono text-sm font-semibold tracking-tight text-ink sm:text-base"
        >
          <span className="brand-mark" aria-hidden="true">
            ∑
          </span>
          <span>
            sem<span className="text-violet-soft">text</span>
          </span>
        </a>
        <nav aria-label="Primary" className="flex items-center gap-4 text-sm sm:gap-6">
          <a
            href="#quickstart"
            className="hidden min-h-11 items-center font-mono text-ink-mute hover:text-ink sm:inline-flex"
          >
            Quickstart
          </a>
          <a
            href="#api"
            className="hidden min-h-11 items-center font-mono text-ink-mute hover:text-ink sm:inline-flex"
          >
            API
          </a>
          <a
            href="#pipeline"
            className="hidden min-h-11 items-center font-mono text-ink-mute hover:text-ink lg:inline-flex"
          >
            Pipeline
          </a>
          <a
            href={TRL}
            className="inline-flex min-h-11 items-center font-medium text-violet-soft underline-offset-4 hover:underline"
          >
            The Robot Lives
          </a>
        </nav>
      </div>
    </header>
  );
}
