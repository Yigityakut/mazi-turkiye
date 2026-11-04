#!/usr/bin/env node
/**
 * Demo derlemesi için fotoğrafları ve künyeleri hazırlar: store/screenshots/fixtures.json → app/public/demo/.
 *
 *   node store/screenshots/prepare.mjs                 künyeleri kopyalar, eksik fotoğraf için yer tutucu üretir
 *   node store/screenshots/prepare.mjs --placeholders  yer tutucuları baştan üretir (ImageMagick `convert`)
 *   node store/screenshots/prepare.mjs --download      her commons_url'yi indirir (CI). Bir URL bile boşsa hiçbir şey
 *                                                      indirmez, `ready=false` yazar ve 0 ile çıkar (yer tutuculu
 *                                                      görseller CI'dan asla commit'lenmesin diye).
 *
 * GitHub Actions'ta `ready=true|false` adımın çıktısına ($GITHUB_OUTPUT) yazılır.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const SRC = join(HERE, "fixtures.json");
const OUT = join(ROOT, "app/public/demo");
const UA = "MaziTurkiyeScreenshots/0.1 (+https://github.com/yigityakut/timeguessr)";
const FONT = join(ROOT, "app/node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf");

const args = new Set(process.argv.slice(2));
const mode = args.has("--download") ? "download" : args.has("--placeholders") ? "placeholders" : "sync";

const REQUIRED = ["file", "year", "location_name", "region", "lat", "lng", "author", "source_name", "license_code"];
const REGIONS = ["Marmara", "Ege", "Akdeniz", "İç Anadolu", "Karadeniz", "Doğu Anadolu", "Güneydoğu Anadolu"];

function output(key, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

function validate(list) {
  const errors = [];
  if (!Array.isArray(list) || list.length < 6) errors.push("en az 6 fotoğraf gerekir (5 günlük + 1 düello)");
  const seen = new Set();
  (list ?? []).forEach((f, i) => {
    const at = `#${i + 1} (${f.file ?? "?"})`;
    for (const k of REQUIRED) if (f[k] === undefined || f[k] === null || f[k] === "") errors.push(`${at}: '${k}' boş`);
    if (f.file && !/^[a-z0-9][a-z0-9._-]*\.(jpe?g|png|webp)$/i.test(f.file)) errors.push(`${at}: dosya adı sadece harf, rakam, . _ - içerebilir`);
    if (seen.has(f.file)) errors.push(`${at}: dosya adı tekrar ediyor`);
    seen.add(f.file);
    if (!(f.lat >= 35.8 && f.lat <= 42.2 && f.lng >= 25.6 && f.lng <= 44.9)) errors.push(`${at}: koordinat Türkiye dışında`);
    if (!(f.year >= 1880 && f.year <= 2025)) errors.push(`${at}: yıl 1880–2025 arasında olmalı`);
    if (f.region && !REGIONS.includes(f.region)) errors.push(`${at}: bölge şunlardan biri olmalı: ${REGIONS.join(", ")}`);
    if (f.commons_url && !/^https:\/\/upload\.wikimedia\.org\//.test(f.commons_url)) errors.push(`${at}: commons_url doğrudan upload.wikimedia.org adresi olmalı`);
  });
  if (errors.length) {
    console.error("fixtures.json hatalı:\n  " + errors.join("\n  "));
    process.exit(1);
  }
}

/** Nötr, sepya bir "eski fotoğraf" yer tutucusu. Her dosya farklı tohumla üretilir. */
function placeholder(file, i) {
  const out = join(OUT, file);
  const seed = String(1000 + i * 37);
  const tint = ["#7a5230", "#6f5a3c", "#5f4a36", "#7d5b3a", "#6b4f33", "#80603f"][i % 6];
  execFileSync("convert", [
    "-size", "1600x1067", "-seed", seed, "plasma:fractal", "-blur", "0x22", "-colorspace", "Gray", "-auto-level",
    "+level", "18%,88%",
    "(", "-size", "1600x1067", "gradient:gray(100%)-gray(62%)", ")", "-compose", "multiply", "-composite",
    "(", "-size", "1600x1067", "radial-gradient:gray(100%)-gray(40%)", "-resize", "180%", "-gravity", "center", "-extent", "1600x1067", ")",
    "-compose", "multiply", "-composite", "-colorspace", "sRGB", "-type", "TrueColor",
    "-sepia-tone", "82%", "-modulate", "104,42",
    "(", "+clone", "-fill", tint, "-colorize", "100", ")", "-compose", "blend", "-define", "compose:args=12", "-composite",
    "-attenuate", "0.25", "+noise", "Gaussian",
    // Etiket ortada: oyun fotoğrafı "cover" ile kırptığı için kenarlar görünmeyebilir
    "-gravity", "Center", "-font", FONT, "-pointsize", "34", "-kerning", "4",
    "-fill", "rgba(255,248,238,0.82)", "-annotate", "+0-16", `FOTOĞRAF ${i + 1}`,
    "-pointsize", "21", "-kerning", "3", "-fill", "rgba(255,248,238,0.55)", "-annotate", "+0+28", "YER TUTUCU",
    "-quality", "84", out,
  ]);
  console.log(`yer tutucu: ${file}`);
}

async function download(f) {
  const out = join(OUT, f.file);
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const r = await fetch(f.commons_url, { headers: { "User-Agent": UA }, redirect: "follow" });
      if (r.status === 429 || r.status >= 500) throw new Error(`HTTP ${r.status}`);
      if (!r.ok) { console.error(`${f.file}: HTTP ${r.status} ${f.commons_url}`); process.exit(1); }
      const type = r.headers.get("content-type") ?? "";
      if (!type.startsWith("image/")) { console.error(`${f.file}: görsel değil (${type})`); process.exit(1); }
      const tmp = `${out}.download`;
      writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
      shrink(tmp, out);
      console.log(`indirildi: ${f.file} (${Math.round(statSync(out).size / 1024)} KB)`);
      return;
    } catch (e) {
      if (attempt === 5) { console.error(`${f.file}: indirilemedi: ${e.message}`); process.exit(1); }
      await new Promise((r) => setTimeout(r, attempt * 3000));
    }
  }
}

/** Büyük asılları web derlemesi için 2000 px'e indirir (ImageMagick yoksa macOS `sips`, o da yoksa olduğu gibi bırakır). */
function shrink(tmp, out) {
  try {
    execFileSync("convert", [`${tmp}[0]`, "-auto-orient", "-resize", "2000x2000>", "-strip", "-quality", "88", out]);
    execFileSync("rm", ["-f", tmp]);
    return;
  } catch {}
  try {
    const dims = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", tmp], { encoding: "utf8" });
    const big = Math.max(...[...dims.matchAll(/pixel(?:Width|Height): (\d+)/g)].map((m) => +m[1])) > 2000;
    execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "88", ...(big ? ["-Z", "2000"] : []), tmp, "--out", out], { stdio: "ignore" });
    execFileSync("rm", ["-f", tmp]);
  } catch {
    renameSync(tmp, out);
  }
}

const list = JSON.parse(readFileSync(SRC, "utf8"));
validate(list);
mkdirSync(OUT, { recursive: true });

if (mode === "download") {
  const missing = list.filter((f) => !f.commons_url);
  if (missing.length) {
    console.warn(`commons_url boş: ${missing.map((f) => f.file).join(", ")}. Gerçek fotoğraflar girilene kadar ekran görüntüsü üretilmez.`);
    output("ready", "false");
    process.exit(0);
  }
  for (const f of list) await download(f);
} else {
  list.forEach((f, i) => {
    if (mode === "placeholders" || !existsSync(join(OUT, f.file))) placeholder(f.file, i);
  });
}

// Uygulamanın okuduğu kopya: sadece oyunun kullandığı alanlar
const slim = list.map(({ _todo, ...f }) => ({ ...f, draft: !f.commons_url || undefined }));
writeFileSync(join(OUT, "fixtures.json"), JSON.stringify(slim, null, 2) + "\n");
console.log(`künyeler: app/public/demo/fixtures.json (${list.length} fotoğraf)`);
output("ready", "true");
