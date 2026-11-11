import{i as r,a as o,A as s,b as i}from"./lit-element-DWovE5T-.js";const d="ArrowLeft",l="ArrowRight",n="Escape";class c extends r{static{this.properties={items:{type:String}}}#e=[];#t=-1;#o=this.#i.bind(this);#d=this.#b.bind(this);createRenderRoot(){return this.attachShadow({mode:"open"})}static{this.styles=o`
    :host {
      display: block;
    }
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    @media (max-width: 720px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .grid { grid-template-columns: 1fr; } }
    .card {
      display: block; width: 100%; border: none; background: #1e1e2e;
      border-radius: 8px; overflow: hidden; cursor: pointer; padding: 0;
      color: #cdd6f4; text-align: left; font: inherit;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .card:hover, .card:focus-visible {
      transform: scale(1.02);
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      outline: 2px solid #89b4fa;
    }
    .card-media {
      width: 100%; aspect-ratio: 16 / 10; object-fit: cover; display: block;
      background: #181825;
    }
    .card-caption {
      padding: 0.5rem 0.75rem; font-size: 0.85rem; color: #a6adc8;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    /* lightbox */
    .lb-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.88); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
    }
    .lb-content {
      max-width: 90vw; max-height: 85vh; display: flex; flex-direction: column;
      align-items: center; gap: 0.75rem;
    }
    .lb-media { max-width: 100%; max-height: 70vh; border-radius: 4px; }
    .lb-caption { color: #cdd6f4; font-size: 0.95rem; }
    .lb-controls { display: flex; gap: 0.5rem; align-items: center; }
    .lb-btn {
      background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
      color: #cdd6f4; border-radius: 6px; padding: 0.4rem 0.9rem;
      cursor: pointer; font-size: 0.9rem;
    }
    .lb-btn:hover, .lb-btn:focus-visible {
      background: rgba(255,255,255,0.22); outline: 2px solid #89b4fa;
    }
    .lb-close { position: fixed; top: 1rem; right: 1rem; z-index: 1001; }
    .lb-counter { color: #a6adc8; font-size: 0.85rem; }
  `}connectedCallback(){super.connectedCallback(),window.addEventListener("sem-media-added",this.#r)}disconnectedCallback(){window.removeEventListener("sem-media-added",this.#r),this.#i(),super.disconnectedCallback()}willUpdate(t){if(t.has("items"))try{this.#e=JSON.parse(this.items||"[]")}catch{this.#e=[]}}render(){return i`
      <div class="grid" role="list" aria-label="Media gallery">
        ${this.#e.map((t,e)=>this.#l(t,e))}
      </div>
      ${this.#t>=0?this.#c():s}
    `}#l(t,e){return i`
      <button
        class="card" role="listitem"
        aria-label="View: ${t.caption}"
        @click=${()=>this.#h(e)}
      >
        ${this.#n(t)}
        <span class="card-caption">${t.caption}</span>
      </button>
    `}#n(t){return t.mime?.startsWith("video/")?i`<video class="card-media" muted preload="metadata" src=${t.src}></video>`:i`<img class="card-media" src=${t.src} alt=${t.caption} loading="lazy">`}#c(){const t=this.#e[this.#t];if(!t)return s;const e=this.#e.length;return i`
      <div class="lb-backdrop" @click=${this.#p} @keydown=${this.#d}>
        <div class="lb-content" @click=${a=>a.stopPropagation()}>
          ${t.mime?.startsWith("video/")?i`<video class="lb-media" controls autoplay src=${t.src}></video>`:i`<img class="lb-media" src=${t.src} alt=${t.caption}>`}
          <span class="lb-caption">${t.caption}</span>
          <div class="lb-controls">
            <button class="lb-btn" aria-label="Previous" ?disabled=${this.#t<=0}
              @click=${()=>this.#s()}>Previous</button>
            <span class="lb-counter">${this.#t+1} / ${e}</span>
            <button class="lb-btn" aria-label="Next" ?disabled=${this.#t>=e-1}
              @click=${()=>this.#a()}>Next</button>
          </div>
        </div>
        <button class="lb-btn lb-close" aria-label="Close" @click=${this.#o}>Close</button>
      </div>
    `}#h(t){this.#t=t,this.requestUpdate(),requestAnimationFrame(()=>{this.shadowRoot?.querySelector(".lb-close")?.focus()})}#i(){if(this.#t<0)return;const t=this.#t;this.#t=-1,this.requestUpdate(),requestAnimationFrame(()=>{this.shadowRoot?.querySelectorAll(".card")?.[t]?.focus()})}#s(){this.#t>0&&(this.#t--,this.requestUpdate())}#a(){this.#t<this.#e.length-1&&(this.#t++,this.requestUpdate())}#p(t){t.target===t.currentTarget&&this.#i()}#b(t){t.key===n&&(t.preventDefault(),this.#i()),t.key===d&&(t.preventDefault(),this.#s()),t.key===l&&(t.preventDefault(),this.#a())}#r=t=>{const e=t.detail;e?.src&&(this.#e=[...this.#e,e],this.requestUpdate())}}typeof customElements<"u"&&!customElements.get("sem-media-gallery")&&customElements.define("sem-media-gallery",c);
