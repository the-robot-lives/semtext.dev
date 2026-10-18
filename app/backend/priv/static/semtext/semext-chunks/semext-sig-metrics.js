import{d as o,C as c,s as n,A as a,b as r}from"./shared-qr2elKZA.js";import{s as g}from"./sig-link-B7QBd320.js";function h(t){if(!t||typeof t!="object")return null;const s=t;return!Array.isArray(s.columns)&&!Array.isArray(s.rows)?null:s}class d extends c{renderChrome(s){const e=h(s),m=g({query:n(this,"query"),range:n(this,"range"),env:n(this,"env")});return r`
      <div class="semext-sig-card">
        ${e?.title?r`<h3 class="semext-sig-title">${e.title}</h3>`:a}
        ${e&&Array.isArray(e.columns)&&Array.isArray(e.rows)&&e.rows.length?r`
              <table class="semext-sig-table">
                <thead>
                  <tr>${e.columns.map(i=>r`<th>${i}</th>`)}</tr>
                </thead>
                <tbody>
                  ${e.rows.map(i=>r`<tr>${i.map(l=>r`<td>${String(l)}</td>`)}</tr>`)}
                </tbody>
              </table>
            `:a}
        <p class="semext-sig-linkline">
          <a class="semext-sig-link" href=${m} target="_blank" rel="noopener">Open in SigNoz</a>
        </p>
      </div>
    `}}o("semext-sig-metrics",d);
