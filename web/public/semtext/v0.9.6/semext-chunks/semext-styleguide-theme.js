import{d as o,C as h,b as t,s as u,A as m}from"./shared-qr2elKZA.js";function c(l){if(!l||typeof l!="object")return null;const e=l.theme??l;return e&&typeof e=="object"?e:null}function i(l){const e=(l??"").trim();return!e||e.length>64?null:/^#[0-9a-f]{3,8}$/i.test(e)||/^(rgba?|hsla?)\(\s*[-0-9.%,\s/]+\)$/i.test(e)||/^[a-z]+$/i.test(e)?e:null}class y extends h{renderChrome(e){const n=c(e);if(!n)return t`<p class="semext-styleguide-theme-missing">No theme snapshot.</p>`;const r=(u(this,"src")??"").trim(),d=Array.isArray(n.colors)?n.colors:[],s=n.typography??{};return t`
      <div class="semext-styleguide-theme-card">
        <h3 class="semext-styleguide-theme-name">${n.name??n.slug??"Theme"}</h3>
        ${d.length?t`
              <ul class="semext-styleguide-theme-swatches">
                ${d.map(a=>t`
                    <li class="semext-styleguide-theme-swatch">
                      <span
                        class="semext-styleguide-theme-dot"
                        style=${i(a.value)?`background: ${i(a.value)}`:m}
                      ></span>
                      <code class="semext-styleguide-theme-token">${a.token??""}</code>
                      <span class="semext-styleguide-theme-value">${a.value??""}</span>
                    </li>
                  `)}
              </ul>
            `:m}
        ${s.heading||s.body?t`
              <dl class="semext-styleguide-theme-type">
                ${s.heading?t`<dt>heading</dt><dd>${s.heading}</dd>`:m}
                ${s.body?t`<dt>body</dt><dd>${s.body}</dd>`:m}
              </dl>
            `:m}
        ${s.sample?t`<p class="semext-styleguide-theme-sample">${s.sample}</p>`:m}
        ${r?t`<a class="semext-styleguide-theme-preview" href=${r} target="_blank" rel="noopener">Preview theme CSS</a>`:m}
      </div>
    `}}o("semext-styleguide-theme",y);
