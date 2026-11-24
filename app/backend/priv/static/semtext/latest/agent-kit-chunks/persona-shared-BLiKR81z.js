import{C as i,a as c,A as p,b as e}from"./shared-BFT5ldMs.js";import{a as d,b as m}from"./chrome-CW-g0rG5.js";const h={user:"User persona",agent:"Agent persona"};class l extends i{static{this.properties={...c,avatar:{type:String}}}static{this.personaKind="user"}constructor(){super(),this.avatar=""}updated(a){super.updated(a),this.afterParse("akit-persona-chrome",()=>this.#t())}#t(){d(this,"agent-kit-persona-chrome",()=>{const s=this.constructor.personaKind,t=(this.avatar??"").trim(),r=m(this,"agent-kit-persona-name");return e`<div class="agent-kit-persona-head">
        ${t?e`<img
              class="agent-kit-persona-avatar"
              src=${t}
              alt=${r?`${r} avatar`:"persona avatar"}
              loading="lazy"
            />`:p}
        <span class="agent-kit-persona-kind" data-persona-kind=${s}
          >${h[s]}</span
        >
      </div>`})}renderChrome(a){const t=(a&&typeof a=="object"?a:{}).metadata;if(!t||typeof t!="object"||Array.isArray(t))return e``;const r=Object.entries(t).slice(0,12);return r.length===0?e``:e`<div class="agent-kit-persona-meta">
      ${r.map(([n,o])=>e`<span class="agent-kit-persona-meta-item"
            ><b>${n}</b> ${String(o)}</span
          >`)}
    </div>`}}export{l as A};
