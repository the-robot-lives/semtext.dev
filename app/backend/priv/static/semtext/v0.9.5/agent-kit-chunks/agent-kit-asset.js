import{C as n,a as m,b as c,e as o,A as r,c as a,d as p}from"./shared-CxbF3Zck.js";class d extends n{static{this.properties={...m,src:{type:String},mime:{type:String}}}constructor(){super(),this.src="",this.mime=""}updated(t){super.updated(t),this.afterParse("akit-asset-chrome",()=>this.#t())}#t(){c(this,"agent-kit-asset-chrome",()=>{const t=(this.src??"").trim(),e=(this.mime??"").trim(),s=o(this,"agent-kit-caption");return a`${t?a`<img
              class="agent-kit-asset-image"
              src=${t}
              alt=${s||"asset"}
              loading="lazy"
            />`:r}
        ${e?a`<span class="agent-kit-asset-mime">${e}</span>`:r}`})}renderChrome(t){const e=t&&typeof t=="object"?t:{},s=typeof e.updated_at=="string"?e.updated_at:"",i=s?new Date(s):null;return!i||Number.isNaN(i.getTime())?a``:a`<span class="agent-kit-asset-snapshot"
      >snapshot · <time datetime=${s}>${i.toISOString().slice(0,10)}</time></span
    >`}}p("agent-kit-asset",d);
