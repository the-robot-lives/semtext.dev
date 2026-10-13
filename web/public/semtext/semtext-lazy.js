/*
 * semtext-lazy.js — sem-* components, on demand (spec v0.6).
 *
 * Pair with semtext.css: this script scans the whole document for sem-*
 * tags (a wrapper is welcome but not required) and imports only the
 * component chunks the build-time manifest maps those tags to — components
 * not on the page never download. Elements sit in the :not(:defined) base
 * box until their chunk arrives; a failed chunk leaves a role="alert" note
 * on its elements and never blocks the other chunks. Class-form aliases
 * are not tags and never trigger a load.
 *
 * Surface contract: embed with <script type="module" src="…"> — the
 * loader resolves its chunks against import.meta.url, which only exists
 * in a module context; a classic script fails to parse. Dynamic import
 * also needs a server — this script does not work from file://. For
 * saved single-file documents use semtext.js,
 * the full bundle, which has no runtime imports.
 */
const d=/^(?:sem|npl)-[a-z0-9]+(?:-[a-z0-9]+)*$/;function i(e,t=d){return t.test(e)}function b(e,t=d){const n=[];i(e.localName,t)&&n.push(e);for(const s of e.querySelectorAll("*"))i(s.localName,t)&&n.push(s);return n}function k(e,t){return Object.prototype.hasOwnProperty.call(t,e)?t[e]:null}function p(e,t,n=d){const s=new Map;function m(o){let r=s.get(o);return r||(r=Promise.resolve().then(()=>t(o)),s.set(o,r)),r}async function l(o){const r=new Map;for(const c of b(o,n)){const a=k(c.localName,e);if(!a)continue;const u=r.get(c.localName);u?u.els.push(c):r.set(c.localName,{chunk:a,els:[c]})}await Promise.all([...r].map(async([c,{chunk:a,els:u}])=>{try{await m(a)}catch{for(const y of u)w(y,c)}}))}return{hydrate:l}}function w(e,t){if(e.hasAttribute("data-sem-lazy-error"))return;e.setAttribute("data-sem-lazy-error",t);const n=e.ownerDocument;if(!n)return;const s=n.createElement("div");s.className="sem-lazy-error",s.setAttribute("role","alert"),s.textContent=`SemText: the "${t}" component failed to load; this block stays plain text.`,e.appendChild(s)}function j(e,t){const n=p(e,t.importChunk??h,t.pattern),s=new MutationObserver(m=>{for(const l of m)for(const o of l.addedNodes)o.nodeType===Node.ELEMENT_NODE&&n.hydrate(o)});return n.hydrate(document.documentElement),s.observe(document.documentElement,{childList:!0,subtree:!0}),n}function h(e){const n=new URL(e,import.meta.url),v=new URL(import.meta.url).searchParams.get("v");return v&&n.searchParams.set("v",v),import(n.href)}function L(e){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e,{once:!0}):e()}const f={"sem-code":"chunks/sem-code.js","sem-details":"chunks/sem-details.js","sem-facts":"chunks/sem-facts.js","sem-md":"chunks/sem-md.js","sem-note":"chunks/sem-note.js","sem-properties":"chunks/sem-properties.js","sem-reader":"chunks/sem-reader.js","sem-references":"chunks/sem-references.js","sem-source":"chunks/sem-source.js","sem-table":"chunks/sem-table.js"};L(()=>{window.SemTextLazy=window.__semLazyOff?p(f,h,/^sem-/):j(f,{pattern:/^sem-/})});
