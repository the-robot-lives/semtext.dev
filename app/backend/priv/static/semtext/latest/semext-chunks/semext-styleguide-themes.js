import{d as n,b as r}from"./shared-DYgNPiGG.js";import{C as h}from"./cached-embed-USIB1p-Q.js";class i extends h{renderChrome(s){const e=Array.isArray(s?.themes)?s.themes.filter(l=>typeof l=="string"):null,t=e?e.length:this.querySelectorAll("semext-styleguide-theme").length,m=e?e.join(", "):"";return r`<p class="semext-styleguide-themes-summary">
      ${t} theme${t===1?"":"s"}${m?r` — ${m}`:""}
    </p>`}}n("semext-styleguide-themes",i);
