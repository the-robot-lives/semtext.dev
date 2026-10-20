import{d as f,C as u,s as p,b as n,A as o}from"./shared-qr2elKZA.js";function h(s){if(!s||typeof s!="object")return[];const t=s.pointers??s;return Array.isArray(t)?t.filter(e=>!!e&&typeof e=="object"):typeof t=="object"?Object.entries(t).map(([e,i])=>i&&typeof i=="object"?{uuid:e,...i}:null).filter(e=>e!==null):[]}function x(s){if(!s)return"";const t=s.match(/[〚[][^:亭\]]*[:：]([^\]〛]+)[\]〛]/);return t?t[1]:s}class $ extends u{renderChrome(t){const e=(p(this,"uuid")??"").trim(),i=(p(this,"token")??"").trim(),a=(p(this,"marker")??"").trim(),l=(p(this,"file")??"").trim();let c=h(t);l&&(c=c.filter(r=>(r.file_path??"")===l));const d=e&&c.filter(r=>(r.uuid??"")===e)||a&&c.filter(r=>(r.marker??"")===a)||i&&c.filter(r=>x(r.marker)===i)||c,m=d.length>0?d:e||a||i?[]:c;return m.length===0?n`<p class="semext-docptr-missing">Pointer not in the cached snapshot.</p>`:n`${m.map(r=>this.card(r))}`}card(t){const e=[t.file_path??"",t.line!==void 0?String(t.line):""].filter(Boolean).join(":");return n`
      <div class="semext-docptr-card">
        <p class="semext-docptr-locator">${e||"unlocated"}</p>
        <div class="semext-docptr-meta">
          ${t.kind?n`<span class="semext-docptr-kind">${t.kind}</span>`:o}
          ${t.class?n`<span class="semext-docptr-class">${t.class}</span>`:o}
          ${t.function_name?n`<code class="semext-docptr-fn">${t.function_name}</code>`:o}
          ${t.marker?n`<span class="semext-docptr-marker">${t.marker}</span>`:o}
        </div>
        ${t.description?n`<p class="semext-docptr-desc">${t.description}</p>`:o}
        ${t.snippet?n`<pre class="semext-docptr-snippet"><code>${t.snippet}</code></pre>`:o}
      </div>
    `}}f("semext-docptr",$);
