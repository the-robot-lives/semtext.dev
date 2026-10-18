import{C as r,a,b as c,c as n,d as o}from"./shared-CxbF3Zck.js";const d={approve:"Approved","request-changes":"Changes requested",comment:"Commented",pending:"Pending review"};class p extends r{static{this.properties={...a,verdict:{type:String}}}constructor(){super(),this.verdict=""}updated(s){super.updated(s),this.afterParse("akit-review-chrome",()=>{c(this,"agent-kit-review-chrome",()=>{const e=(this.verdict??"").trim()||"pending",t=this.querySelectorAll("agent-kit-comment").length;return n`<span class="agent-kit-review-verdict" data-verdict=${e}
          >${d[e]??e}</span
        >
        <span class="agent-kit-review-count">${t} comment${t===1?"":"s"}</span>`})})}renderChrome(s){const e=s&&typeof s=="object"?s:{},t=typeof e.updated_at=="string"?e.updated_at:"",i=t?new Date(t):null;return!i||Number.isNaN(i.getTime())?n``:n`<span class="agent-kit-review-snapshot"
      >snapshot · <time datetime=${t}>${i.toISOString().slice(0,10)}</time></span
    >`}}o("agent-kit-review",p);
