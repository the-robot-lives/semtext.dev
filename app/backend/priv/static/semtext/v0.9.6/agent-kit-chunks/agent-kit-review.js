import{C as n,a,b as i,d as c}from"./shared-BFT5ldMs.js";import{a as o}from"./chrome-CW-g0rG5.js";const d={approve:"Approved","request-changes":"Changes requested",comment:"Commented",pending:"Pending review"};class p extends n{static{this.properties={...a,verdict:{type:String}}}constructor(){super(),this.verdict=""}updated(r){super.updated(r),this.afterParse("akit-review-chrome",()=>{o(this,"agent-kit-review-chrome",()=>{const e=(this.verdict??"").trim()||"pending",t=this.querySelectorAll("agent-kit-comment").length;return i`<span class="agent-kit-review-verdict" data-verdict=${e}
          >${d[e]??e}</span
        >
        <span class="agent-kit-review-count">${t} comment${t===1?"":"s"}</span>`})})}renderChrome(r){const e=r&&typeof r=="object"?r:{},t=typeof e.updated_at=="string"?e.updated_at:"",s=t?new Date(t):null;return!s||Number.isNaN(s.getTime())?i``:i`<span class="agent-kit-review-snapshot"
      >snapshot · <time datetime=${t}>${s.toISOString().slice(0,10)}</time></span
    >`}}c("agent-kit-review",p);
