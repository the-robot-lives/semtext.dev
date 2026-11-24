import{C as o,a as s,A as a,b as n}from"./shared-BFT5ldMs.js";import{a as c,b as d}from"./chrome-CW-g0rG5.js";const p={organization:"Organization",project:"Project"};class m extends o{static{this.properties={...s,uuid:{type:String}}}static{this.refKind="organization"}constructor(){super(),this.uuid=""}updated(r){super.updated(r),this.afterParse("akit-reference-chrome",()=>this.#t())}get#e(){const r=this.constructor,e=(this.org??"").trim();if(!e)return null;if(r.refKind==="organization")return`/app/${encodeURIComponent(e)}`;const t=(this.key??"").trim();return t?`/app/${encodeURIComponent(e)}/projects/${encodeURIComponent(t)}`:null}#t(){c(this,"agent-kit-reference-chrome",()=>{const e=this.constructor.refKind;d(this,"agent-kit-name");const t=this.#e;return n`<div class="agent-kit-reference-head">
          <span class="agent-kit-reference-kind" data-ref-kind=${e}
            >${p[e]}</span
          >
        </div>
        ${t?n`<div class="agent-kit-reference-foot">
              <a class="agent-kit-reference-open" href=${t}>Open in agent-kit</a>
            </div>`:a}`})}renderChrome(r){const e=r&&typeof r=="object"?r:{},t=typeof e.updated_at=="string"?e.updated_at:"",i=t?new Date(t):null;return!i||Number.isNaN(i.getTime())?n``:n`<span class="agent-kit-reference-snapshot"
      >snapshot · <time datetime=${t}>${i.toISOString().slice(0,10)}</time></span
    >`}}export{m as A};
