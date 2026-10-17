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

  The tablist is in the DOM always but `[hidden]` until hydration; with
  scripts off all four panels render stacked and readable (no interaction
  is promised). Bundle loading lives in `/js/landing-bootstrap.js` (one
  guarded injection per bundle); roving focus after arrow keys is
  `SemtextLanding.focusActiveTab()` (imperative focus is not a data
  action).

  Placeholder contract for the later lanes (keep these attribute names and
  the window layout stable; the transcript text may change):
  `<sem-shell start-script="/demo/scripts/<tab>.txt" aria-label="...">` and
  `<sem-browser src="/demo/example-deck.sem.html" aria-label="...">`.

  `facts` stays on the old signature for the live views (the script-runner
  lane re-derives transcripts from the deck); the placeholder windows read
  only the static demo assets under /demo/.
  """

  use Hologram.Component

  prop :facts, :list, default: []

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

  def init(_props, component, _server) do
    tabs =
      Enum.map(@tabs, fn tab ->
        Map.put(tab, :lines, Enum.map(tab.lines, &transcript_line/1))
      end)

    put_state(component,
      active: "code",
      hydrated: false,
      tabs: tabs
    )
  end

  def template do
    ~HOLO"""
    <div>
      <div
        role="tablist"
        aria-label="SemText views"
        class="flex flex-wrap items-center gap-2"
        hidden={@hydrated}
        $key_down.arrow_right.prevent_default={action: :tab_right}
        $key_down.arrow_left.prevent_default={action: :tab_left}
        $key_down.home.prevent_default={action: :tab_home}
        $key_down.end.prevent_default={action: :tab_end}
      >
        <button
          type="button"
          role="tab"
          id="try-tab-code"
          aria-selected={if @active == "code" do "true" else "false" end}
          aria-controls="try-panel-code"
          tabindex={if @active == "code" do 0 else -1 end}
          $click={action: :set_tab, params: %{tab: "code"}}
          class={pill_class(@active == "code")}
        >
          code
        </button>
        <button
          type="button"
          role="tab"
          id="try-tab-browser"
          aria-selected={if @active == "browser" do "true" else "false" end}
          aria-controls="try-panel-browser"
          tabindex={if @active == "browser" do 0 else -1 end}
          $click={action: :set_tab, params: %{tab: "browser"}}
          class={pill_class(@active == "browser")}
        >
          browser
        </button>
        <button
          type="button"
          role="tab"
          id="try-tab-tui"
          aria-selected={if @active == "tui" do "true" else "false" end}
          aria-controls="try-panel-tui"
          tabindex={if @active == "tui" do 0 else -1 end}
          $click={action: :set_tab, params: %{tab: "tui"}}
          class={pill_class(@active == "tui")}
        >
          tui
        </button>
        <button
          type="button"
          role="tab"
          id="try-tab-cli"
          aria-selected={if @active == "cli" do "true" else "false" end}
          aria-controls="try-panel-cli"
          tabindex={if @active == "cli" do 0 else -1 end}
          $click={action: :set_tab, params: %{tab: "cli"}}
          class={pill_class(@active == "cli")}
        >
          cli
        </button>
      </div>

      {%for tab <- @tabs}
        <div
          role="tabpanel"
          id={"try-panel-" <> tab.key}
          aria-labelledby={"try-tab-" <> tab.key}
          tabindex="0"
          hidden={if @hydrated do @active != tab.key else false end}
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

  # -- actions -----------------------------------------------------------

  def action(:on_hydrated, _params, component) do
    put_state(component, hydrated: true)
  end

  def action(:set_tab, params, component) do
    component = put_state(component, active: params.tab)
    focus_active_tab()
    component
  end

  def action(:tab_right, _params, component) do
    component = put_state(component, active: next_tab(component.state.active))
    focus_active_tab()
    component
  end

  def action(:tab_left, _params, component) do
    component = put_state(component, active: prev_tab(component.state.active))
    focus_active_tab()
    component
  end

  def action(:tab_home, _params, component) do
    component = put_state(component, active: "code")
    focus_active_tab()
    component
  end

  def action(:tab_end, _params, component) do
    component = put_state(component, active: "cli")
    focus_active_tab()
    component
  end

  # -- internals (client-safe: no Enum, no regex, no processes) ----------

  defp focus_active_tab do
    Hologram.JS.exec("window.SemtextLanding && SemtextLanding.focusActiveTab()")
  end

  defp next_tab("code"), do: "browser"
  defp next_tab("browser"), do: "tui"
  defp next_tab("tui"), do: "cli"
  defp next_tab("cli"), do: "code"

  defp prev_tab("code"), do: "cli"
  defp prev_tab("browser"), do: "code"
  defp prev_tab("tui"), do: "browser"
  defp prev_tab("cli"), do: "tui"

  defp pill_class(true) do
    "inline-flex min-h-7 cursor-pointer items-center rounded-full border px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors border-violet bg-violet text-white"
  end

  defp pill_class(false) do
    "inline-flex min-h-7 cursor-pointer items-center rounded-full border px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors border-code-border text-code-gray hover:border-violet-soft hover:text-ink"
  end

  # Server-side init helpers (never client-compiled): the transcript lines
  # carry their final class + text so the template needs no string logic.

  defp transcript_line(""), do: %{cls: "block whitespace-pre", text: " "}

  defp transcript_line("$ " <> rest),
    do: %{cls: "block whitespace-pre text-violet-soft", text: "$ " <> rest}

  defp transcript_line(line), do: %{cls: "block whitespace-pre", text: line}
end
