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
const l=/^(?:sem|npl)-[a-z0-9]+(?:-[a-z0-9]+)*$/;function i(e,s=l){return s.test(e)}function y(e,s=l){const n=[];i(e.localName,s)&&n.push(e);for(const t of e.querySelectorAll("*"))i(t.localName,s)&&n.push(t);return n}function j(e,s){return Object.prototype.hasOwnProperty.call(s,e)?s[e]:null}function p(e,s,n=l){const t=new Map;function u(a){let o=t.get(a);return o||(o=Promise.resolve().then(()=>s(a)),t.set(a,o)),o}async function d(a){const o=new Map;for(const r of y(a,n)){const c=j(r.localName,e);if(!c)continue;const m=o.get(r.localName);m?m.els.push(r):o.set(r.localName,{chunk:c,els:[r]})}await Promise.all([...o].map(async([r,{chunk:c,els:m}])=>{try{await u(c)}catch{for(const k of m)w(k,r)}}))}return{hydrate:d}}function w(e,s){if(e.hasAttribute("data-sem-lazy-error"))return;e.setAttribute("data-sem-lazy-error",s);const n=e.ownerDocument;if(!n)return;const t=n.createElement("div");t.className="sem-lazy-error",t.setAttribute("role","alert"),t.textContent=`SemText: the "${s}" component failed to load; this block stays plain text.`,e.appendChild(t)}function b(e,s){const n=p(e,s.importChunk??h,s.pattern),t=s.prepare,u=new MutationObserver(a=>{for(const o of a)for(const r of o.addedNodes){if(r.nodeType!==Node.ELEMENT_NODE)continue;const c=t?t(r):r;n.hydrate(c)}}),d=t?t(document.documentElement):document.documentElement;return n.hydrate(d),u.observe(document.documentElement,{childList:!0,subtree:!0}),n}function h(e){return import(new URL(e,import.meta.url).href)}function v(e){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e,{once:!0}):e()}const f={"sem-artifact-card":"chunks/sem-artifact-card.js","sem-browser":"chunks/sem-browser.js","sem-chat":"chunks/sem-chat.js","sem-code":"chunks/sem-code.js","sem-data-visualizer":"chunks/sem-data-visualizer.js","sem-details":"chunks/sem-details.js","sem-facts":"chunks/sem-facts.js","sem-md":"chunks/sem-md.js","sem-media-gallery":"chunks/sem-media-gallery.js","sem-note":"chunks/sem-note.js","sem-properties":"chunks/sem-properties.js","sem-provider-picker":"chunks/sem-provider-picker.js","sem-quota-meter":"chunks/sem-quota-meter.js","sem-reader":"chunks/sem-reader.js","sem-references":"chunks/sem-references.js","sem-review-canvas":"chunks/sem-review-canvas.js","sem-source":"chunks/sem-source.js","sem-table":"chunks/sem-table.js","sem-upload-drop":"chunks/sem-upload-drop.js"};v(()=>{window.SemTextLazy=window.__semLazyOff?p(f,h,/^sem-/):b(f,{pattern:/^sem-/})});
