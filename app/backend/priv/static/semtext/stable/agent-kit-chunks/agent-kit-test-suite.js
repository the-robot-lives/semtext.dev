import{C as o,a as c,b as d,d as u}from"./shared-BFT5ldMs.js";import{a as p,c as h}from"./chrome-CW-g0rG5.js";class m extends o{static{this.properties=c}updated(t){super.updated(t),this.afterParse("akit-suite-chrome",()=>this.#t())}#t(){p(this,"agent-kit-suite-chrome",()=>{const t=h(this,"agent-kit-branch"),a=(i,r)=>{const n=Number.parseInt(i.getAttribute(r)??"",10);return Number.isFinite(n)&&n>=0?n:0},e=t.reduce((i,r)=>i+a(r,"passed"),0),s=t.reduce((i,r)=>i+a(r,"failed"),0);return d`<span class="agent-kit-suite-totals"
        data-branch-count=${t.length}
        data-passed-total=${e}
        data-failed-total=${s}
        >${t.length} branch${t.length===1?"":"es"} · ${e} passed · ${s} failed</span
      >`})}renderChrome(t){const a=t&&typeof t=="object"?t:{},e=typeof a.updated_at=="string"?a.updated_at:"",s=e?new Date(e):null;return!s||Number.isNaN(s.getTime())?d``:d`<span class="agent-kit-suite-snapshot"
      >snapshot · <time datetime=${e}>${s.toISOString().slice(0,10)}</time></span
    >`}}u("agent-kit-test-suite",m);
