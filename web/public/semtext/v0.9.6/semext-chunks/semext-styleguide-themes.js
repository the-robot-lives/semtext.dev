import{d as n,C as h,b as l}from"./shared-qr2elKZA.js";class i extends h{renderChrome(s){const e=Array.isArray(s?.themes)?s.themes.filter(r=>typeof r=="string"):null,t=e?e.length:this.querySelectorAll("semext-styleguide-theme").length,m=e?e.join(", "):"";return l`<p class="semext-styleguide-themes-summary">
      ${t} theme${t===1?"":"s"}${m?l` — ${m}`:""}
    </p>`}}n("semext-styleguide-themes",i);
