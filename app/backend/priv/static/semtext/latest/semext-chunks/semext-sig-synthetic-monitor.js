import{d as l,C as c,s as o,A as n,b as t}from"./shared-qr2elKZA.js";import{s as g}from"./sig-link-B7QBd320.js";function h(i){const s=i?.monitor;return s&&typeof s=="object"?s:null}class x extends c{renderChrome(s){const e=h(s),a=g({monitor:o(this,"monitor"),env:o(this,"env")}),r=e&&Array.isArray(e.assertions)?e.assertions:[];return t`
      <div class="semext-sig-card">
        ${e?.name?t`<h3 class="semext-sig-title">${e.name}</h3>`:n}
        ${e?.interval?t`<p class="semext-sig-monitor-interval">Runs every ${e.interval}</p>`:n}
        ${r.length?t`
              <ul class="semext-sig-monitor-asserts">
                ${r.map(m=>t`<li>${m}</li>`)}
              </ul>
            `:n}
        <p class="semext-sig-linkline">
          <a class="semext-sig-link" href=${a} target="_blank" rel="noopener">Open in SigNoz</a>
        </p>
      </div>
    `}}l("semext-sig-synthetic-monitor",x);
