import{C as s,a,b as o,e as c,A as d,c as n}from"./shared-CxbF3Zck.js";const p={organization:"Organization",project:"Project"};class f extends s{static{this.properties={...a,uuid:{type:String}}}static{this.refKind="organization"}constructor(){super(),this.uuid=""}updated(r){super.updated(r),this.afterParse("akit-reference-chrome",()=>this.#t())}get#e(){const r=this.constructor,e=(this.org??"").trim();if(!e)return null;if(r.refKind==="organization")return`/app/${encodeURIComponent(e)}`;const t=(this.key??"").trim();return t?`/app/${encodeURIComponent(e)}/projects/${encodeURIComponent(t)}`:null}#t(){o(this,"agent-kit-reference-chrome",()=>{const e=this.constructor.refKind;c(this,"agent-kit-name");const t=this.#e;return n`<div class="agent-kit-reference-head">
          <span class="agent-kit-reference-kind" data-ref-kind=${e}
            >${p[e]}</span
          >
        </div>
        ${t?n`<div class="agent-kit-reference-foot">
              <a class="agent-kit-reference-open" href=${t}>Open in agent-kit</a>
            </div>`:d}`})}renderChrome(r){const e=r&&typeof r=="object"?r:{},t=typeof e.updated_at=="string"?e.updated_at:"",i=t?new Date(t):null;return!i||Number.isNaN(i.getTime())?n``:n`<span class="agent-kit-reference-snapshot"
      >snapshot · <time datetime=${t}>${i.toISOString().slice(0,10)}</time></span
    >`}}export{f as A};
