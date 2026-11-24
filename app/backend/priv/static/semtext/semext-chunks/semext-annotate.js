import{s as i,A as o,b as n,d as m}from"./shared-DYgNPiGG.js";import{C as d}from"./cached-embed-USIB1p-Q.js";function h(r){const t=r&&typeof r=="object"?r:{},s=t.threads??(Array.isArray(r)?r:[]),e=Array.isArray(s)?s.filter(a=>!!a&&typeof a=="object"):[];return{site:t.site,page:t.page,threads:e}}function p(r,t,s){const e=r.replace(/\/+$/,""),a=new URLSearchParams;t.trim()&&a.set("site",t.trim()),s.trim()&&a.set("page",s.trim());const c=a.toString();return`${e}/threads${c?`?${c}`:""}`}class l extends d{static{this.livePolicy="anonymous-read"}connectedCallback(){this.#t(),super.connectedCallback()}updated(t){super.updated(t),this.#t()}#t(){const t=(this.endpoint??"").trim();t&&!/\/threads(?:[?#]|$)/.test(t)&&(this.endpoint=p(t,i(this,"site")??"",i(this,"page")??""))}renderChrome(t){const{site:s,threads:e}=h(t),a=s??(i(this,"site")??"").trim();return n`
      <div class="semext-annotate-chrome">
        <p class="semext-annotate-head">
          Visitor threads — ${e.length}${a?n` on ${a}`:o}
        </p>
        ${e.length===0?n`<p class="semext-annotate-empty">No comments on this page yet.</p>`:o}
        ${e.map(c=>this.thread(c))}
      </div>
    `}thread(t){const s=Array.isArray(t.comments)?t.comments:[];return n`
      <article class="semext-annotate-thread" data-status=${t.status??""}>
        <header class="semext-annotate-thread-head">
          <span class="semext-annotate-status">${t.status??"open"}</span>
          <strong class="semext-annotate-title">${t.title||t.id||"Thread"}</strong>
          ${t.author||t.createdAt?n`<span class="semext-annotate-meta"> — ${t.author??""}${t.author&&t.createdAt?", ":""}${t.createdAt??""}</span>`:o}
        </header>
        ${t.anchor?.text?n`<blockquote class="semext-annotate-anchor">${t.anchor.text}</blockquote>`:o}
        ${s.map(e=>n`
            <p class="semext-annotate-comment">
              <span class="semext-annotate-author">${e.author??"visitor"}</span>
              ${e.createdAt?n`<span class="semext-annotate-when"> ${e.createdAt}</span>`:o}
              ${e.body?n`<span class="semext-annotate-body"> — ${e.body}</span>`:o}
            </p>
          `)}
      </article>
    `}}m("semext-annotate",l);
