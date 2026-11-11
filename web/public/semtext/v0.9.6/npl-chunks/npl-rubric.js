import{S as m,n as l,b as r,A as o,d as f}from"./shared-CkZ1UibF.js";const d=":scope > :is(npl-criterion, .npl-criterion)",g=":scope > :is(npl-overall-score, .npl-overall-score)";function a(c){if(c===null)return null;const t=c.trim();if(t==="")return null;const e=Number(t);return Number.isFinite(e)?e:null}class b extends m{static{this.properties={title:{type:String,reflect:!0}}}#e=null;#t=null;#s=!1;constructor(){super(),this.title=""}updated(){const t=l(this,"title",this.title);this.afterParse("title",()=>{this.getAttribute("data-title")!==t&&this.setAttribute("data-title",t)}),!(this.#e!==null||this.#s)&&(this.#s=!0,this.whenChildrenReady(d).then(()=>this.#i()),this.afterParse("collect",()=>this.#i()))}#i(){if(this.#e!==null)return;this.#s=!1;const t=this.querySelector(g),e=Array.from(this.querySelectorAll(d)).map(i=>{const n=l(i,"weight"),s=l(i,"score");return{name:l(i,"name")??(i.textContent||"").trim(),weight:n??"",score:s??"",weightNum:a(n),scoreNum:a(s)}}),h=t?a(l(t,"value")??(t.textContent||"").trim()):null;if(h!==null)this.#t={value:h,source:"stated"};else{const i=e.filter(s=>s.weightNum!==null&&s.scoreNum!==null),n=i.reduce((s,u)=>s+u.weightNum,0);if(n!==0){const s=i.reduce((u,p)=>u+p.weightNum*p.scoreNum,0);this.#t={value:s/n,source:"computed"}}}this.#e=e,this.requestUpdate()}render(){if(this.#e===null)return r``;const t=l(this,"title",this.title);return this.#e.length===0&&!t&&this.#t===null?r``:r`
      <table class="npl-rubric-table">
        ${t?r`<caption class="npl-rubric-title">${t}</caption>`:o}
        <thead>
          <tr>
            <th scope="col">Criterion</th>
            <th scope="col">Weight</th>
            <th scope="col">Score</th>
          </tr>
        </thead>
        <tbody>
          ${this.#e.map(e=>this.#r(e))}
        </tbody>
        <tfoot>
          <tr class="npl-rubric-overall" data-source=${this.#t?.source??"none"}>
            <th scope="row">
              Overall
              ${this.#t?r`<span class="npl-rubric-source">(${this.#t.source})</span>`:o}
            </th>
            <td colspan="2" class="npl-rubric-overall-value">
              ${this.#t?String(this.#t.value):"—"}
            </td>
          </tr>
        </tfoot>
      </table>
    `}#r(t){const e=[];return t.weightNum===null&&e.push("no numeric weight"),t.scoreNum===null&&e.push("no numeric score"),r`
      <tr class="npl-rubric-criterion" data-excluded=${e.length?e.join("; "):o}>
        <th scope="row">
          ${t.name}
          ${e.length?r`<span class="npl-rubric-flag">ignored — ${e.join("; ")}</span>`:o}
        </th>
        <td>${t.weight||"—"}</td>
        <td>${t.score||"—"}</td>
      </tr>
    `}}f("npl-rubric",b);
