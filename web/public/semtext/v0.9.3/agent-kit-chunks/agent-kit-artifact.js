import{C as l,a as h,b as f,A as r,c as e,d as g}from"./shared-CxbF3Zck.js";class u extends l{static{this.properties={...h,type:{type:String}}}constructor(){super(),this.type=""}updated(t){super.updated(t),this.afterParse("akit-artifact-chrome",()=>this.#t())}#t(){f(this,"agent-kit-artifact-chrome",()=>{const t=(this.type??"").trim();return e`${t?e`<span class="agent-kit-artifact-type" data-artifact-type=${t}>${t}</span>`:r}`})}renderChrome(t){const s=t&&typeof t=="object"?t:{},i=(Array.isArray(s.versions)?s.versions:[]).filter(a=>!!a&&typeof a=="object").slice(0,12),n=typeof s.updated_at=="string"?s.updated_at:"",c=n?new Date(n):null,p=c&&!Number.isNaN(c.getTime())?e`<span class="agent-kit-artifact-snapshot"
            >snapshot · <time datetime=${n}>${c.toISOString().slice(0,10)}</time></span
          >`:r;return i.length===0&&!p?e``:e`${p}
      ${i.length>0?e`<div class="agent-kit-artifact-versions">
            ${i.map(a=>{const m=String(a.label??a.id??""),o=String(a.createdAt??""),d=o&&!Number.isNaN(new Date(o).getTime())?new Date(o).toISOString().slice(0,10):"";return e`<span class="agent-kit-artifact-version"
                >${m}${d?e` · ${d}`:r}</span
              >`})}
          </div>`:r}`}}g("agent-kit-artifact",u);
