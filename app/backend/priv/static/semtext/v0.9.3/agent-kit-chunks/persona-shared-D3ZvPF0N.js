import{C as o,a as c,b as p,e as d,A as m,c as e}from"./shared-CxbF3Zck.js";const h={user:"User persona",agent:"Agent persona"};class u extends o{static{this.properties={...c,avatar:{type:String}}}static{this.personaKind="user"}constructor(){super(),this.avatar=""}updated(a){super.updated(a),this.afterParse("akit-persona-chrome",()=>this.#t())}#t(){p(this,"agent-kit-persona-chrome",()=>{const s=this.constructor.personaKind,t=(this.avatar??"").trim(),r=d(this,"agent-kit-persona-name");return e`<div class="agent-kit-persona-head">
        ${t?e`<img
              class="agent-kit-persona-avatar"
              src=${t}
              alt=${r?`${r} avatar`:"persona avatar"}
              loading="lazy"
            />`:m}
        <span class="agent-kit-persona-kind" data-persona-kind=${s}
          >${h[s]}</span
        >
      </div>`})}renderChrome(a){const t=(a&&typeof a=="object"?a:{}).metadata;if(!t||typeof t!="object"||Array.isArray(t))return e``;const r=Object.entries(t).slice(0,12);return r.length===0?e``:e`<div class="agent-kit-persona-meta">
      ${r.map(([n,i])=>e`<span class="agent-kit-persona-meta-item"
            ><b>${n}</b> ${String(i)}</span
          >`)}
    </div>`}}export{u as A};
