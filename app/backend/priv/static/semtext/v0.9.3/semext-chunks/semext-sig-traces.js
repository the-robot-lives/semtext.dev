import{d as c,C as o,s as a,A as m,b as i}from"./shared-qr2elKZA.js";import{s as l}from"./sig-link-B7QBd320.js";function d(t){const r=t?.traces;return Array.isArray(r)?r.filter(s=>!!s&&typeof s=="object"):[]}class g extends o{renderChrome(r){const s=d(r),n=l({query:a(this,"query"),range:a(this,"range"),env:a(this,"env")});return i`
      <div class="semext-sig-card">
        ${s.length?i`
              <ul class="semext-sig-traces">
                ${s.map(e=>i`
                    <li class="semext-sig-trace" data-error=${e.error?"true":"false"}>
                      <code class="semext-sig-trace-id">${e.id??""}</code>
                      <span class="semext-sig-trace-root">${e.root??""}</span>
                      <span class="semext-sig-trace-meta">
                        ${e.service??""}${e.service&&e.durationMs!==void 0?" · ":""}${e.durationMs!==void 0?`${e.durationMs} ms`:""}${e.spans!==void 0?` · ${e.spans} spans`:""}
                      </span>
                    </li>
                  `)}
              </ul>
            `:m}
        <p class="semext-sig-linkline">
          <a class="semext-sig-link" href=${n} target="_blank" rel="noopener">Open in SigNoz</a>
        </p>
      </div>
    `}}c("semext-sig-traces",g);
