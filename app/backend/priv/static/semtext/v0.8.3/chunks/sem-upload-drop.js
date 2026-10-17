import{i as l,a as h,A as a,b as i}from"./lit-element-DWovE5T-.js";class c extends l{static{this.properties={accept:{type:String},maxBytes:{type:Number,attribute:"max-bytes"}}}#t="idle";#i="";#s=null;#e=0;#r=0;#o=!1;createRenderRoot(){return this.attachShadow({mode:"open"})}static{this.styles=h`
    :host(:not(:defined)) { display: none; }
    :host { display: block; }
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
    }
    .dropzone {
      border: 2px dashed #585b70; border-radius: 10px; padding: 2.5rem 1rem;
      text-align: center; color: #a6adc8; cursor: pointer; background: #181825;
      transition: border-color 0.2s, background 0.2s;
      min-height: 120px; display: flex; align-items: center; justify-content: center;
      flex-direction: column; gap: 0.4rem;
    }
    .dropzone:hover, .dropzone:focus-visible, .dropzone.drag-over {
      border-color: #89b4fa; background: #1e1e2e; outline: 2px solid #89b4fa;
    }
    .dropzone-icon { font-size: 1.8rem; }
    .dropzone-label { font-size: 0.95rem; }
    .dropzone-hint { font-size: 0.8rem; color: #6c7086; }
    .error {
      color: #f38ba8; font-size: 0.85rem; margin-top: 0.5rem;
      padding: 0.4rem 0.6rem; background: rgba(243,139,168,0.1);
      border-radius: 4px;
    }
    .progress-container { margin-top: 1rem; }
    .progress-label { font-size: 0.85rem; color: #a6adc8; margin-bottom: 0.3rem; }
    .progress-track {
      height: 6px; background: #313244; border-radius: 3px; overflow: hidden;
    }
    .progress-fill {
      height: 100%; background: #89b4fa; border-radius: 3px;
      transition: width 0.05s linear;
    }
  `}connectedCallback(){super.connectedCallback(),this.addEventListener("dragover",this.#h),this.addEventListener("dragleave",this.#c),this.addEventListener("drop",this.#p)}disconnectedCallback(){this.removeEventListener("dragover",this.#h),this.removeEventListener("dragleave",this.#c),this.removeEventListener("drop",this.#p),this.#m(),super.disconnectedCallback()}#d(){return(this.accept||"").split(",").map(e=>e.trim()).filter(Boolean)}render(){const e=this.#d();return i`
      ${this.#t==="idle"?this.#g(e):this.#f()}
      ${this.#i?i`<div class="error" role="alert">${this.#i}</div>`:a}
    `}#g(e){return i`
      <div class="dropzone"
        tabindex="0" role="button"
        aria-label="Upload a file. Accepted types: ${e.join(", ")||"any"}"
        @click=${this.#l}
        @keydown=${this.#b}
      >
        <span class="dropzone-icon" aria-hidden="true">+</span>
        <span class="dropzone-label">Drop files here or click to browse</span>
        <span class="dropzone-hint">
          ${e.length?`Accepted: ${e.join(", ")}`:"All file types"}
          ${this.maxBytes?` / Max ${this.#a(this.maxBytes)}`:""}
        </span>
        <input type="file" class="sr-only"
          accept=${this.accept||a}
          @change=${this.#v}
        >
      </div>
    `}#f(){const t={idle:"",presign:"Presigning upload...",upload:"Uploading...",register:"Registering media...",done:"Done"}[this.#t]||"";return i`
      <div class="progress-container">
        <div class="progress-label">${t}</div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${this.#e}%"></div>
        </div>
      </div>
    `}#l(){if(this.#o)return;this.#o=!0,this.shadowRoot?.querySelector('input[type="file"]')?.click(),this.#o=!1}#b(e){(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),this.#l())}#v(e){const t=e.target;t.files?.length&&(this.#u(t.files[0]),t.value="")}#h(e){e.preventDefault(),this.shadowRoot?.querySelector(".dropzone")?.classList.add("drag-over")}#c(e){this.shadowRoot?.querySelector(".dropzone")?.classList.remove("drag-over")}#p(e){e.preventDefault(),this.shadowRoot?.querySelector(".dropzone")?.classList.remove("drag-over");const s=e.dataTransfer?.files?.[0];s&&this.#u(s)}#u(e){this.#i="",this.#s=null;const t=this.#d();if(t.length>0&&!t.includes(e.type)){this.#i=`File type not accepted. Allowed: ${t.join(", ")}`,this.requestUpdate();return}if(this.maxBytes&&e.size>this.maxBytes){this.#i=`File too large (${this.#a(e.size)}). Maximum: ${this.#a(this.maxBytes)}`,this.requestUpdate();return}this.#s=e,this.#y()}#y(){this.#m(),this.#t="presign",this.#e=0,this.requestUpdate(),this.#n("presign",600,()=>{this.#t="upload",this.#e=0,this.requestUpdate(),this.#n("upload",1200,()=>{this.#t="register",this.#e=0,this.requestUpdate(),this.#n("register",400,()=>{this.#x()})})})}#n(e,t,r){const s=performance.now(),o=d=>{const n=d-s;this.#e=Math.min(100,Math.round(n/t*100)),this.requestUpdate(),n<t?this.#r=requestAnimationFrame(o):(this.#e=100,this.requestUpdate(),r())};this.#r=requestAnimationFrame(o)}#x(){if(!this.#s)return;this.#t="done",this.#e=100;const e={src:URL.createObjectURL(this.#s),caption:this.#s.name,mime:this.#s.type};this.dispatchEvent(new CustomEvent("sem-media-added",{bubbles:!0,composed:!0,detail:e})),setTimeout(()=>{this.#t="idle",this.#e=0,this.#s=null,this.#i="",this.requestUpdate()},600)}#m(){this.#r&&(cancelAnimationFrame(this.#r),this.#r=0)}#a(e){if(e<1024)return`${e} B`;if(e<1024*1024)return`${(e/1024).toFixed(0)} KB`;const t=e/(1024*1024);return`${Number.isInteger(t)?t.toFixed(0):t.toFixed(1)} MB`}}typeof customElements<"u"&&!customElements.get("sem-upload-drop")&&customElements.define("sem-upload-drop",c);
