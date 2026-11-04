// Marka görsellerini HTML kaynaklarından PNG'ye çevirir (Playwright + Chromium, ağ gerekmez).
//
// Kullanım (repo kökünden):
//   node marketing/social/src/render.cjs              # hepsi
//   node marketing/social/src/render.cjs og profile   # sadece seçilenler
//
// Gereken: app/node_modules (Fraunces ve Inter TTF'leri için `cd app && npm install`), playwright + chromium.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const here = __dirname;
const root = path.resolve(here, "../../..");

// Harita verisini sayfaların doğrudan tarayıcıda açılabilmesi için JS olarak yaz
const map = JSON.parse(fs.readFileSync(path.join(root, "app/src/data/turkeyMap.json"), "utf8"));
fs.writeFileSync(
  path.join(here, "map-data.js"),
  "// Üretilen dosya (render.cjs): app/src/data/turkeyMap.json — Natural Earth, kamu malı\nwindow.TR_MAP = " +
    JSON.stringify({ width: map.width, height: map.height, projection: map.projection, provinces: map.provinces, waterLines: map.waterLines, cities: map.cities }) +
    ";\n",
);

const jobs = [
  { id: "og", html: "og.html", w: 1200, h: 630, out: "web/assets/og.png" },
  { id: "x", html: "cover-x.html", w: 1500, h: 500, out: "marketing/social/cover-1500x500.png" },
  { id: "youtube", html: "youtube-banner.html", w: 2560, h: 1440, out: "marketing/social/youtube-banner-2560x1440.png" },
  { id: "profile", html: "profile.html", w: 1080, h: 1080, out: "marketing/social/profile-1080.png" },
];

(async () => {
  const only = process.argv.slice(2);
  const browser = await chromium.launch();
  try {
    for (const j of jobs.filter((j) => !only.length || only.includes(j.id))) {
      const page = await browser.newPage({ viewport: { width: j.w, height: j.h }, deviceScaleFactor: 1 });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("requestfailed", (r) => errors.push("yüklenemedi: " + r.url()));
      await page.goto("file://" + path.join(here, j.html));
      // Tüm @font-face'leri zorla yükle; eksik dosya varsa hata ver (Türkçe karakterler sistem fontuna düşmesin)
      const fontState = await page.evaluate(async () => {
        await Promise.allSettled([...document.fonts].map((f) => f.load()));
        await document.fonts.ready;
        return [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.style}: ${f.status}`);
      });
      const bad = fontState.filter((s) => !s.endsWith("loaded"));
      if (bad.length || errors.length) throw new Error(`${j.id}: ${[...bad, ...errors].join(" | ")}`);
      await page.screenshot({ path: path.join(root, j.out), type: "png" });
      const kb = Math.round(fs.statSync(path.join(root, j.out)).size / 1024);
      console.log(`✓ ${j.out} (${j.w}×${j.h}, ${kb} KB)`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
