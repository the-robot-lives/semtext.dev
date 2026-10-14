import{S as n,n as s,A as r,b as i,d}from"./shared-D9gh2Y8o.js";const a=":scope > .npl-mood-tone, :scope > .npl-mood-context, :scope > .npl-mood-approach";class l extends n{static{this.properties={mood:{type:String,reflect:!0}}}#t=!1;constructor(){super(),this.mood=""}updated(){const t=s(this,"mood",this.mood);this.afterParse("mood",()=>{this.getAttribute("data-mood")!==t&&this.setAttribute("data-mood",t)}),this.#o()}render(){const[t="",...o]=s(this,"mood",this.mood).trim().split(/\s+/),e=o.join(" ");return i`
      <span class="npl-mood-chip">
        <span class="npl-mood-emoji">${t}</span
        >${e?i` <span class="npl-mood-qualifier">${e}</span>`:r}
      </span>
    `}#o(){if(this.querySelector(".npl-mood-detail"))return;const t=Array.from(this.querySelectorAll(a));if(t.length===0){this.#t||(this.#t=!0,this.whenChildrenReady(a).then(()=>{this.#t=!1,this.requestUpdate()}));return}const o=document.createElement("div");o.className="npl-mood-detail",this.appendChild(o);for(const e of t)o.appendChild(e)}}d("npl-mood",l);
