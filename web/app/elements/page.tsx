import type { Metadata } from "next";
import { Fragment } from "react";
import { ELEMENTS, searchIndex } from "./data";

export const metadata: Metadata = {
  title: "The elements — SemText",
  description:
    "Every SemText element: purpose, attributes, a live render from the real fallback tier, and the authored markup — table or one card at a time.",
  alternates: { canonical: "https://semtext.dev/elements/" },
};

/*
 * Pure server component. Interactivity is CSS-radio driven (same pattern as
 * the landing page's .api-switch) plus one small inline vanilla script:
 *   - view toggle (table / cards): radios #gview-table / #gview-pills;
 *     the script checks the cards view on load, so with no JS the page
 *     shows the full table and every card stacked — nothing hidden.
 *   - search: filters [data-g] pills and rows; while a query is active the
 *     table view is forced so all matches are visible.
 *   - "example" links: check the matching card radio and sync the active
 *     pill label.
 * Live renders use the real fallback bundle (public/semtext/), loaded
 * WITHOUT __semJsOff so its DOMContentLoaded auto-wire enhances them.
 */

const SCRIPT = `(function(){
  function ready(fn){ if(document.readyState!=="loading"){fn();}else{document.addEventListener("DOMContentLoaded",fn);} }
  ready(function(){
    var pillsView=document.getElementById("gview-pills");
    if(pillsView){
      pillsView.checked=true;
      if(!document.querySelector("input.g-el-radio:checked")){
        var first=document.querySelector("input.g-el-radio");
        if(first){first.checked=true;}
      }
    }
    var search=document.getElementById("g-search");
    function syncActive(){
      var labels=document.querySelectorAll("label.g-pill");
      for(var i=0;i<labels.length;i++){
        var fid=labels[i].getAttribute("for");
        var r=fid?document.getElementById(fid):null;
        labels[i].classList.toggle("is-active",!!(r&&r.checked));
      }
    }
    if(search){
      search.addEventListener("input",function(){
        var q=search.value.trim().toLowerCase();
        var searching=q.length>0;
        document.body.classList.toggle("g-searching",searching);
        var items=document.querySelectorAll(".g-pillgrid .g-pill, .g-table tbody tr");
        for(var i=0;i<items.length;i++){
          var el=items[i];
          el.hidden=searching&&el.getAttribute("data-g").indexOf(q)===-1;
        }
        if(searching){
          var t=document.getElementById("gview-table");
          if(t){t.checked=true;}
        }
      });
    }
    document.addEventListener("click",function(ev){
      var t=ev.target;
      var a=t&&t.closest?t.closest("[data-goto]"):null;
      if(!a){return;}
      var id=a.getAttribute("data-goto");
      var r=document.getElementById("g-el-"+id);
      if(r){r.checked=true;}
      var pv=document.getElementById("gview-pills");
      if(pv){pv.checked=true;}
      document.body.classList.remove("g-searching");
      if(search){search.value="";}
      var rows=document.querySelectorAll(".g-table tbody tr");
      for(var i=0;i<rows.length;i++){rows[i].hidden=false;}
      var ps=document.querySelectorAll(".g-pillgrid .g-pill");
      for(var i=0;i<ps.length;i++){ps[i].hidden=false;}
      syncActive();
    });
    var radios=document.querySelectorAll("input.g-el-radio");
    for(var j=0;j<radios.length;j++){radios[j].addEventListener("change",syncActive);}
    var hash=location.hash.match(/^#g-panel-(.+)$/);
    if(hash){
      var hr=document.getElementById("g-el-"+hash[1]);
      if(hr){hr.checked=true;}
    }
    syncActive();
  });
})();`;

function KindBadge({ kind }: { kind: string }) {
  return <span className={`g-kind g-kind-${kind.toLowerCase()}`}>{kind}</span>;
}

function MintBadge({ mints }: { mints: boolean }) {
  return (
    <span className={mints ? "g-mints yes" : "g-mints no"}>
      {mints ? "mints" : "no record"}
    </span>
  );
}

export default function ElementsPage() {
  const litCount = ELEMENTS.filter((e) => e.kind === "Lit").length;
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-docs px-4 pb-24 pt-12 sm:px-6"
    >
      {/* Real SemText assets for the live renders — copied verbatim into
          public/semtext/ (see public/semtext/VERSION.md). Loaded without
          __semJsOff so the bundle auto-wires every example on this page. */}
      <link
        rel="stylesheet"
        precedence="semtext"
        href="/semtext/themes/_vocabulary.css"
      />
      <link
        rel="stylesheet"
        precedence="semtext"
        href="/semtext/themes/minimal-tech-light.css"
      />
      <script defer src="/semtext/semtext-fallback.js" />

      <p className="g-eyebrow">Reference</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        The elements
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
        {ELEMENTS.length} entries: the {litCount} elements the Lit bundle
        upgrades, the native vocabulary that needs no component at all, and
        the reading chrome around them. Every card below renders its example
        with the real fallback tier this site ships — the same markup a model
        reads is the markup the browser renders.
      </p>

      <div className="g-controls mt-8 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="g-search">
          Filter elements
        </label>
        <input
          id="g-search"
          type="search"
          placeholder="Filter by name, attribute, value…"
          autoComplete="off"
          className="g-search min-h-11 w-full max-w-sm rounded-lg border border-code-border bg-code px-3.5 font-mono text-sm text-ink placeholder:text-code-gray focus:border-violet-soft focus:outline-none"
        />
        <fieldset className="g-toggle ml-auto flex items-center gap-1 rounded-full border border-code-border bg-code p-1">
          <legend className="sr-only">View</legend>
          <input
            className="g-view-radio api-radio"
            type="radio"
            name="gview"
            id="gview-table"
            autoComplete="off"
          />
          <label
            htmlFor="gview-table"
            className="g-view-label cursor-pointer rounded-full px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-code-gray"
          >
            Table
          </label>
          <input
            className="g-view-radio api-radio"
            type="radio"
            name="gview"
            id="gview-pills"
            autoComplete="off"
          />
          <label
            htmlFor="gview-pills"
            className="g-view-label cursor-pointer rounded-full px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-code-gray"
          >
            Cards
          </label>
        </fieldset>
      </div>

      {/* —— Table view (the no-JS default) —— */}
      <div className="g-view-table mt-6 overflow-x-auto rounded-xl border border-code-border bg-code">
        <table className="g-table w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-code-border font-mono text-[0.68rem] uppercase tracking-[0.14em] text-code-gray">
              <th scope="col" className="px-4 py-3 font-medium">Element</th>
              <th scope="col" className="px-4 py-3 font-medium">Purpose</th>
              <th scope="col" className="px-4 py-3 font-medium">Kind</th>
              <th scope="col" className="px-4 py-3 font-medium">Example</th>
            </tr>
          </thead>
          <tbody>
            {ELEMENTS.map((e) => (
              <tr
                key={e.id}
                data-g={searchIndex(e)}
                className="border-b border-code-border/60 align-top last:border-0"
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <code className="text-violet-soft">{e.name}</code>
                </td>
                <td className="px-4 py-3 text-ink-mute">{e.purpose}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <KindBadge kind={e.kind} /> <MintBadge mints={e.mints} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <a
                    href={`#g-panel-${e.id}`}
                    data-goto={e.id}
                    className="font-mono text-xs text-violet-soft underline-offset-4 hover:underline"
                  >
                    example →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* —— Cards view (checked on load by the inline script) —— */}
      <div className="g-view-pills mt-6">
        <ul className="g-pillgrid grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {ELEMENTS.map((e) => (
            <li key={e.id}>
              <label
                className="g-pill flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-code-border bg-code px-3 py-2.5 font-mono text-[0.78rem] text-ink-mute transition-colors hover:border-violet-soft hover:text-ink"
                htmlFor={`g-el-${e.id}`}
                data-g={searchIndex(e)}
              >
                <code>{e.name}</code>
                <KindBadge kind={e.kind} />
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* —— Cards: one radio immediately before its section —— */}
      <div className="g-panels mt-6">
        {ELEMENTS.map((e) => (
          <Fragment key={e.id}>
            <input
              className="g-el-radio api-radio"
              type="radio"
              name="g-el"
              id={`g-el-${e.id}`}
            />
            <section
              className="g-section rounded-xl border border-code-border bg-slateink-lift p-5 sm:p-7"
              id={`g-panel-${e.id}`}
              aria-label={e.name}
            >
              <header className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                <h2 className="font-mono text-lg font-semibold text-ink sm:text-xl">
                  <code className="text-violet-soft">{e.name}</code>
                </h2>
                <KindBadge kind={e.kind} />
                <MintBadge mints={e.mints} />
                {e.validated === false && (
                  <span className="g-mints warn">
                    not in the validator schema yet
                  </span>
                )}
              </header>
              <p className="mt-3 text-sm leading-6 text-ink">{e.purpose}</p>
              {e.note && (
                <p className="mt-2 text-sm leading-6 text-ink-mute">{e.note}</p>
              )}

              <h3 className="mt-5 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-code-gray">
                Attributes
              </h3>
              <table className="g-attrs mt-2 w-full text-left text-[0.82rem]">
                <tbody>
                  {e.attributes.map((a) => (
                    <tr key={a.name} className="border-t border-code-border/50">
                      <th scope="row" className="py-1.5 pr-4 align-top font-mono font-normal text-violet-soft">
                        <code>{a.name}</code>
                        {a.required && (
                          <span className="ml-1.5 text-[0.6rem] uppercase tracking-widest text-rose-300">
                            required
                          </span>
                        )}
                      </th>
                      <td className="py-1.5 text-ink-mute">{a.values}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 className="mt-6 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-code-gray">
                Example
              </h3>
              <div className="mt-2 grid gap-4 lg:grid-cols-2">
                <figure>
                  <figcaption className="g-panelabel">
                    Rendered — fallback tier
                  </figcaption>
                  <div
                    className="g-live rounded-lg border border-code-border bg-code px-4 py-4"
                    data-sem-theme="minimal-tech-light"
                    data-color-mode="dark"
                    dangerouslySetInnerHTML={{ __html: e.example }}
                  />
                  {e.liveNote && (
                    <p className="mt-2 text-xs leading-5 text-ink-mute">
                      {e.liveNote}
                    </p>
                  )}
                </figure>
                <figure>
                  <figcaption className="g-panelabel">Authored</figcaption>
                  <pre className="g-source max-h-80 overflow-auto rounded-lg border border-code-border bg-code p-4 font-mono text-[0.74rem] leading-relaxed text-ink">
                    <code>{e.example}</code>
                  </pre>
                  <p className="mt-2">
                    <a
                      href={e.spec}
                      className="font-mono text-xs text-violet-soft underline-offset-4 hover:underline"
                    >
                      spec →
                    </a>
                  </p>
                </figure>
              </div>
            </section>
          </Fragment>
        ))}
      </div>

      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </main>
  );
}
