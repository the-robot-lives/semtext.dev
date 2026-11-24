import{d as l,s as o,A as i,b as t}from"./shared-DYgNPiGG.js";import{C as c}from"./cached-embed-USIB1p-Q.js";import{s as g}from"./sig-link-B7QBd320.js";function h(n){const s=n?.monitor;return s&&typeof s=="object"?s:null}class p extends c{renderChrome(s){const e=h(s),m=g({monitor:o(this,"monitor"),env:o(this,"env")}),r=e&&Array.isArray(e.assertions)?e.assertions:[];return t`
      <div class="semext-sig-card">
        ${e?.name?t`<h3 class="semext-sig-title">${e.name}</h3>`:i}
        ${e?.interval?t`<p class="semext-sig-monitor-interval">Runs every ${e.interval}</p>`:i}
        ${r.length?t`
              <ul class="semext-sig-monitor-asserts">
                ${r.map(a=>t`<li>${a}</li>`)}
              </ul>
            `:i}
        <p class="semext-sig-linkline">
          <a class="semext-sig-link" href=${m} target="_blank" rel="noopener">Open in SigNoz</a>
        </p>
      </div>
    `}}l("semext-sig-synthetic-monitor",p);
