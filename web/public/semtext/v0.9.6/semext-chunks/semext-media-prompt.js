import{d,C as h,s as o,A as c,b as n}from"./shared-qr2elKZA.js";const u="semtext:cache:start semext-media-prompt",f="semtext:cache:end semext-media-prompt";class x extends h{renderChrome(m){const[s]=this.#t();this.setAttribute("data-semext-cache-region",s>0?"filled":"empty");const a=(o(this,"model")??"").trim(),r=(o(this,"aspect")??"").trim(),e=(o(this,"assets-dir")??"").trim(),t=Array.isArray(m?.output?.assets)?m.output.assets.length:null;return n`
      <div class="semext-media-prompt-chrome">
        ${a||r||e?n`<p class="semext-media-prompt-params">
              ${a?n`<span class="semext-media-prompt-param">${a}</span>`:c}
              ${r?n`<span class="semext-media-prompt-param">${r}</span>`:c}
              ${e?n`<code class="semext-media-prompt-dir">${e}</code>`:c}
            </p>`:c}
        ${s>0?n`<p class="semext-media-prompt-state">Output cache region — ${s} authored asset${s===1?"":"s"}${t!==null?` (manifest: ${t})`:""}</p>`:n`<p class="semext-media-prompt-empty">Output not generated yet — the refresh CLI fills this region.</p>`}
      </div>
    `}#t(){const m=(o(this,"key")??"").trim(),s=this.childNodes,a=(e,t)=>e===t?!0:!!m&&e.startsWith(t)&&e.slice(t.length).trim()===m;let r=-1;for(let e=0;e<s.length;e++){const t=s[e];if(t.nodeType!==8)continue;const i=(t.nodeValue??"").trim();if(r<0)a(i,u)&&(r=e);else if(a(i,f))return this.#e(s,r+1,e)}return r>=0?this.#e(s,r+1,s.length):[0,!1]}#e(m,s,a){const r="a, img, [data-semext-asset]";let e=0;for(let t=s;t<a;t++){const i=m[t];if(i.nodeType!==1)continue;const p=i;if(p.matches(r))e+=1;else{const l=p.querySelectorAll(r);e+=l.length?l.length:p.querySelectorAll("li").length}}return[e,!0]}}d("semext-media-prompt",x);
