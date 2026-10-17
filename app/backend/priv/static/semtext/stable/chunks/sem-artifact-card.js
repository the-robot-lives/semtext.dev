import{b as a,A as u}from"./lit-element-DWovE5T-.js";import{o as h}from"./unsafe-html-BQA5rzql.js";import{S as p}from"./base-BKd1N4qP.js";import{c as v,a as g}from"./clipboard-BS2qawu8.js";const y=[{id:"artifact-md-001",title:"Run summary — repo audit",type:"markdown","active-version":"v3",versions:[{id:"v1",label:"First pass",createdAt:"2026-10-12T09:14:00Z",content:`## Run summary
Agent **repo-audit** finished in 4m 12s.

- 3 findings, 1 blocking
- Next: open tickets

<script>alert('pwn')<\/script>
<img src=x onerror="alert(1)">`},{id:"v2",label:"Add findings",createdAt:"2026-10-12T11:40:00Z",content:`## Run summary
Agent **repo-audit** finished in 4m 12s.

1. *Stale lockfile* — regenerate
2. Missing CHANGELOG entry
3. \`npm audit\` clean`},{id:"v3",label:"Final",createdAt:"2026-10-13T08:05:00Z",content:`## Run summary
Agent **repo-audit** finished in 4m 12s — **1 blocking finding resolved**.

- Lockfile regenerated
- CHANGELOG appended
- Next run scheduled for tonight`}]},{id:"artifact-json-001",title:"Quality gate config",type:"json","active-version":"v2",versions:[{id:"v1",label:"Draft",createdAt:"2026-10-12T13:00:00Z",content:'{"gate":"draft","thresholds":{"coverage":60,"maxComplexity":15}}'},{id:"v2",label:"Strict",createdAt:"2026-10-12T15:30:00Z",content:`{
  "gate": "strict",
  "thresholds": {
    "coverage": 80,
    "maxComplexity": 10,
    "maxWarnings": 0
  },
  "blockOn": ["coverage", "maxWarnings"]
}`}]},{id:"artifact-diff-001",title:"Patch — auth timeout",type:"diff","active-version":"v2",versions:[{id:"v1",label:"Raise timeout",createdAt:"2026-10-12T16:10:00Z",content:`@@ -12,7 +12,7 @@
   const client = new AuthClient({
-    timeoutMs: 5_000,
+    timeoutMs: 15_000,
     retries: 2
   });`},{id:"v2",label:"Add backoff",createdAt:"2026-10-12T17:45:00Z",content:`@@ -12,8 +12,10 @@
   const client = new AuthClient({
-    timeoutMs: 5_000,
+    timeoutMs: 15_000,
     retries: 2
+    backoff: "exponential",
+    maxBackoffMs: 30_000
   });`}]},{id:"artifact-code-001",title:"Retry helper",type:"code",language:"typescript","active-version":"v3",versions:[{id:"v1",label:"Sketch",createdAt:"2026-10-12T18:20:00Z",content:`export async function retry<T>(fn: () => Promise<T>, n: number): Promise<T> {
  for (let i = 0; i < n; i++) {
    try { return await fn(); } catch { /* again */ }
  }
  throw new Error('retries exhausted');
}`},{id:"v2",label:"Delay",createdAt:"2026-10-12T19:05:00Z",content:`const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function retry<T>(fn: () => Promise<T>, n: number, backoffMs = 250): Promise<T> {
  for (let i = 0; i < n; i++) {
    try { return await fn(); } catch { await wait(backoffMs * 2 ** i); }
  }
  throw new Error('retries exhausted');
}`},{id:"v3",label:"Typed errors",createdAt:"2026-10-13T07:50:00Z",content:`const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function retry<T>(fn: () => Promise<T>, n: number, backoffMs = 250): Promise<T> {
  let last: unknown;
  for (let i = 0; i < n; i++) {
    try { return await fn(); } catch (e) { last = e; await wait(backoffMs * 2 ** i); }
  }
  throw new Error(\`retries exhausted: \${String(last)}\`);
}`}]}],b={artifacts:y},x=b.artifacts,o=x[0],$={markdown:"Markdown",json:"JSON",diff:"Diff",code:"Code"},A={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},s=n=>n.replace(/[&<>"']/g,t=>A[t]);function c(n){return n.replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*]+)\*/g,"<em>$1</em>")}function k(n){const t=[];let e=null;const i=()=>{e&&(t.push(`</${e}>`),e=null)};for(const r of n.split(`
`)){if(!r.trim()){i();continue}const l=/^(#{1,3})\s+(.*)$/.exec(r);if(l){i();const m=l[1].length+1;t.push(`<h${m}>${c(s(l[2]))}</h${m}>`);continue}const f=/^\s*[-*]\s+(.*)$/.exec(r);if(f){e!=="ul"&&(i(),t.push("<ul>"),e="ul"),t.push(`<li>${c(s(f[1]))}</li>`);continue}const d=/^\s*\d+[.)]\s+(.*)$/.exec(r);if(d){e!=="ol"&&(i(),t.push("<ol>"),e="ol"),t.push(`<li>${c(s(d[1]))}</li>`);continue}i(),t.push(`<p>${c(s(r))}</p>`)}return i(),t.join("")}function T(n){let t=n;try{t=JSON.stringify(JSON.parse(n),null,2)}catch{}return`<pre class="sem-artifact-pre">${s(t)}</pre>`}function w(n){const t=e=>e.startsWith("+++")||e.startsWith("---")?"hunk-meta":e.startsWith("+")?"add":e.startsWith("-")?"del":e.startsWith("@@")?"hunk":"ctx";return n.split(`
`).map(e=>`<span class="sem-artifact-diff-${t(e)}">${s(e)}</span>`).join(`
`)}function S(n,t){switch(n){case"json":return T(t);case"diff":return`<pre class="sem-artifact-pre sem-artifact-diff">${w(t)}</pre>`;case"code":return`<pre class="sem-artifact-pre"><code>${s(t)}</code></pre>`;default:return k(t)}}class M extends p{static{this.properties={type:{type:String},versions:{type:Array,converter:{fromAttribute:t=>{if(t!==null)try{const e=JSON.parse(t);return Array.isArray(e)?e:void 0}catch{return}}}},activeVersion:{type:String,attribute:"active-version"},language:{type:String},index:{type:Number,state:!0}}}#e=0;constructor(){super(),this.type=o.type,this.versions=o.versions,this.activeVersion=o["active-version"],this.language=o.language??"",this.index=Math.max(0,this.versions.length-1)}updated(t){super.updated(t),this.querySelector(":scope > .sem-artifact-fallback")?.remove(),(t.has("versions")||t.has("activeVersion"))&&this.#n()}#n(){const t=this.versions.length;if(t===0){this.index=0;return}const e=this.activeVersion?this.versions.findIndex(i=>i.id===this.activeVersion):-1;this.index=e>=0?e:Math.min(Math.max(this.index,0),t-1)}#t(){return this.versions[this.index]??this.versions[this.versions.length-1]}#i(t){const e=t.target;this.index=Number(e.value)}#s(){const t=this.#t(),e=this.querySelector(".sem-artifact-status");t&&e&&v(t.content,e)}#r(){const t=this.#t();if(!t)return;const e={id:`local-${++this.#e}`,label:`Fork of ${t.label}`,createdAt:new Date().toISOString(),content:t.content};this.versions=[...this.versions,e],this.activeVersion=e.id,this.index=this.versions.length-1,this.emit("sem-artifact-fork",{version:e})}render(){const t=this.#t();if(!t)return a`<div class="sem-artifact-ui"><p class="sem-artifact-empty">No versions.</p></div>`;const e=this.versions.length,i=e>1?a`<div class="sem-artifact-timeline">
            <label class="sem-artifact-timeline-label" for="sem-artifact-scrub">
              Version timeline
            </label>
            <input
              id="sem-artifact-scrub"
              class="sem-artifact-scrub"
              type="range"
              min="0"
              max=${String(e-1)}
              .value=${String(this.index)}
              aria-valuetext="${t.label} (${this.index+1} of ${e})"
              @input=${this.#i}
            />
            <output class="sem-artifact-count">${this.index+1} / ${e}</output>
          </div>`:u;return a`<div class="sem-artifact-ui" data-type=${this.type}>
      <header class="sem-artifact-head">
        <span class="sem-artifact-type">${$[this.type]??"Artifact"}</span>
        ${this.language?a`<span class="sem-artifact-lang">${this.language}</span>`:u}
        <span class="sem-artifact-version">${t.label} · ${t.createdAt.slice(0,10)}</span>
      </header>
      <div class="sem-artifact-body">${h(S(this.type,t.content))}</div>
      ${i}
      <div class="sem-artifact-actions">
        ${g()?a`<button type="button" class="sem-artifact-copy" @click=${this.#s}>
              Copy
            </button>`:u}
        <button type="button" class="sem-artifact-fork" @click=${this.#r}>
          Fork revision
        </button>
        <span class="sem-artifact-status" role="status"></span>
      </div>
    </div>`}}p.register("sem-artifact-card",M);
