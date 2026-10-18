import{C as o,a as c,b as u,f as p,c as d,d as h}from"./shared-CxbF3Zck.js";class m extends o{static{this.properties=c}updated(t){super.updated(t),this.afterParse("akit-suite-chrome",()=>this.#t())}#t(){u(this,"agent-kit-suite-chrome",()=>{const t=p(this,"agent-kit-branch"),a=(i,n)=>{const r=Number.parseInt(i.getAttribute(n)??"",10);return Number.isFinite(r)&&r>=0?r:0},e=t.reduce((i,n)=>i+a(n,"passed"),0),s=t.reduce((i,n)=>i+a(n,"failed"),0);return d`<span class="agent-kit-suite-totals"
        data-branch-count=${t.length}
        data-passed-total=${e}
        data-failed-total=${s}
        >${t.length} branch${t.length===1?"":"es"} · ${e} passed · ${s} failed</span
      >`})}renderChrome(t){const a=t&&typeof t=="object"?t:{},e=typeof a.updated_at=="string"?a.updated_at:"",s=e?new Date(e):null;return!s||Number.isNaN(s.getTime())?d``:d`<span class="agent-kit-suite-snapshot"
      >snapshot · <time datetime=${e}>${s.toISOString().slice(0,10)}</time></span
    >`}}h("agent-kit-test-suite",m);
