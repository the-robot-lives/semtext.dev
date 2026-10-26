// Google tag (gtag.js) — config half; the loader half is the
// <script async src="https://www.googletagmanager.com/gtag/js?id=G-XZX7QMLD7H">
// tag in each public layout head (landing + main). Kept as a static file
// because Hologram templates treat `{...}` as interpolation, so the standard
// inline snippet cannot ride in a ~HOLO template.
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-XZX7QMLD7H');
