import{C as m,s as i,A as o,b as n,d}from"./shared-qr2elKZA.js";function h(r){const e=r&&typeof r=="object"?r:{},s=e.threads??(Array.isArray(r)?r:[]),t=Array.isArray(s)?s.filter(a=>!!a&&typeof a=="object"):[];return{site:e.site,page:e.page,threads:t}}function p(r,e,s){const t=r.replace(/\/+$/,""),a=new URLSearchParams;e.trim()&&a.set("site",e.trim()),s.trim()&&a.set("page",s.trim());const c=a.toString();return`${t}/threads${c?`?${c}`:""}`}class l extends m{static{this.livePolicy="anonymous-read"}connectedCallback(){this.#e(),super.connectedCallback()}updated(e){super.updated(e),this.#e()}#e(){const e=(this.endpoint??"").trim();e&&!/\/threads(?:[?#]|$)/.test(e)&&(this.endpoint=p(e,i(this,"site")??"",i(this,"page")??""))}renderChrome(e){const{site:s,threads:t}=h(e),a=s??(i(this,"site")??"").trim();return n`
      <div class="semext-annotate-chrome">
        <p class="semext-annotate-head">
          Visitor threads — ${t.length}${a?n` on ${a}`:o}
        </p>
        ${t.length===0?n`<p class="semext-annotate-empty">No comments on this page yet.</p>`:o}
        ${t.map(c=>this.thread(c))}
      </div>
    `}thread(e){const s=Array.isArray(e.comments)?e.comments:[];return n`
      <article class="semext-annotate-thread" data-status=${e.status??""}>
        <header class="semext-annotate-thread-head">
          <span class="semext-annotate-status">${e.status??"open"}</span>
          <strong class="semext-annotate-title">${e.title||e.id||"Thread"}</strong>
          ${e.author||e.createdAt?n`<span class="semext-annotate-meta"> — ${e.author??""}${e.author&&e.createdAt?", ":""}${e.createdAt??""}</span>`:o}
        </header>
        ${e.anchor?.text?n`<blockquote class="semext-annotate-anchor">${e.anchor.text}</blockquote>`:o}
        ${s.map(t=>n`
            <p class="semext-annotate-comment">
              <span class="semext-annotate-author">${t.author??"visitor"}</span>
              ${t.createdAt?n`<span class="semext-annotate-when"> ${t.createdAt}</span>`:o}
              ${t.body?n`<span class="semext-annotate-body"> — ${t.body}</span>`:o}
            </p>
          `)}
      </article>
    `}}d("semext-annotate",l);
