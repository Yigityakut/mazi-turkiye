// GitHub Pages çıktısı: web/ → dist-pages/, kökten mutlak linkler BASE altına taşınır.
// Neden: *.vercel.app Türkiye'den erişilemiyor, alan adı henüz yok; site https://yigityakut.github.io/maziturkiye/ altında yayınlanır.
// Alan adı alınınca bu betiğe gerek kalmaz (Vercel + vercel.json).
// Kullanım: node web/pages.mjs [/maziturkiye]
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "/maziturkiye";
const SRC = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(SRC, "..", "dist-pages");
const SKIP = new Set(["pages.mjs", "vercel.json", ".vercel", ".gitignore"]);

fs.rmSync(OUT, { recursive: true, force: true });
const walk = (dir, rel = "") => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const s = path.join(dir, e.name), r = path.join(rel, e.name), d = path.join(OUT, r);
    if (e.isDirectory()) { fs.mkdirSync(d, { recursive: true }); walk(s, r); continue; }
    fs.mkdirSync(path.dirname(d), { recursive: true });
    if (/\.(html|js|css)$/.test(e.name)) {
      let t = fs.readFileSync(s, "utf8");
      // Tek geçiş: "/x…" ve url(/x…) (x küçük harf); kök link ="/" ayrıca. split("/") gibi JS'e dokunulmaz.
      t = t.replace(/(["'`]|url\()\/(?=[a-z])/g, `$1${BASE}/`)
        .replace(/(=\s*["'])\/(["'])/g, `$1${BASE}/$2`);
      // /m/KOD ve /d/TOKEN: Pages'te 404.html ?c= ile yönlendirir; sayfa kodu sorgudan okur
      t = t.replace('location.pathname.split("/").filter(Boolean)[1]', '(new URLSearchParams(location.search).get("c")||"")');
      fs.writeFileSync(d, t);
    } else fs.copyFileSync(s, d);
  }
};
fs.mkdirSync(OUT, { recursive: true });
walk(SRC);
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
// Pages'te yeniden yazma yok: /m/KOD ve /d/TOKEN 404.html'e düşer → sorgu parametreli sayfaya yönlendir.
const p404 = path.join(OUT, "404.html");
fs.writeFileSync(p404, fs.readFileSync(p404, "utf8").replace("<head>", `<head><script>(function(){var m=location.pathname.match(/\\/(m|d)\\/([A-Za-z0-9_-]+)\\/?$/);if(m)location.replace("${BASE}/"+m[1]+"/?c="+m[2]);})();</script>`));
console.log("dist-pages hazır, BASE =", BASE);
