import{S as v,n as r,b as i,A as d,d as $}from"./shared-CkZ1UibF.js";const p=":scope > panel > h",c=":scope > alert",b=":scope > state",y=":scope > triggered",l=-10,u=10;function g(a){const e=Number.parseFloat(a);return Number.isNaN(e)?{value:0,outOfRange:!1}:e<l?{value:l,outOfRange:!0}:e>u?{value:u,outOfRange:!0}:{value:e,outOfRange:!1}}function R(a){const e=Number.parseFloat(a??"");return Number.isNaN(e)?0:e}function N(a){return a>0?"up":a<0?"down":"flat"}function A(a){return a>0?"↑":a<0?"↓":"→"}function O(a){return a.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}class S extends v{static{this.properties={variant:{type:String,reflect:!0}}}#e=[];#t="";#a="";#s=[];#r=!1;#n=!1;constructor(){super(),this.variant="panel"}updated(){if(!this.#n){const e=r(this,"variant");e!==null&&(this.variant=e),this.#n=!0}this.getAttribute("data-variant")!==this.variant&&this.afterParse("variant",()=>this.setAttribute("data-variant",this.variant)),!this.#r&&this.whenChildrenReady(`${p}, ${c}`).then(()=>{this.read(),this.#r=!0,this.requestUpdate()})}read(){const e=this.querySelector(y)?.textContent?.trim()??"",s=this.#o(e);this.#e=Array.from(this.querySelectorAll(p)).map(t=>{const o=r(t,"symbol",""),n=r(t,"value","0"),{value:m,outOfRange:f}=g(n),h=r(t,"name","");return{name:h,symbol:o,value:m,raw:n,outOfRange:f,delta:R(r(t,"delta")),fired:s(o,h,r(t,"trigger"))}}),this.#t=this.querySelector(b)?.textContent?.trim()??"",this.#a=e,this.#s=Array.from(this.querySelectorAll(c)).map(t=>({hormone:r(t,"hormone",""),value:r(t,"value",""),threshold:r(t,"threshold",""),behavior:r(t,"behavior",""),body:(t.textContent??"").trim()}))}#o(e){const s=e.toLowerCase();return s===""||s==="none"?()=>!1:(t,o,n)=>t!==""&&new RegExp(`\\b${O(t)}\\b`,"i").test(e)||o!==""&&s.includes(o.toLowerCase())||n!==null&&n!==""&&s.includes(n.toLowerCase())}render(){const e=this.variant;if(e==="alert")return i`${this.#s.map(t=>this.#l(t))}`;const s=this.#e.map(t=>this.#i(t));return e==="bars"?i`${s}`:i`${s}
      <div class="npl-hormones-state">State: ${this.#t}</div>
      <div class="npl-hormones-triggered">Triggered: ${this.#a}</div>`}#i(e){const s=Math.round((e.value-l)/(u-l)*100);return i`<div
      class="npl-hormones-row"
      data-symbol=${e.symbol}
      data-value=${e.raw}
      data-clamped=${e.outOfRange?"":d}
      data-fired=${e.fired?"":d}
    >
      <span class="npl-hormones-symbol">${e.symbol}</span>
      <span class="npl-hormones-name">${e.name}</span>
      <span
        class="npl-hormones-bar"
        role="img"
        aria-label="${e.name} ${e.value} (range ${l} to ${u})"
      >
        <span class="npl-hormones-fill" style=${`width: ${s}%`}></span>
      </span>
      <span class="npl-hormones-value">${e.value}</span>
      <span class="npl-hormones-delta" data-delta=${N(e.delta)}
        >${A(e.delta)}</span
      >
    </div>`}#l(e){return i`<div class="npl-hormones-alert" data-hormone=${e.hormone}>
      <span class="npl-hormones-alert-head"
        >${e.hormone} ${e.value} ≥ ${e.threshold} · ${e.behavior}</span
      >
      <span class="npl-hormones-alert-body">${e.body}</span>
    </div>`}}$("npl-hormones",S);
