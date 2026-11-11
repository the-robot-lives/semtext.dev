import{A as d,b as a}from"./lit-element-DWovE5T-.js";import{o}from"./unsafe-html-BQA5rzql.js";import{S as l}from"./base-BKd1N4qP.js";const n=`<svg class="sem-review-shot-img" viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Fixture screenshot of an agent workspace">
<rect width="640" height="400" fill="#f6f7f9"/>
<rect width="640" height="36" fill="#1f2430"/>
<circle cx="18" cy="18" r="5" fill="#e05d5d"/><circle cx="34" cy="18" r="5" fill="#e5b355"/><circle cx="50" cy="18" r="5" fill="#5fbf77"/>
<rect x="220" y="12" width="200" height="12" rx="6" fill="#3a4152"/>
<rect y="36" width="132" height="364" fill="#eceef2"/>
<rect x="14" y="56" width="104" height="10" rx="5" fill="#b9bfc9"/>
<rect x="14" y="80" width="104" height="10" rx="5" fill="#cdd2da"/>
<rect x="14" y="104" width="104" height="10" rx="5" fill="#cdd2da"/>
<rect x="14" y="128" width="70" height="10" rx="5" fill="#cdd2da"/>
<rect x="152" y="56" width="220" height="150" rx="10" fill="#ffffff"/>
<rect x="168" y="76" width="120" height="12" rx="6" fill="#8a93a3"/>
<rect x="168" y="100" width="188" height="8" rx="4" fill="#d6dae1"/>
<rect x="168" y="116" width="160" height="8" rx="4" fill="#d6dae1"/>
<rect x="168" y="150" width="84" height="24" rx="12" fill="#3d6fe0"/>
<rect x="392" y="56" width="232" height="150" rx="10" fill="#ffffff"/>
<rect x="408" y="76" width="90" height="12" rx="6" fill="#8a93a3"/>
<rect x="408" y="100" width="200" height="8" rx="4" fill="#d6dae1"/>
<rect x="408" y="116" width="176" height="8" rx="4" fill="#d6dae1"/>
<rect x="152" y="226" width="472" height="150" rx="10" fill="#ffffff"/>
<rect x="168" y="246" width="140" height="12" rx="6" fill="#8a93a3"/>
<rect x="168" y="272" width="440" height="8" rx="4" fill="#d6dae1"/>
<rect x="168" y="288" width="400" height="8" rx="4" fill="#d6dae1"/>
<rect x="168" y="304" width="420" height="8" rx="4" fill="#d6dae1"/>
<rect x="168" y="336" width="96" height="24" rx="12" fill="#e5b355"/>
</svg>`,f=[{id:"c1",x:35.9,y:38,author:"Mara",body:"Primary button should use the success token, not brand blue — this is a deploy action.",resolved:!1},{id:"c2",x:79.7,y:30,author:"Dev",body:"Agent put its run summary here. Needs the artifact link back to /runs/412.",resolved:!1},{id:"c3",x:26.3,y:70.5,author:"Mara",body:'Copy: "review thread" not "comment log" — pitch language, keep it consistent.',resolved:!0},{id:"c4",x:61.5,y:87,author:"Keith",body:"Long bodies wrap under the fold. Cap the popover at 6 lines with a scroll.",resolved:!1}],m="Demo Reviewer",v={approve:"Approved",changes:"Changes requested",comment:"Commented"},u="Pending review";class s extends l{static{this.properties={comments:{type:Array,converter:{fromAttribute:e=>{if(e!==null)try{const t=JSON.parse(e);return Array.isArray(t)?t:void 0}catch{return}}}},verdict:{type:String,reflect:!0},activeId:{type:String,state:!0},draft:{type:Object,state:!0}}}#t=0;constructor(){super(),this.comments=f,this.verdict="pending",this.activeId=null,this.draft=null}updated(){this.afterParse("verdict",()=>this.setAttribute("data-verdict",this.verdict)),this.querySelector(":scope > .sem-review-fallback")?.remove()}#i(){return this.comments.find(e=>e.id===this.activeId)}#r(e){this.activeId=this.activeId===e.id?null:e.id,this.draft=null}#s(e){const t=e.target;if(t.closest(".sem-review-pin, .sem-review-pop, .sem-review-draft"))return;const r=t.closest(".sem-review-stage")??this.querySelector(".sem-review-stage");if(!r)return;const i=r.getBoundingClientRect();if(i.width===0||i.height===0)return;const c=(e.clientX-i.left)/i.width*100,h=(e.clientY-i.top)/i.height*100;this.activeId=null,this.draft={x:Math.min(100,Math.max(0,Math.round(c*10)/10)),y:Math.min(100,Math.max(0,Math.round(h*10)/10))}}#a(){const t=(this.querySelector(".sem-review-draft-input")?.value??"").trim();if(!t||!this.draft){this.draft=null;return}const r={id:`local-${++this.#t}`,x:this.draft.x,y:this.draft.y,author:m,body:t,resolved:!1};this.comments=[...this.comments,r],this.draft=null,this.activeId=r.id}#d(e){const t=e.target;t.type==="radio"&&(this.verdict=t.value,this.emit("sem-review-complete",{verdict:this.verdict,comments:this.comments}))}static#e(e){return`--sem-review-x:${e.x}%;--sem-review-y:${e.y}%`}render(){const e=this.#i();return a`<div class="sem-review-ui">
      <figure class="sem-review-stage" @click=${this.#s}>
        ${o(n)}
        ${this.comments.map(t=>a`<button
            type="button"
            class="sem-review-pin"
            data-pin-id=${t.id}
            data-resolved=${t.resolved?"":d}
            style=${s.#e(t)}
            aria-label="Comment by ${t.author}: ${t.body}"
            aria-expanded=${this.activeId===t.id?"true":"false"}
            @click=${()=>this.#r(t)}
          >
            ${t.id.startsWith("local-")?"+":t.id.slice(1)}
          </button>`)}
        ${e?a`<div
              class="sem-review-pop"
              data-comment-id=${e.id}
              style=${s.#e(e)}
            >
              <strong class="sem-review-pop-author">${e.author}</strong>
              <p class="sem-review-pop-body">${e.body}</p>
            </div>`:d}
        ${this.draft?a`<div
              class="sem-review-draft"
              style=${s.#e(this.draft)}
            >
              <input
                class="sem-review-draft-input"
                type="text"
                placeholder="Add a comment"
                aria-label="New comment"
                @keydown=${t=>{t.key==="Escape"&&(this.draft=null)}}
              />
              <button type="button" class="sem-review-draft-add" @click=${this.#a}>
                Add
              </button>
            </div>`:d}
      </figure>
      <fieldset class="sem-review-verdict" @change=${this.#d}>
        <legend>Verdict</legend>
        <label><input type="radio" name="sem-review-verdict" value="approve" /> Approve</label>
        <label><input type="radio" name="sem-review-verdict" value="changes" /> Request changes</label>
        <label><input type="radio" name="sem-review-verdict" value="comment" /> Comment</label>
      </fieldset>
      <p class="sem-review-verdict-label" aria-live="polite">${this.#l()}</p>
    </div>`}#l(){return this.verdict==="pending"?u:v[this.verdict]}}l.register("sem-review-canvas",s);
