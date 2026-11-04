// Fotoğraf hattı · aday toplama + otomatik eleme + inceleme panosu (GitHub Actions'ta çalışır).
// Aynı kurallar: supabase/functions/pipeline-harvest (sunucuda haftalık çalışan sürüm).
//
// Kullanım: node pipeline/harvest.mjs pipeline/jobs/<iş>.json
// İş dosyası: { "name": "launch-1", "queries": [{ "q": "deepcat:\"Istanbul in 1965\"", "year": 1965, "pages": 1 }], "sheets": true }
// Çıktı:     pipeline/data/<name>.candidates.jsonl, pipeline/data/<name>.summary.json, pipeline/review/<name>/sheet-NN.jpg
import fs from "node:fs";
import path from "node:path";

const UA = "MaziTurkiyePhotoPipeline/0.1 (+https://github.com/yigityakut/timeguessr; license-aware historic photo game)";
const API = "https://commons.wikimedia.org/w/api.php";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const geo = JSON.parse(fs.readFileSync(path.join(ROOT, "supabase/functions/_shared/geo.json"), "utf8"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (h = "") => h.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim();

function inRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const hav = (a, b, c, d) => {
  const r = Math.PI / 180;
  const x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
};
export function locate(lat, lng) {
  if (!geo.outline.some((r) => inRing(lng, lat, r))) return null;
  let best = geo.provinces[0], bd = Infinity;
  for (const p of geo.provinces) { const d = hav(lat, lng, p.lat, p.lng); if (d < bd) { bd = d; best = p; } }
  return { province: best.name, region: best.region };
}

export function license(meta) {
  const short = strip(meta.LicenseShortName?.value ?? "");
  const lic = (meta.License?.value ?? "").toLowerCase();
  const url = meta.LicenseUrl?.value ?? null;
  const s = `${short} ${lic}`.toLowerCase();
  if (/\bnc\b|non-?commercial|\bnd\b|no-?deriv|fair use|copyrighted|all rights reserved/.test(s)) return null;
  if (/^pd|public domain|cc0|no restrictions|no known copyright/.test(s) || lic.startsWith("pd")) {
    const cc0 = /cc0/.test(s);
    return { code: cc0 ? "CC0 1.0" : "Kamu malı", url: url ?? (cc0 ? "https://creativecommons.org/publicdomain/zero/1.0/" : null) };
  }
  const m = s.match(/cc[- ]by(-sa)?[- ]?(\d\.\d)?/);
  if (m) return { code: `CC BY${m[1] ? "-SA" : ""} ${m[2] ?? "4.0"}`, url: url ?? `https://creativecommons.org/licenses/${m[1] ? "by-sa" : "by"}/${m[2] ?? "4.0"}/` };
  return null;
}

export function exactYear(raw) {
  if (!raw) return null;
  const t = strip(raw).toLowerCase();
  if (/circa|\bca\.?\s|\bc\.\s?\d|approx|yaklaşık|\bor\b|between|before|after|\d{4}s\b|\d{4}\s*[-–]\s*\d{4}|century|yüzyıl|\?|unknown|undated/.test(t)) return null;
  const m = t.match(/\b(18[5-9]\d|19\d\d|20[0-2]\d)\b/);
  const all = t.match(/\b(18[5-9]\d|19\d\d|20[0-2]\d)\b/g) ?? [];
  if (!m || new Set(all).size > 1) return null;
  return +m[1];
}

const BLOCK = /\b(war|battle|corpse|dead|death|funeral|execution|massacre|terror|bomb|coup|riot|protest|soldiers?|army|military|police|savaş|ölü|cenaze|darbe|patlama|asker|polis|portrait|portre|selfie|nude|weapon|tank|earthquake|deprem|fire damage|yangın|accident|kaza|prison|cezaevi|refugee|mülteci|demonstration|miting)\b/i;
const OK_MIME = /jpeg|png|tiff/;

async function commons(params, tries = 4) {
  const u = new URL(API);
  for (const [k, v] of Object.entries({ format: "json", formatversion: "2", maxlag: "5", ...params })) u.searchParams.set(k, String(v));
  for (let i = 0; i < tries; i++) {
    const r = await fetch(u, { headers: { "User-Agent": UA, "Api-User-Agent": UA } });
    if (r.ok) { const j = await r.json(); if (!j.error) return j; if (j.error.code !== "maxlag") throw new Error(j.error.info); }
    await sleep(1500 * (i + 1));
  }
  throw new Error(`commons failed ${u}`);
}

async function harvestQuery(q, seen, keepNoCoords) {
  const rows = [], needGeo = [], reasons = {};
  const rej = (k) => (reasons[k] = (reasons[k] ?? 0) + 1);
  let cont = {};
  for (let page = 0; page < (q.pages ?? 1); page++) {
    const data = await commons({
      action: "query", generator: "search", gsrnamespace: 6, gsrlimit: 50, gsrsearch: `${q.q} filetype:bitmap`,
      prop: "imageinfo|coordinates|categories", iiprop: "url|size|extmetadata|mime", iiurlwidth: 1280,
      iiextmetadatalanguage: "en", coprimary: "all", coprop: "type", colimit: "max", clshow: "!hidden", cllimit: "max", ...cont,
    });
    if (page === 0) console.log("  hits", data.query?.pages?.length ?? 0, data.warnings ? JSON.stringify(data.warnings).slice(0, 300) : "");
    for (const p of data.query?.pages ?? []) {
      const key = `commons:${p.title}`;
      if (seen.has(key)) { rej("dup_key"); continue; }
      seen.add(key);
      const ii = p.imageinfo?.[0];
      if (!ii) { rej("no_info"); continue; }
      if (!OK_MIME.test(ii.mime)) { rej("mime"); continue; }
      if (Math.max(ii.width, ii.height) < 1200) { rej("small"); continue; }
      if (ii.width / ii.height > 2.6 || ii.height / ii.width > 1.8) { rej("aspect"); continue; }
      const meta = ii.extmetadata ?? {};
      const lic = license(meta);
      if (!lic) { rej("license"); continue; }
      const desc = strip(meta.ImageDescription?.value ?? "");
      const cats = (p.categories ?? []).map((c) => c.title.replace(/^Category:/, ""));
      if (BLOCK.test(`${p.title} ${desc} ${cats.join(" ")}`)) { rej("content"); continue; }
      let y = exactYear(meta.DateTimeOriginal?.value), ysrc = "DateTimeOriginal";
      const catYears = [...new Set(cats.map((c) => c.match(/\b(?:in|of) (\d{4})$/)?.[1]).filter(Boolean).map(Number))];
      if (y && q.year && Math.abs(y - q.year) > 1) { rej("year_conflict"); continue; }
      if (!y && q.year) { y = q.year; ysrc = "category"; }
      if (!y && catYears.length === 1) { y = catYears[0]; ysrc = "category"; }
      if (!y) { rej("no_year"); continue; }
      if (catYears.some((cy) => Math.abs(cy - y) > 1)) { rej("year_conflict"); continue; }
      const coords = p.coordinates ?? [];
      const c = coords.find((x) => x.primary) ?? coords[0];
      const base = {
        source_key: key, source_name: "Wikimedia Commons", page_url: ii.descriptionurl, image_url: ii.thumburl ?? ii.url,
        width: ii.width, height: ii.height, year: y, year_source: ysrc,
        license_code: lic.code, license_url: lic.url,
        author: strip(meta.Artist?.value ?? "").slice(0, 300) || "Bilinmiyor", credit: strip(meta.Credit?.value ?? "").slice(0, 300),
        title: p.title.replace(/^File:/, ""), description: desc.slice(0, 1200), categories: cats.slice(0, 25), query: q.q,
      };
      if (!c) {
        rej("no_coords");
        if (keepNoCoords) needGeo.push(base);
        continue;
      }
      const loc = locate(c.lat, c.lon);
      if (!loc) { rej("outside_tr"); continue; }
      rows.push({ ...base, lat: c.lat, lng: c.lon, coord_kind: c.primary ? "camera" : "object", ...loc });
    }
    if (!data.continue) break;
    cont = { gsroffset: data.continue.gsroffset, continue: data.continue.continue };
    await sleep(400);
  }
  return { rows, needGeo, reasons };
}

// Yıl başına en iyi adayları seç: kalite kategorisi, koordinat, çözünürlük, açıklama zenginliği; İstanbul en fazla üçte bir.
const IST = /istanbul|constantinople|galata|beyo[gğ]lu|pera\b|eminön|üsküdar|uskudar|kadık|kadikoy|bosphorus|bo[gğ]az|sultanahmet|hagia sophia|ayasofya|taksim|beşiktaş|besiktas/i;
function pick(items, cap) {
  if (items.length <= cap) return items;
  const score = (x) => {
    const cats = (x.categories ?? []).join(" ");
    return (/Quality images|Featured pictures|Valued images/.test(cats) ? 4 : 0) + (x._noGeo ? 0 : 3) +
      Math.min(Math.max(x.width, x.height) / 2000, 2) + Math.min((x.description ?? "").length / 300, 1.5) + Math.random() * 0.8;
  };
  const sorted = [...items].sort((a, b) => score(b) - score(a));
  const out = []; let ist = 0;
  for (const x of sorted) {
    if (out.length >= cap) break;
    const isIst = x.province === "İstanbul" || IST.test(`${x.title} ${(x.categories ?? []).join(" ")}`);
    if (isIst && ist >= Math.ceil(cap / 3)) continue;
    if (isIst) ist++;
    out.push(x);
  }
  return out;
}

async function contactSheets(name, items) {
  const sharp = (await import("sharp")).default;
  const dir = path.join(ROOT, "pipeline/review", name);
  fs.mkdirSync(dir, { recursive: true });
  const TW = 320, TH = 240, COLS = 5, ROWS = 4, PER = COLS * ROWS, LABEL = 22;
  const index = [];
  for (let s = 0; s * PER < items.length; s++) {
    const chunk = items.slice(s * PER, (s + 1) * PER);
    const tiles = [];
    for (let i = 0; i < chunk.length; i++) {
      const it = chunk[i];
      const id = `${s + 1}-${i + 1}`;
      index.push({ id, source_key: it.source_key });
      try {
        const thumb = it.image_url.includes("/thumb/") ? it.image_url.replace(/\/\d+px-([^/]+)$/, "/330px-$1") : it.image_url;
        const r = await fetch(thumb, { headers: { "User-Agent": UA } });
        const buf = Buffer.from(await r.arrayBuffer());
        const img = await sharp(buf).resize(TW, TH, { fit: "cover" }).jpeg({ quality: 70 }).toBuffer();
        tiles.push({ input: img, left: (i % COLS) * TW, top: Math.floor(i / COLS) * (TH + LABEL) });
      } catch { /* boş kare */ }
      const label = `<svg width="${TW}" height="${LABEL}"><rect width="100%" height="100%" fill="#111"/><text x="6" y="16" font-family="sans-serif" font-size="14" fill="#fff">${id} · ${it.year} · ${(it.province ?? "?").replace(/[<&]/g, "")}</text></svg>`;
      tiles.push({ input: Buffer.from(label), left: (i % COLS) * TW, top: Math.floor(i / COLS) * (TH + LABEL) + TH });
      await sleep(120);
    }
    await sharp({ create: { width: COLS * TW, height: ROWS * (TH + LABEL), channels: 3, background: "#222" } })
      .composite(tiles).jpeg({ quality: 72 }).toFile(path.join(dir, `sheet-${String(s + 1).padStart(2, "0")}.jpg`));
  }
  fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify(index, null, 1));
}

async function main() {
  const jobPath = process.argv[2];
  const job = JSON.parse(fs.readFileSync(jobPath, "utf8"));
  const outDir = path.join(ROOT, "pipeline/data");
  fs.mkdirSync(outDir, { recursive: true });
  const seen = new Set();
  for (const f of fs.readdirSync(outDir).filter((f) => f.endsWith(".candidates.jsonl"))) {
    for (const line of fs.readFileSync(path.join(outDir, f), "utf8").split("\n").filter(Boolean)) seen.add(JSON.parse(line).source_key);
  }
  const all = [], needGeo = [], summary = [];
  for (const q of job.queries) {
    try {
      const r = await harvestQuery(q, seen, job.keepNoCoords);
      const cap = q.cap ?? job.cap ?? Infinity;
      const picked = pick([...r.rows, ...r.needGeo.map((x) => ({ ...x, _noGeo: true }))], cap);
      all.push(...picked.filter((x) => !x._noGeo));
      needGeo.push(...picked.filter((x) => x._noGeo).map(({ _noGeo, ...x }) => x));
      summary.push({ q: q.q, kept: r.rows.length, needGeo: r.needGeo.length, rejected: r.reasons });
      console.log(q.q, "kept", r.rows.length, "needGeo", r.needGeo.length, JSON.stringify(r.reasons));
    } catch (e) {
      summary.push({ q: q.q, error: String(e) });
    }
    await sleep(500);
  }
  fs.writeFileSync(path.join(outDir, `${job.name}.candidates.jsonl`), all.map((r) => JSON.stringify(r)).join("\n") + "\n");
  if (needGeo.length) fs.writeFileSync(path.join(outDir, `${job.name}.needgeo.jsonl`), needGeo.map((r) => JSON.stringify(r)).join("\n") + "\n");
  fs.writeFileSync(path.join(outDir, `${job.name}.summary.json`), JSON.stringify({ total: all.length, needGeo: needGeo.length, summary }, null, 1));
  if (job.sheets !== false && all.length) await contactSheets(job.name, all);
  if (job.sheets !== false && needGeo.length && job.sheetsNeedGeo) await contactSheets(`${job.name}-needgeo`, needGeo);
  console.log("done", all.length, "candidates,", needGeo.length, "need geocoding");
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
