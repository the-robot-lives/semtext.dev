import{S as a,h as p,b as s,d as o}from"./shared-CkZ1UibF.js";class l extends a{static{this.properties={primary:{type:Boolean,reflect:!0}}}constructor(){super(),this.primary=!1}#e(){return p(this,"primary")}updated(){let e=this.firstChild;for(const t of this.querySelectorAll(":scope > .npl-mode-chip"))t!==e&&this.insertBefore(t,e),e=t.nextSibling;this.afterParse("primary",()=>{this.#e()?this.setAttribute("data-primary",""):this.removeAttribute("data-primary")})}render(){const e=this.#e(),t=Array.from(this.querySelectorAll("mode[type]"));return s`${t.map(i=>{const r=i.getAttribute("type");return s`<span
        class="npl-mode-chip${e?" npl-mode-chip-primary":""}"
        data-type="${r}"
        >${r}</span
      >`})}`}}o("npl-mode",l);
