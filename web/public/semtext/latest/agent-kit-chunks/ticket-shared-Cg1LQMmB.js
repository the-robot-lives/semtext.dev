import{C as u,a as m,g as l,e as y,b as g,A as c,c as i}from"./shared-CxbF3Zck.js";const $=/^[A-Z0-9]{1,6}-\d{3,}$/;function p(r){return r!=null&&$.test(r)}const f={issue:"Issue",epic:"Epic",bug:"Bug","user-story":"User story",task:"Task","sub-task":"Sub-task"};function b(r){return`akit-ticket-${r}`}class E extends u{static{this.properties={...m,uuid:{type:String},state:{type:String},labels:{type:String}}}static{this.ticketType="issue"}#t=!1;constructor(){super(),this.uuid="",this.state="",this.labels=""}updated(t){super.updated(t),this.afterParse("akit-ticket-chrome",()=>this.#r())}get ticketKey(){const t=(this.key??"").trim();return p(t)?t:""}#e(){if(this.#t)return;this.#t=!0;const t=(this.key??"").trim();t&&!p(t)&&(this.warn(`agent-kit-ticket: key "${t}" does not match /^[A-Z0-9]{1,6}-\\d{3,}$/ — a key is a ≤6-char project prefix, a dash, and ≥3 digits (e.g. AKIT-001)`),l(this,"ticket-key-invalid",{key:t}))}#s(){return(this.labels??"").split(",").map(t=>t.trim()).filter(Boolean)}#i(){return y(this,"agent-kit-last-updated")||(this.lastRefreshed??"").trim()}#a(){const t=this.ticketKey,s=this.querySelector(":scope > .agent-kit-ticket-anchor");if(!t){s?.remove();return}const e=s??this.ownerDocument.createElement("span");e.className="agent-kit-ticket-anchor agent-kit-chrome",e.id=b(t),e.setAttribute("data-sem-chrome",""),e.setAttribute("aria-hidden","true"),s||this.prepend(e)}#r(){this.#e(),this.#a(),g(this,"agent-kit-ticket-chrome",()=>{const t=this.constructor,s=this.ticketKey,e=(this.state??"").trim(),a=this.#s(),n=(this.lastRefreshed??"").trim()||this.#i(),k=(this.uuid??"").trim(),h=(this.org??"").trim();return i`<div class="agent-kit-ticket-meta">
          <span class="agent-kit-ticket-type" data-ticket-type=${t.ticketType}
            >${f[t.ticketType]}</span
          >
          ${s?i`<span class="agent-kit-ticket-key">${s}</span>`:c}
          ${e?i`<span class="agent-kit-ticket-state" data-state=${e}>${e}</span>`:c}
          ${a.map(d=>i`<span class="agent-kit-ticket-label">${d}</span>`)}
          ${n?i`<time class="agent-kit-ticket-updated" datetime=${n}
                >${n.slice(0,10)}</time
              >`:c}
        </div>
        ${k&&h?i`<a class="agent-kit-ticket-open" href="/app/${h}/tickets/${k}"
              >Open in agent-kit</a
            >`:c}`})}renderChrome(t){const s=t&&typeof t=="object"?t:{},e=s.updated_at??s.updatedAt??s.lastRefreshed,a=typeof e=="string"?e:"",o=a?Date.parse(a):NaN;return!a||Number.isNaN(o)?i``:i`<div class="agent-kit-ticket-snapshot" data-status=${this.status}>
      Snapshot · <time datetime=${a}>${a.slice(0,10)}</time>
    </div>`}}export{E as A,p as i,b as t};
