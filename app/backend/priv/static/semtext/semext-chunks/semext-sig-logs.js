import{d as o,s as t,A as l,b as n}from"./shared-DYgNPiGG.js";import{C as g}from"./cached-embed-USIB1p-Q.js";import{s as m}from"./sig-link-B7QBd320.js";function c(a){const e=a?.lines;return Array.isArray(e)?e.filter(s=>!!s&&typeof s=="object"):[]}class p extends g{renderChrome(e){const s=c(e),r=m({query:t(this,"query"),range:t(this,"range"),env:t(this,"env")});return n`
      <div class="semext-sig-card">
        ${s.length?n`
              <ol class="semext-sig-loglines">
                ${s.map(i=>n`
                    <li class="semext-sig-logline" data-severity=${(i.severity??"info").toLowerCase()}>
                      <span class="semext-sig-log-ts">${i.ts??""}</span>
                      <span class="semext-sig-log-sev">${i.severity??""}</span>
                      <span class="semext-sig-log-body">${i.body??""}</span>
                    </li>
                  `)}
              </ol>
            `:l}
        <p class="semext-sig-linkline">
          <a class="semext-sig-link" href=${r} target="_blank" rel="noopener">Open in SigNoz</a>
        </p>
      </div>
    `}}o("semext-sig-logs",p);
