#!/usr/bin/env node
/**
 * Mağaza ekran görüntüsü üretici. Kendisi derleme yapmaz: demo modunda dışa aktarılmış web derlemesini alır.
 *
 *   node store/screenshots/render.mjs <derleme-klasörü> [--dark] [--only=01,03] [--platforms=ios,android]
 *                                                       [--no-extras] [--keep-work]
 *
 * 1. Derlemeyi yerel bir HTTP sunucusundan servis eder (tek sayfalık uygulama: bilinmeyen yol → index.html).
 * 2. captions.md'deki her ekranı Playwright'ta telefon boyutunda açar (iOS 440×956 @3x, Android 412×915 @3x),
 *    çentik/durum çubuğu payını CDP ile güvenli alan olarak verir, saati sabitler ve ham ekranı yakalar.
 * 3. Her ham ekranı HTML'de bir pazarlama karesine yerleştirir (kağıt zemin, Fraunces başlık, cihaz çerçevesi).
 * 4. Çıktılar: out/ios-6.9/NN-*.png (1320×2868), out/android-phone/NN-*.png (1080×1920),
 *    out/feature-graphic.png (1024×500), out/iap-review.png (1320×2868, Pro ekranı).
 */
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url); // NODE_PATH'teki (genel) playwright da bulunsun diye
const { chromium } = require("playwright");

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const FONTS = {
  "fraunces-900.ttf": "app/node_modules/@expo-google-fonts/fraunces/900Black/Fraunces_900Black.ttf",
  "fraunces-900i.ttf": "app/node_modules/@expo-google-fonts/fraunces/900Black_Italic/Fraunces_900Black_Italic.ttf",
  "fraunces-600i.ttf": "app/node_modules/@expo-google-fonts/fraunces/600SemiBold_Italic/Fraunces_600SemiBold_Italic.ttf",
  "inter-500.ttf": "app/node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf",
  "inter-600.ttf": "app/node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf",
  "inter-700.ttf": "app/node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf",
};

// ------------------------------------------------------------------ ayarlar

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
const BUILD = argv.find((a) => !a.startsWith("--"));
if (!BUILD || !existsSync(join(resolve(BUILD), "index.html"))) {
  console.error("Kullanım: node store/screenshots/render.mjs <EXPO_PUBLIC_DEMO=1 ile dışa aktarılmış web derlemesi>");
  process.exit(1);
}
const BUILD_DIR = resolve(BUILD);
const THEME = flag("dark") ? "dark" : "light";
const ONLY = opt("only")?.split(",");
const PLATFORMS = (opt("platforms") ?? "ios,android").split(",");
const OUT = join(HERE, "out");
const SUFFIX = THEME === "dark" ? "-dark" : "";

/** Ekranlardaki saat ve "yeni fotoğraflara kalan süre" sabit: 19:42, gün dönüşüne 08:17:23. */
const FIXED_TIME = new Date("2026-12-03T19:42:37+03:00");
const STATUS_TIME = "19:42";

const DEVICES = {
  ios: {
    viewport: { width: 440, height: 956 }, insets: { top: 62, bottom: 34 },
    canvas: { w: 1320, h: 2868 }, dir: `ios-6.9${SUFFIX}`,
  },
  android: {
    viewport: { width: 412, height: 915 }, insets: { top: 44, bottom: 24 },
    canvas: { w: 1080, h: 1920 }, dir: `android-phone${SUFFIX}`,
  },
};

const TOKENS = {
  light: { bg: "#F2EADB", bg2: "#E9DEC9", ink: "#1E1913", muted: "#6A5D4C", accent: "#B8432A", soft: "#F1D6C9", appBg: "#F2EADB", statusInk: "#1E1913", grain: 0.07 },
  dark: { bg: "#14110D", bg2: "#1E1A14", ink: "#F1E8D8", muted: "#B2A48E", accent: "#E0694A", soft: "#4A2A20", appBg: "#14110D", statusInk: "#F1E8D8", grain: 0.05 },
};
const T = TOKENS[THEME];

// ------------------------------------------------------------------ başlıklar (captions.md)

function readShots() {
  const md = readFileSync(join(HERE, "captions.md"), "utf8");
  const rows = md.split("\n").filter((l) => /^\|\s*\d{2}\s*\|/.test(l));
  return rows.map((l) => {
    const [id, slug, route, headline, sub] = l.split("|").slice(1, -1).map((c) => c.trim());
    return { id, slug, route, headline, sub };
  }).filter((s) => !ONLY || ONLY.includes(s.id));
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const rich = (s) => esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");

// ------------------------------------------------------------------ yerel sunucu

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".ttf": "font/ttf", ".otf": "font/otf", ".woff": "font/woff", ".woff2": "font/woff2", ".ico": "image/x-icon", ".map": "application/json",
};

function inside(root, p) {
  const full = normalize(join(root, p));
  return full === root || full.startsWith(root + sep) ? full : null;
}

function startServer(mounts) {
  const indexHtml = readFileSync(join(BUILD_DIR, "index.html"), "utf8")
    .replace(/<html lang="[^"]*">/, '<html lang="tr">') // Türkçe büyük harf: i → İ (etiketler text-transform: uppercase)
    .replace(/(name="viewport" content="[^"]*)"/, '$1, viewport-fit=cover"'); // env(safe-area-inset-*) çalışsın
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const send = (file) => {
      res.writeHead(200, { "content-type": MIME[extname(file).toLowerCase()] ?? "application/octet-stream", "cache-control": "no-store" });
      res.end(readFileSync(file));
    };
    for (const [prefix, dir] of Object.entries(mounts)) {
      if (path.startsWith(prefix)) {
        const f = inside(dir, path.slice(prefix.length));
        if (f && existsSync(f) && statSync(f).isFile()) return send(f);
        res.writeHead(404).end();
        return;
      }
    }
    const f = inside(BUILD_DIR, path);
    if (path !== "/" && f && existsSync(f) && statSync(f).isFile() && !f.endsWith("index.html")) return send(f);
    if (extname(path) && path !== "/index.html") { res.writeHead(404).end(); return; }
    res.writeHead(200, { "content-type": MIME[".html"], "cache-control": "no-store" });
    res.end(indexHtml);
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok({ server, base: `http://127.0.0.1:${server.address().port}` })));
}

// ------------------------------------------------------------------ ham ekran yakalama

async function newAppPage(browser, dev, colorScheme, viewport = dev.viewport, insets = dev.insets) {
  const ctx = await browser.newContext({
    viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme,
    locale: "tr-TR", timezoneId: "Europe/Istanbul",
  });
  await ctx.clock.setFixedTime(FIXED_TIME);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setSafeAreaInsetsOverride", { insets: { top: insets.top, bottom: insets.bottom, left: 0, right: 0 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  return { ctx, page, errors };
}

async function capture(browser, base, dev, route, file, { platform, viewport, insets } = {}) {
  const { ctx, page, errors } = await newAppPage(browser, dev, THEME, viewport, insets);
  try {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.fonts.status === "loaded");
    await page.waitForFunction(() => !document.querySelector('[role="progressbar"]'), null, { timeout: 20000 });
    await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 20000 });
    // Açılım anı: çizgi, iğneler, yıl ve puan sayaçları otursun
    await page.waitForTimeout(/reveal|summary/.test(route) ? 4200 : 2200);
    // ?demo_scroll=<metin>: o metni içeren kartı ekranın üstüne kaydır (uygulama bu parametreyi yok sayar)
    const scrollTo = new URL(base + route).searchParams.get("demo_scroll");
    if (scrollTo) {
      await page.evaluate((needle) => {
        const low = (x) => x.toLocaleLowerCase("tr");
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let el = null;
        for (let n = w.nextNode(); n && !el; n = w.nextNode()) if (low(n.nodeValue).includes(low(needle))) el = n.parentElement;
        if (!el) throw new Error(`demo_scroll: "${needle}" bulunamadı`);
        let sc = el.parentElement;
        while (sc && !(sc.scrollHeight > sc.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
        if (sc) sc.scrollTop += el.getBoundingClientRect().top - sc.getBoundingClientRect().top - 40;
      }, scrollTo);
      await page.waitForTimeout(400);
    }
    // Web'de Platform.OS "web": Pro ekranındaki mağaza adı iOS derlemesinde "App Store"dur
    if (platform === "ios") {
      await page.evaluate(() => {
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) if (n.nodeValue.includes("Google Play")) n.nodeValue = n.nodeValue.replace("Google Play", "App Store");
      });
    }
    const text = await page.evaluate(() => document.body.innerText);
    if (/Bağlantı kurulamadı|Bir şeyler ters gitti/.test(text)) throw new Error(`${route}: ekran hata gösteriyor\n${text.slice(0, 300)}`);
    await page.screenshot({ path: file });
    if (errors.length) console.warn(`  uyarı (${route}): ${errors.slice(0, 3).join(" | ").slice(0, 400)}`);
  } finally {
    await ctx.close();
  }
}

// ------------------------------------------------------------------ çerçeve ve kompozisyon

const fontFaces = `
@font-face { font-family: "Fraunces"; font-weight: 900; src: url(/__fonts/fraunces-900.ttf); }
@font-face { font-family: "Fraunces"; font-weight: 900; font-style: italic; src: url(/__fonts/fraunces-900i.ttf); }
@font-face { font-family: "Fraunces"; font-weight: 600; font-style: italic; src: url(/__fonts/fraunces-600i.ttf); }
@font-face { font-family: "Inter"; font-weight: 500; src: url(/__fonts/inter-500.ttf); }
@font-face { font-family: "Inter"; font-weight: 600; src: url(/__fonts/inter-600.ttf); }
@font-face { font-family: "Inter"; font-weight: 700; src: url(/__fonts/inter-700.ttf); }`;

const grain = (opacity) => `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.24  0 0 0 0 0.16  0 0 0 0 0.08  0 0 0 ${opacity} 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
)}")`;

/** iOS / Android durum çubuğu simgeleri (pt cinsinden, `k` ile ölçeklenir) */
function statusBar(platform, k, color) {
  if (platform === "ios") {
    return `
    <div class="sb" style="height:${54 * k}px">
      <div style="position:absolute;left:0;width:${158 * k}px;top:${17 * k}px;text-align:center;font:600 ${17.5 * k}px/1 Inter;letter-spacing:${-0.2 * k}px;color:${color}">${STATUS_TIME}</div>
      <div style="position:absolute;right:${30 * k}px;top:${19.5 * k}px;display:flex;gap:${6 * k}px;align-items:center">
        <svg width="${18 * k}" height="${12 * k}" viewBox="0 0 18 12" fill="${color}"><rect x="0" y="7.5" width="3.2" height="4.5" rx="1"/><rect x="4.8" y="5.2" width="3.2" height="6.8" rx="1"/><rect x="9.6" y="2.7" width="3.2" height="9.3" rx="1"/><rect x="14.4" y="0" width="3.2" height="12" rx="1"/></svg>
        <svg width="${16 * k}" height="${12 * k}" viewBox="0 0 16 12" fill="${color}"><path d="M8 2.3c2.5 0 4.8 1 6.5 2.6l1.2-1.3A10.9 10.9 0 0 0 8 .5C5 .5 2.3 1.6.3 3.6l1.2 1.3A9.2 9.2 0 0 1 8 2.3z"/><path d="M8 5.6c1.6 0 3 .6 4.1 1.6l1.2-1.3A7.8 7.8 0 0 0 8 3.8c-2 0-3.9.8-5.3 2.1l1.2 1.3A6 6 0 0 1 8 5.6z"/><path d="M8 8.9c.7 0 1.3.3 1.8.7L8 11.6 6.2 9.6c.5-.4 1.1-.7 1.8-.7z"/></svg>
        <svg width="${27.5 * k}" height="${13 * k}" viewBox="0 0 27.5 13"><rect x="0.5" y="0.5" width="24" height="12" rx="3.8" fill="none" stroke="${color}" stroke-opacity="0.38"/><rect x="2.2" y="2.2" width="18.6" height="8.6" rx="2.2" fill="${color}"/><path d="M26 4.3v4.4c.9-.3 1.5-1.2 1.5-2.2s-.6-1.9-1.5-2.2z" fill="${color}" fill-opacity="0.45"/></svg>
      </div>
    </div>`;
  }
  return `
    <div class="sb" style="height:${44 * k}px">
      <div style="position:absolute;left:${26 * k}px;top:${14 * k}px;font:500 ${14.5 * k}px/1 Inter;color:${color}">${STATUS_TIME}</div>
      <div style="position:absolute;right:${22 * k}px;top:${13.5 * k}px;display:flex;gap:${5 * k}px;align-items:center">
        <svg width="${16 * k}" height="${16 * k}" viewBox="0 0 24 24" fill="${color}"><path d="M12 21 0.6 7.6A17.6 17.6 0 0 1 12 3.4c4.3 0 8.3 1.6 11.4 4.2z"/></svg>
        <svg width="${15 * k}" height="${15 * k}" viewBox="0 0 24 24" fill="${color}"><path d="M2 22 22 2v20z"/></svg>
        <svg width="${9 * k}" height="${15 * k}" viewBox="0 0 9 15"><rect x="2.8" y="0" width="3.4" height="1.6" rx="0.5" fill="${color}"/><rect x="0" y="1.3" width="9" height="13.7" rx="1.6" fill="${color}"/></svg>
      </div>
    </div>`;
}

/** Ham ekran + durum çubuğu + çentik/kamera + ana ekran çizgisi (cihaz ekranının içi) */
function screenInner(platform, k, shotSrc) {
  const homeColor = THEME === "dark" ? "rgba(241,232,216,0.85)" : "rgba(30,25,19,0.85)";
  const cutout = platform === "ios"
    ? `<div style="position:absolute;top:${11 * k}px;left:50%;width:${125 * k}px;height:${37 * k}px;margin-left:${-62.5 * k}px;border-radius:${19 * k}px;background:#000"></div>`
    : `<div style="position:absolute;top:${13 * k}px;left:50%;width:${19 * k}px;height:${19 * k}px;margin-left:${-9.5 * k}px;border-radius:50%;background:#000;box-shadow:0 0 0 ${1.5 * k}px rgba(0,0,0,.25)"></div>`;
  const home = platform === "ios"
    ? `<div style="position:absolute;bottom:${8 * k}px;left:50%;width:${140 * k}px;height:${5 * k}px;margin-left:${-70 * k}px;border-radius:${3 * k}px;background:${homeColor}"></div>`
    : `<div style="position:absolute;bottom:${9 * k}px;left:50%;width:${108 * k}px;height:${4 * k}px;margin-left:${-54 * k}px;border-radius:${2 * k}px;background:${homeColor}"></div>`;
  // Alt kenarda kesilen içerik (kaydırılabilir listeler) ana ekran çizgisinin altında yumuşakça kaybolsun
  const fade = `<div style="position:absolute;left:0;right:0;bottom:0;height:${(platform === "ios" ? 26 : 22) * k}px;background:linear-gradient(to bottom, ${T.appBg}00, ${T.appBg} 75%)"></div>`;
  return `<img class="shot" src="${shotSrc}">${fade}${statusBar(platform, k, T.statusInk)}${cutout}${home}`;
}

function frameCss() {
  return `
  ${fontFaces}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: ${T.bg}; }
  body { position: relative; overflow: hidden; -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; }
  .paper { position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 85% 45% at 50% 6%, ${THEME === "dark" ? "rgba(224,105,74,0.10)" : "rgba(255,251,243,0.85)"}, transparent 70%),
      radial-gradient(ellipse 120% 70% at 50% 110%, ${THEME === "dark" ? "rgba(0,0,0,0.35)" : "rgba(184,67,42,0.07)"}, transparent 70%),
      ${T.bg}; }
  .grain { position: absolute; inset: 0; background-image: ${grain(T.grain)}; background-size: 320px 320px; }
  .head { position: absolute; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  h1 { font-family: Fraunces; font-weight: 900; color: ${T.ink}; text-wrap: balance; font-feature-settings: "kern", "liga"; }
  h1 em { font-style: italic; color: ${T.accent}; white-space: nowrap; }
  .sub { font-family: Inter; font-weight: 500; color: ${T.muted}; text-wrap: balance; }
  .device { position: absolute; background: linear-gradient(150deg, #4a4037 0%, #1b1712 22%, #120f0b 60%, #2c251e 100%); }
  .device::before { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.10), inset 0 0 0 4px rgba(0,0,0,0.35); pointer-events: none; }
  .screen { position: absolute; overflow: hidden; background: ${T.appBg}; }
  .screen .shot { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .sb { position: absolute; left: 0; right: 0; top: 0; }
  .btn { position: absolute; background: linear-gradient(90deg, #2c251e, #4a4037 50%, #2c251e); }
  .draft { position: absolute; left: 50%; transform: translateX(-50%); font-family: Inter; font-weight: 600; letter-spacing: 0.04em;
    color: ${T.accent}; background: ${T.soft}; border-radius: 999px; white-space: nowrap; }`;
}

function composeHtml(platform, shot, shotSrc, draft) {
  const dev = DEVICES[platform];
  const { w: W, h: H } = dev.canvas;
  const ios = platform === "ios";
  // Ekran genişliği → ölçek k (1 pt = k px)
  const screenW = ios ? 1000 : 660;
  const k = screenW / dev.viewport.width;
  const screenH = Math.round(dev.viewport.height * k);
  const bezel = ios ? Math.round(9 * k) : Math.round(7 * k);
  const devW = screenW + 2 * bezel, devH = screenH + 2 * bezel;
  const bottom = ios ? 110 : 60;
  const devTop = H - bottom - devH;
  const devLeft = Math.round((W - devW) / 2);
  const screenR = (ios ? 56 : 34) * k;
  const h1 = ios ? 112 : 88, sub = ios ? 44 : 34;
  const btn = (side, top, height) =>
    `<div class="btn" style="${side}:${devLeft - 4 * k}px;top:${devTop + top * k}px;width:${4.5 * k}px;height:${height * k}px;border-radius:${2 * k}px"></div>`;
  const buttons = ios
    ? btn("left", 120, 32) + btn("left", 175, 60) + btn("left", 245, 60) + `<div class="btn" style="left:${devLeft + devW - 0.5 * k}px;top:${devTop + 200 * k}px;width:${4.5 * k}px;height:${95 * k}px;border-radius:${2 * k}px"></div>`
    : `<div class="btn" style="left:${devLeft + devW - 0.5 * k}px;top:${devTop + 150 * k}px;width:${4 * k}px;height:${48 * k}px;border-radius:${2 * k}px"></div>` +
      `<div class="btn" style="left:${devLeft + devW - 0.5 * k}px;top:${devTop + 225 * k}px;width:${4 * k}px;height:${90 * k}px;border-radius:${2 * k}px"></div>`;
  const shadow = THEME === "dark"
    ? `0 ${40 * k}px ${80 * k}px ${-20 * k}px rgba(0,0,0,0.65), 0 ${10 * k}px ${24 * k}px ${-8 * k}px rgba(0,0,0,0.5)`
    : `0 ${46 * k}px ${90 * k}px ${-24 * k}px rgba(74,46,18,0.42), 0 ${14 * k}px ${30 * k}px ${-10 * k}px rgba(74,46,18,0.28), 0 0 0 1px rgba(74,46,18,0.08)`;
  const rim = THEME === "dark" ? `, 0 0 0 ${1.2 * k}px rgba(241,232,216,0.16)` : "";
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>${frameCss()}
    body { width: ${W}px; height: ${H}px; }
    h1 { font-size: ${h1}px; line-height: 1.02; letter-spacing: ${-0.012 * h1}px; max-width: ${ios ? 1160 : 950}px; }
    .sub { font-size: ${sub}px; line-height: 1.3; margin-top: ${ios ? 30 : 22}px; max-width: ${ios ? 1080 : 900}px; }
    .draft { bottom: ${ios ? 40 : 18}px; font-size: ${ios ? 28 : 20}px; padding: ${ios ? "12px 28px" : "7px 18px"}; }
  </style></head><body>
    <div class="paper"></div><div class="grain"></div>
    <div class="head" style="top:${ios ? 70 : 34}px;height:${devTop - (ios ? 70 : 34) - (ios ? 70 : 40)}px">
      <h1>${rich(shot.headline)}</h1>
      ${shot.sub ? `<div class="sub">${rich(shot.sub)}</div>` : ""}
    </div>
    ${buttons}
    <div class="device" style="left:${devLeft}px;top:${devTop}px;width:${devW}px;height:${devH}px;border-radius:${screenR + bezel}px;box-shadow:${shadow}${rim}">
      <div class="screen" style="left:${bezel}px;top:${bezel}px;width:${screenW}px;height:${screenH}px;border-radius:${screenR}px">
        ${screenInner(platform, k, shotSrc)}
      </div>
    </div>
    ${draft ? `<div class="draft">TASLAK · yer tutucu fotoğraflar</div>` : ""}
  </body></html>`;
}

/** App Store Connect IAP inceleme görseli: Pro ekranı iOS'taki gibi alttan açılan sayfa (sheet) olarak */
function iapHtml(shotSrc, draft) {
  const k = 3, W = 1320, H = 2868;
  const sheetTop = 66 * k;
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>${frameCss()}
    body { width: ${W}px; height: ${H}px; background: #000; }
    .draft { bottom: 40px; font-size: 28px; padding: 12px 28px; }
  </style></head><body>
    <div style="position:absolute;left:${16 * k}px;right:${16 * k}px;top:${56 * k}px;height:${60 * k}px;border-radius:${12 * k}px;background:${T.appBg};opacity:0.55"></div>
    ${statusBar("ios", k, "#fff")}
    <div style="position:absolute;left:0;right:0;top:${sheetTop}px;bottom:0;border-radius:${14 * k}px ${14 * k}px 0 0;overflow:hidden;background:${T.appBg}">
      <img class="shot" src="${shotSrc}" style="position:absolute;inset:0;width:100%;height:100%">
      <div style="position:absolute;bottom:${8 * k}px;left:50%;width:${140 * k}px;height:${5 * k}px;margin-left:${-70 * k}px;border-radius:${3 * k}px;background:${THEME === "dark" ? "rgba(241,232,216,0.85)" : "rgba(30,25,19,0.85)"}"></div>
    </div>
    ${draft ? `<div class="draft">TASLAK · yer tutucu fotoğraflar</div>` : ""}
  </body></html>`;
}

/** Google Play öne çıkan görsel (1024×500): marka, slogan ve harita üzerinde tahmin → cevap motifi */
function featureHtml(fixtures, draft) {
  const map = JSON.parse(readFileSync(join(ROOT, "app/src/data/turkeyMap.json"), "utf8"));
  const P = map.projection;
  const proj = (lat, lng) => [(lng - P.minLng) * P.k * P.scale, (P.maxLat - lat) * P.scale];
  const mapW = 560, s = mapW / map.width, mapH = map.height * s;
  const mapX = 418, mapY = 250 - mapH / 2 + 18;
  const f = fixtures[2] ?? fixtures[0];
  const [ax, ay] = proj(f.lat, f.lng);
  const [gx, gy] = proj(f.lat - 1.05, f.lng + 1.55); // tahmin: cevaptan ~170 km içeride
  const pin = (x, y, size) => `
    <g transform="translate(${x} ${y}) scale(${size / 1024}) translate(-512 -846)">
      <path d="M512 150c-150 0-262 112-262 258 0 190 220 400 246 424a24 24 0 0 0 32 0c26-24 246-234 246-424 0-146-112-258-262-258z" fill="#F7EEDD"/>
      <circle cx="512" cy="410" r="150" fill="#A63A24"/>
      <line x1="512" y1="410" x2="512" y2="318" stroke="#F7EEDD" stroke-width="26" stroke-linecap="round"/>
      <line x1="512" y1="410" x2="574" y2="452" stroke="#F7EEDD" stroke-width="26" stroke-linecap="round"/>
      <circle cx="512" cy="410" r="22" fill="#F7EEDD"/>
    </g>`;
  const provinces = map.provinces.map((p) => `<path d="${p.d}"/>`).join("");
  const water = map.waterLines.map((w) => `<path d="${w.d}" stroke-width="${w.w}"/>`).join("");
  const A = [mapX + ax * s, mapY + ay * s], G = [mapX + gx * s, mapY + gy * s];
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>${fontFaces}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 1024px; height: 500px; overflow: hidden; position: relative; -webkit-font-smoothing: antialiased;
      background: radial-gradient(ellipse 90% 120% at 30% 20%, #C9512F, #A63A24 70%, #962F1C); }
    .grain { position: absolute; inset: 0; background-image: ${grain(0.1)}; background-size: 320px 320px; mix-blend-mode: multiply; }
    .brand { position: absolute; left: 64px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; gap: 0; }
    .icon { width: 96px; height: 96px; border-radius: 22px; box-shadow: 0 10px 24px rgba(60,16,6,.35), 0 0 0 1.5px rgba(255,240,225,.25); margin-bottom: 26px; }
    h1 { font: 900 72px/0.98 Fraunces; color: #F7EEDD; letter-spacing: -1.2px; }
    .tag { font: italic 600 30px/1.2 Fraunces; color: #F7EEDD; opacity: .92; margin-top: 16px; }
    .meta { font: 600 15px/1 Inter; letter-spacing: .16em; color: #F7EEDD; opacity: .62; margin-top: 22px; text-transform: uppercase; }
    .print { position: absolute; background: #FBF7EF; padding: 8px 8px 22px; box-shadow: 0 16px 30px rgba(60,16,6,.38), 0 2px 6px rgba(60,16,6,.25); }
    .print img { display: block; width: 100%; height: 100%; object-fit: cover; filter: sepia(.2) contrast(1.02); }
    .chip { position: absolute; font: 900 22px/1 Fraunces; color: #A63A24; background: #F7EEDD; border-radius: 10px; padding: 7px 10px 6px; box-shadow: 0 6px 14px rgba(60,16,6,.3); }
    .draft { position: absolute; right: 16px; bottom: 12px; font: 600 12px/1 Inter; letter-spacing: .06em; color: #F7EEDD; background: rgba(0,0,0,.25); border-radius: 99px; padding: 6px 10px; }
  </style></head><body>
    <div class="grain"></div>
    <svg width="1024" height="500" style="position:absolute;inset:0">
      <g transform="translate(${mapX} ${mapY}) scale(${s})" fill="rgba(255,244,230,0.13)" stroke="rgba(255,244,230,0.42)" stroke-width="${0.9 / s}" stroke-linejoin="round">${provinces}</g>
      <g transform="translate(${mapX} ${mapY}) scale(${s})" fill="none" stroke="#B4462B" stroke-linecap="round" stroke-linejoin="round">${water}</g>
      <line x1="${G[0]}" y1="${G[1]}" x2="${A[0]}" y2="${A[1]}" stroke="#F7EEDD" stroke-width="3" stroke-dasharray="7 6" stroke-linecap="round"/>
      <circle cx="${G[0]}" cy="${G[1]}" r="10" fill="#A63A24" stroke="#F7EEDD" stroke-width="4"/>
      ${pin(A[0], A[1], 74)}
    </svg>
    <div class="chip" style="left:${A[0] + 24}px;top:${A[1] - 66}px">${f.year}</div>
    <div class="print" style="left:${mapX + 306}px;top:18px;width:184px;height:140px;transform:rotate(4deg)">
      <img src="/__build/demo/${f.file}">
    </div>
    <div class="brand">
      <img class="icon" src="/__brand/icon-1024.png">
      <h1>Mazi<br>Türkiye</h1>
      <div class="tag">Bu fotoğraf nerede, hangi yıl?</div>
    </div>
    ${draft ? `<div class="draft">TASLAK</div>` : ""}
  </body></html>`;
}

async function renderHtml(browser, base, work, name, html, size, out) {
  writeFileSync(join(work, `${name}.html`), html);
  const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  try {
    await page.goto(`${base}/__work/${name}.html`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
    const missing = await page.evaluate(async () => {
      const need = ["900 40px Fraunces", "italic 900 40px Fraunces", "500 20px Inter"];
      await Promise.all(need.map((f) => document.fonts.load(f, "ğşıİ").catch(() => null)));
      return need.filter((f) => !document.fonts.check(f, "ğşıİ"));
    });
    if (missing.length) throw new Error(`${name}: font yüklenmedi: ${missing.join(", ")}`);
    const overflow = await page.evaluate(() => {
      const h = document.querySelector(".head");
      return h ? h.scrollHeight > h.clientHeight + 2 : false;
    });
    if (overflow) console.warn(`  uyarı (${name}): başlık alanına sığmıyor, metni kısalt`);
    mkdirSync(dirname(out), { recursive: true });
    await page.screenshot({ path: out, type: "png" });
  } finally {
    await ctx.close();
  }
}

// ------------------------------------------------------------------ ana akış

const shots = readShots();
if (!shots.length) { console.error("captions.md'de ekran bulunamadı"); process.exit(1); }
const fixtures = JSON.parse(readFileSync(join(BUILD_DIR, "demo/fixtures.json"), "utf8"));
const draft = fixtures.some((f) => f.draft || !f.commons_url);
if (draft) console.warn("Not: fixtures.json'da commons_url'si boş fotoğraf var → görseller TASLAK etiketiyle üretilir.");

const work = mkdtempSync(join(tmpdir(), "mazi-shots-"));
mkdirSync(join(work, "raw"), { recursive: true });
const fontDir = join(work, "fonts");
mkdirSync(fontDir);
for (const [name, rel] of Object.entries(FONTS)) writeFileSync(join(fontDir, name), readFileSync(join(ROOT, rel)));

const { server, base } = await startServer({
  "/__work/": work, "/__fonts/": fontDir, "/__brand/": join(ROOT, "store/brand"), "/__build/": BUILD_DIR,
});
const browser = await chromium.launch();
const t0 = Date.now();
try {
  for (const platform of PLATFORMS) {
    const dev = DEVICES[platform];
    const outDir = join(OUT, dev.dir);
    mkdirSync(outDir, { recursive: true });
    if (!ONLY) for (const f of readdirSync(outDir)) if (f.endsWith(".png")) rmSync(join(outDir, f));
    for (const shot of shots) {
      const raw = join(work, "raw", `${platform}-${shot.id}.png`);
      await capture(browser, base, dev, shot.route, raw, { platform });
      const out = join(outDir, `${shot.id}-${shot.slug}.png`);
      await renderHtml(browser, base, work, `${platform}-${shot.id}`, composeHtml(platform, shot, `/__work/raw/${platform}-${shot.id}.png`, draft), dev.canvas, out);
      console.log(`✓ ${out.slice(ROOT.length + 1)}`);
    }
  }
  if (!flag("no-extras") && THEME === "light" && (!ONLY || ONLY.includes("extras"))) {
    // Pro ekranı (IAP inceleme): iOS sayfası, üstte durum çubuğu ve arkada kalan ekranın kenarı
    const dev = DEVICES.ios;
    const raw = join(work, "raw", "ios-pro.png");
    await capture(browser, base, dev, "/pro?from=review", raw, { platform: "ios", viewport: { width: 440, height: 956 - 66 }, insets: { top: 0, bottom: 34 } });
    await renderHtml(browser, base, work, "iap", iapHtml("/__work/raw/ios-pro.png", false), dev.canvas, join(OUT, "iap-review.png"));
    console.log("✓ store/screenshots/out/iap-review.png");
    await renderHtml(browser, base, work, "feature", featureHtml(fixtures, draft), { w: 1024, h: 500 }, join(OUT, "feature-graphic.png"));
    console.log("✓ store/screenshots/out/feature-graphic.png");
  }
} finally {
  await browser.close();
  server.close();
  if (flag("keep-work")) console.log(`ara dosyalar: ${work}`);
  else rmSync(work, { recursive: true, force: true });
}
console.log(`bitti (${Math.round((Date.now() - t0) / 1000)} sn)`);
