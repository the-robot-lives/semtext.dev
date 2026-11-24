import{C as r,a as i,b as o,d as n}from"./shared-BFT5ldMs.js";import{a as m}from"./chrome-CW-g0rG5.js";class c extends r{static{this.properties={...i}}updated(e){super.updated(e),this.afterParse("akit-chatroom-chrome",()=>{m(this,"agent-kit-chatroom-chrome",()=>{const t=this.querySelectorAll("agent-kit-chat-msg").length;return o`<span class="agent-kit-chatroom-chip" data-message-count=${String(t)}>
          Chatroom · ${t} message${t===1?"":"s"}</span>`})})}renderChrome(e){const t=e&&typeof e=="object"?e:{},a=typeof t.updated_at=="string"?t.updated_at:"",s=a?new Date(a):null;return!s||Number.isNaN(s.getTime())?o``:o`<span class="agent-kit-chatroom-snapshot"
      >snapshot · <time datetime=${a}>${s.toISOString().slice(0,10)}</time></span
    >`}}n("agent-kit-chatroom",c);
