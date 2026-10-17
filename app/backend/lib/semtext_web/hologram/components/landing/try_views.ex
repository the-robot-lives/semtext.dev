defmodule SemtextWeb.Hologram.Components.Landing.TryViews do
  @moduledoc """
  Try section: four view surfaces — code, browser, tui, cli — over the demo
  documents under /demo/ (port of Next.js `components/try-views.tsx`).

  Each tab is a live window: a `<sem-shell>` whose start script is typed and
  executed in view (semtext-js-shell.js, global SemTextShell), or a
  `<sem-browser>` rendering the document (semtext-lazy.js scans the page for
  /^sem-/ tags and loads the sem-browser chunk). Without JS the placeholders
  still carry the full static content:

    - shell tabs: a `<sem-shell start-script="...">` placeholder whose
      fallback content is a static transcript (the script's `cat` and the
      message file it prints).
    - browser tab: a `<sem-browser src="...">` placeholder whose fallback
      children are a framed iframe of that exact document.

  This component is FULLY STATIC — no client state, no actions. Every
  Hologram state flip re-renders the panels and wipes runtime-mounted DOM
  (the mounted shell clears the placeholder transcript; the re-render puts
  it back, and the shell prints over it — the round-2 feedback bug). All
  behaviour lives in `/js/landing-bootstrap.js` behind delegated listeners:

    - the tablist is always in the DOM and gated by the `js-only` class
      (hidden with scripts off via `html.no-js .js-only { display: none }`);
    - with scripts on, bootstrap hides the inactive panels, wires the
      roving-tabindex tablist (click + arrow/Home/End keys), and only then
      injects the view-runtime bundles, so the shells mount into stable DOM
      exactly once.

  Placeholder contract for the later lanes (keep these attribute names and
  the window layout stable; the transcript text may change):
  `<sem-shell start-script="/demo/scripts/<tab>.txt" aria-label="...">` and
  `<sem-browser src="/demo/example-deck.sem.html" aria-label="...">`.
  """

  use Hologram.Component

  @tabs [
    %{
      key: "code",
      label: "code",
      chrome: "sem-shell · demo/example-deck.sem.html · code view",
      aria: "The deck file in a shell pager",
      script: "/demo/scripts/code.txt",
      src: nil,
      address: nil,
      lines: [
        "$ cat demo/messages/code.txt",
        "code view — the pager over the deck file:",
        "",
        "    bat demo/example-deck.sem.html",
        "",
        "Up/Down line · PgUp/PgDn page · / find · n/N next/prev · q quit",
        "",
        "(placeholder — this shell types and runs the script once the shell bundle lands)"
      ]
    },
    %{
      key: "browser",
      label: "browser",
      chrome: "sem-browser · demo/example-deck.sem.html",
      aria: "The deck file rendered in a browser window",
      script: nil,
      src: "/demo/example-deck.sem.html",
      address: "demo/example-deck.sem.html",
      lines: []
    },
    %{
      key: "tui",
      label: "tui",
      chrome: "sem-shell · demo/auth-notes.sem.html · terminal",
      aria: "The notes file in the interactive terminal view",
      script: "/demo/scripts/tui.txt",
      src: nil,
      address: nil,
      lines: [
        "$ cat demo/messages/tui.txt",
        "tui view — the interactive terminal over the notes file:",
        "",
        "    semtext tui demo/auth-notes.sem.html",
        "",
        "arrow keys or click: sections, flashcards, quiz · Esc exits",
        "",
        "(placeholder — this shell types and runs the script once the shell bundle lands)"
      ]
    },
    %{
      key: "cli",
      label: "cli",
      chrome: "sem-shell · plain-text readers",
      aria: "The plain-text commands agents run on the demo files",
      script: "/demo/scripts/cli.txt",
      src: nil,
      address: nil,
      lines: [
        "$ cat demo/messages/cli.txt",
        "cli view — plain text out, one command per reader:",
        "",
        "    render-card demos/render-demo.card",
        "    semtext --render demo/auth-notes.sem.html",
        "    render-card demos/render-subsection.card",
        "    render-card demos/render-toc.card",
        "",
        "(placeholder — this shell types and runs the script once the shell bundle lands)"
      ]
    }
  ]

  # The transcript lines carry their final class + text so the template
  # needs no string logic. They are prepped once server-side and travel to
  # the client inside the serialized component state (Hologram re-renders
  # the template once at hydration; with no actions there are no further
  # client renders, and the identical markup is diff-patched harmlessly).
  def init(_props, component, _server) do
    tabs =
      Enum.map(@tabs, fn tab ->
        Map.put(tab, :lines, Enum.map(tab.lines, fn
          "" -> %{cls: "block whitespace-pre", text: " "}
          "$ " <> rest -> %{cls: "block whitespace-pre text-violet-soft", text: "$ " <> rest}
          line -> %{cls: "block whitespace-pre", text: line}
        end))
      end)

    put_state(component, tabs: tabs)
  end

  def template do
    ~HOLO"""
    <div data-sem-try-views="true">
      <div
        role="tablist"
        aria-label="SemText views"
        class="js-only flex flex-wrap items-center gap-2"
        data-sem-tablist="true"
      >
        {%for tab <- @tabs}
          <button
            type="button"
            role="tab"
            id={"try-tab-" <> tab.key}
            aria-selected={if tab.key == "code" do "true" else "false" end}
            aria-controls={"try-panel-" <> tab.key}
            tabindex={if tab.key == "code" do 0 else -1 end}
            data-sem-tab={tab.key}
            class={pill_class(tab.key == "code")}
          >
            {tab.label}
          </button>
        {/for}
      </div>

      {%for tab <- @tabs}
        <div
          role="tabpanel"
          id={"try-panel-" <> tab.key}
          aria-labelledby={"try-tab-" <> tab.key}
          tabindex="0"
          data-sem-panel={tab.key}
          class="mt-4"
        >
          {%if tab.src}
            <sem-browser src={tab.src} aria-label={tab.aria} class="block">
              <figure class="code-window">
                <div class="code-chrome">
                  <span class="select-none text-ink-faint" aria-hidden="true">← →</span>
                  <span class="select-none text-ink-faint" aria-hidden="true">⟳</span>
                  <span class="mx-1 min-w-0 flex-1 truncate rounded-md border border-code-border bg-[#0a101c] px-2 py-0.5 font-mono text-[0.68rem] text-code-gray">
                    {tab.address}
                  </span>
                </div>
                <iframe src={tab.src} title={tab.aria} loading="lazy" class="h-[26rem] w-full border-0 bg-white"></iframe>
              </figure>
            </sem-browser>
          {%else}
            <sem-shell start-script={tab.script} aria-label={tab.aria} class="block">
              <figure class="code-window">
                <div class="code-chrome">
                  <span class="dot live" aria-hidden="true"></span>
                  <span class="min-w-0 truncate">{tab.chrome}</span>
                  <span class="ml-auto hidden min-w-0 truncate font-mono text-[0.66rem] text-ink-faint sm:inline">
                    start-script {tab.script}
                  </span>
                </div>
                <pre class="max-h-[26rem] min-h-[16rem] overflow-auto p-4 font-mono text-[0.78rem] leading-relaxed text-ink-mute"><code>{%for line <- tab.lines}<span class={line.cls}>{line.text}</span>{/for}</code></pre>
              </figure>
            </sem-shell>
          {/if}
        </div>
      {/for}
    </div>
    """
  end

  # -- internals (server-side only) ---------------------------------------

  defp pill_class(true) do
    "inline-flex min-h-7 cursor-pointer items-center rounded-full border px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors border-violet bg-violet text-white"
  end

  defp pill_class(false) do
    "inline-flex min-h-7 cursor-pointer items-center rounded-full border px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors border-code-border text-code-gray hover:border-violet-soft hover:text-ink"
  end
end
