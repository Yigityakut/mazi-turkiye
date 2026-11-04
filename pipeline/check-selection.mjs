// Seçim dosyalarını birlikte denetler: aynı kaynağın birden fazla seçilmesi ve dağılım (dönem, bölge, havuz, zorluk).
// Kullanım: node pipeline/check-selection.mjs pipeline/selection/*.json
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const { locate } = await import("./harvest.mjs");
const byKey = new Map();
for (const f of fs.readdirSync(path.join(ROOT, "pipeline/data")).filter((f) => f.endsWith(".jsonl")))
  for (const l of fs.readFileSync(path.join(ROOT, "pipeline/data", f), "utf8").split("\n").filter(Boolean)) { const r = JSON.parse(l); byKey.set(r.source_key, r); }
const sheet = new Map();
for (const d of fs.readdirSync(path.join(ROOT, "pipeline/review"))) {
  const idx = path.join(ROOT, "pipeline/review", d, "index.json");
  if (fs.existsSync(idx)) for (const e of JSON.parse(fs.readFileSync(idx, "utf8"))) sheet.set(`${e.id}@${d}`, e.source_key);
}
const era = (y) => (y < 1920 ? "1880–1919" : y < 1950 ? "1920–1949" : y < 1980 ? "1950–1979" : y < 2000 ? "1980–1999" : "2000+");
const seen = new Map(), count = { era: {}, region: {}, pool: {}, difficulty: {}, istanbul: 0, total: 0 };
const inc = (o, k) => (o[k] = (o[k] ?? 0) + 1);
let dup = 0;
for (const f of process.argv.slice(2)) {
  for (const it of JSON.parse(fs.readFileSync(f, "utf8")).items) {
    const key = sheet.get(it.key) ?? it.key, c = byKey.get(key);
    if (!c) { console.log(`bulunamadı: ${it.key} (${f})`); continue; }
    if (seen.has(key)) { console.log(`TEKRAR: ${it.key} (${path.basename(f)}) = ${seen.get(key)}`); dup++; continue; }
    seen.set(key, `${it.key} (${path.basename(f)})`);
    const loc = locate(it.lat ?? c.lat, it.lng ?? c.lng);
    inc(count.era, era(it.year ?? c.year)); inc(count.region, loc?.region ?? "?"); inc(count.pool, it.pool); inc(count.difficulty, it.difficulty);
    if (loc?.province === "İstanbul") count.istanbul++;
    count.total++;
  }
}
console.log(JSON.stringify(count, null, 1));
if (dup) process.exitCode = 1;
