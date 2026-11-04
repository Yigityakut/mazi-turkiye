// "Bil bakalım" dikey video üreteci (HyperFrames). Bir fotoğraf kaydından render'a hazır bir proje klasörü üretir.
//
// Kullanım:
//   node marketing/templates/make-video.mjs <video.json> [çıktı klasörü]
//   cd <çıktı klasörü> && npx hyperframes@0.9.10 check && npx hyperframes@0.9.10 render
//
// video.json: { "id": "bb-001", "image": "photo.jpg" (yerel dosya yolu), "year": 1965, "location": "Galata Köprüsü, İstanbul",
//               "lat": 41.02, "lng": 28.97, "author": "…", "source": "Wikimedia Commons", "license": "CC BY-SA 4.0" }
// Kural: Günün gerçek fotoğrafları ASLA kullanılmaz; sadece geçmiş günler veya bonus havuz (Plan 9.2).
import fs from "node:fs";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname);
const map = JSON.parse(fs.readFileSync(path.join(here, "../../app/src/data/turkeyMap.json"), "utf8"));
const [, , specPath, outArg] = process.argv;
const v = JSON.parse(fs.readFileSync(specPath, "utf8"));
const out = path.resolve(outArg ?? path.join(here, "../videos", v.id));
fs.mkdirSync(path.join(out, "assets"), { recursive: true });
fs.cpSync(path.join(here, "bil-bakalim/assets"), path.join(out, "assets"), { recursive: true });
fs.copyFileSync(path.resolve(path.dirname(specPath), v.image), path.join(out, "assets/photo.jpg"));
for (const f of ["package.json", "hyperframes.json"]) fs.copyFileSync(path.join(here, "bil-bakalim", f), path.join(out, f));
fs.writeFileSync(path.join(out, "meta.json"), JSON.stringify({ id: v.id, name: v.id }, null, 2));

const P = map.projection;
const px = (v.lng - P.minLng) * P.k * P.scale, py = (P.maxLat - v.lat) * P.scale;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const provinces = map.provinces.map((p) => `<path d="${p.d}"/>`).join("");
const W = 1080, H = 1920, D = 15;

const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<script src="assets/gsap.min.js"></script>
<style>
@font-face { font-family: "Fraunces"; font-weight: 900; src: url("assets/fonts/Fraunces_900Black.ttf"); }
@font-face { font-family: "Fraunces"; font-weight: 700; src: url("assets/fonts/Fraunces_700Bold.ttf"); }
@font-face { font-family: "Inter"; font-weight: 400; src: url("assets/fonts/Inter_400Regular.ttf"); }
@font-face { font-family: "Inter"; font-weight: 600; src: url("assets/fonts/Inter_600SemiBold.ttf"); }
:root { --paper: #F2EADB; --ink: #1E1913; --muted: #6A5D4C; --accent: #B8432A; --water: #CFD9D4; --land: #FBF7EF; --line: #C9B596; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: var(--paper); }
#root { position: relative; width: ${W}px; height: ${H}px; background: var(--paper); font-family: "Inter", sans-serif; color: var(--ink); overflow: hidden; }
.abs { position: absolute; }
#intro { inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; background: var(--accent); color: #FFF8EE; z-index: 5; }
#intro .big { font: 900 150px/1 "Fraunces", serif; letter-spacing: -3px; }
#intro .small { font: 600 34px/1 "Inter", sans-serif; letter-spacing: 6px; text-transform: uppercase; opacity: .85; }
#photoWrap { left: 54px; top: 150px; width: 972px; height: 1080px; border-radius: 36px; overflow: hidden; background: #111; box-shadow: 0 30px 60px rgba(40,25,10,.25); z-index: 1; }
#photo { width: 100%; height: 100%; object-fit: cover; }
#q { left: 54px; right: 54px; top: 1280px; z-index: 2; }
#q h1 { font: 900 96px/1.02 "Fraunces", serif; letter-spacing: -2px; }
#q h1 em { font-style: normal; color: var(--accent); }
#q p { margin-top: 26px; font: 600 40px/1.25 "Inter", sans-serif; color: var(--muted); }
#count span { position: absolute; }
#count { right: 90px; top: 1010px; width: 190px; height: 190px; border-radius: 95px; background: var(--accent); color: #FFF8EE; display: flex; align-items: center; justify-content: center; font: 900 120px/1 "Fraunces", serif; z-index: 3; }
#reveal { inset: 0; background: var(--paper); z-index: 4; }
#mapBox { left: 40px; top: 210px; width: 1000px; height: 560px; border-radius: 30px; overflow: hidden; background: var(--water); }
#mapBox svg { width: 100%; height: 100%; }
#mapBox path { fill: var(--land); stroke: var(--line); stroke-width: 1.1; }
#pin { transform-origin: 50% 100%; }
#year { left: 54px; top: 830px; font: 900 220px/1 "Fraunces", serif; letter-spacing: -6px; color: var(--accent); }
#place { left: 54px; right: 54px; top: 1080px; font: 700 70px/1.1 "Fraunces", serif; }
#thumb { right: 54px; top: 820px; width: 300px; height: 220px; border-radius: 22px; overflow: hidden; }
#thumb img { width: 100%; height: 100%; object-fit: cover; }
#cta { left: 54px; right: 54px; top: 1400px; padding: 40px; border-radius: 30px; background: var(--ink); color: var(--paper); }
#cta b { display: block; font: 900 62px/1.05 "Fraunces", serif; }
#cta span { display: block; margin-top: 14px; font: 600 36px/1.2 "Inter", sans-serif; opacity: .8; }
#credit { left: 54px; right: 54px; bottom: 70px; font: 400 26px/1.3 "Inter", sans-serif; color: var(--muted); z-index: 6; }
#brand { left: 54px; top: 64px; font: 900 48px/1 "Fraunces", serif; z-index: 2; }
#brand small { font: 600 22px/1 "Inter", sans-serif; letter-spacing: 4px; text-transform: uppercase; color: var(--muted); margin-left: 10px; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}">
  <div id="brand" class="abs clip" data-start="0" data-duration="${D}">Mazi<small>Türkiye</small></div>
  <div id="photoWrap" class="abs clip" data-start="0" data-duration="${D}"><img id="photo" src="assets/photo.jpg" alt=""></div>
  <div id="q" class="abs clip" data-start="0" data-duration="${D}">
    <h1>Bu fotoğraf <em>nerede?</em><br>Hangi <em>yıl?</em></h1>
    <p id="prompt">Tahminini yorumlara yaz 👇</p>
  </div>
  <div id="count" class="abs clip" data-start="7" data-duration="5">
    ${[5, 4, 3, 2, 1].map((n, i) => `<span id="c${n}" class="clip" data-start="${7 + i}" data-duration="1">${n}</span>`).join("")}
  </div>
  <div id="reveal" class="abs clip" data-start="12" data-duration="3">
    <div id="mapBox" class="abs">
      <svg viewBox="${Math.max(px - 520, 0).toFixed(0)} ${Math.max(py - 290, 0).toFixed(0)} 1040 580" preserveAspectRatio="xMidYMid slice">
        <g>${provinces}</g>
        <g id="pinG" transform="translate(${px.toFixed(1)} ${py.toFixed(1)})">
          <g id="pin"><circle r="20" cy="-34" fill="#1E1913"/><path d="M-20 -34 L0 0 L20 -34Z" fill="#1E1913"/><circle r="8" cy="-34" fill="#FBF7EF"/></g>
        </g>
      </svg>
    </div>
    <div id="year" class="abs"><span id="yearN">${v.year - 30}</span></div>
    <div id="thumb" class="abs"><img src="assets/photo.jpg" alt=""></div>
    <div id="place" class="abs">${esc(v.location)}</div>
    <div id="cta" class="abs"><b>Her gün 5 fotoğraf.</b><span>Mazi Türkiye · App Store ve Google Play</span></div>
  </div>
  <div id="credit" class="abs clip" data-start="0" data-duration="${D}">Fotoğraf: ${esc(v.author)} · ${esc(v.source)} · ${esc(v.license)}</div>
  <div id="intro" class="abs clip" data-start="0" data-duration="1.4"><div class="small">Mazi Türkiye</div><div class="big">Bil bakalım</div></div>
</div>
<script>
const tl = gsap.timeline({ paused: true });
tl.fromTo("#intro .big", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, 0.05);
tl.to("#intro .big", { scale: 1.06, duration: 0.8, ease: "none" }, 0.5);
tl.fromTo("#photo", { scale: 1.0 }, { scale: 1.1, duration: 12, ease: "none" }, 0);
tl.fromTo("#q h1", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 1.5);
tl.fromTo("#prompt", { opacity: 0 }, { opacity: 1, duration: 0.4 }, 2.6);
tl.fromTo("#count", { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" }, 7);
[5, 4, 3, 2, 1].forEach((n, i) => tl.fromTo("#c" + n, { scale: 1.3 }, { scale: 1, duration: 0.3, ease: "power2.out" }, 7 + i));
tl.fromTo("#reveal", { opacity: 0 }, { opacity: 1, duration: 0.25 }, 12);
tl.fromTo("#pin", { y: -160, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "bounce.out" }, 12.2);
const yr = { v: ${v.year - 30} };
tl.to(yr, { v: ${v.year}, duration: 1.0, ease: "power3.out",
  onUpdate: () => { document.getElementById("yearN").textContent = Math.round(yr.v); } }, 12.2);
tl.fromTo("#place", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 12.9);
tl.fromTo("#cta", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 13.3);
window.__timelines["main"] = tl;
tl.seek(0);
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(out, "index.html"), html);
console.log("hazır:", out);
