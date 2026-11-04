// İnceleme kararlarını (pipeline/selection/*.json) photo_candidates satırlarına çevirir.
// Çıktı: SQL (upsert, status='approved'). Supabase SQL Editor'de veya execute_sql ile çalıştırılır;
// sonra pipeline-ingest edge function'ı görselleri indirip photos tablosuna yazar.
//
// Kullanım: node pipeline/approve.mjs pipeline/selection/launch.json > /tmp/approve.sql
//
// Seçim dosyası: { "items": [ { "key": "<source_key veya pano kimliği 3-12@pool-a>", "pool": "daily|duel|bonus",
//   "difficulty": "kolay|orta|zor", "location_name": "Galata Köprüsü, İstanbul", "title_tr": "...", "story_tr": "...",
//   "lat"?: 41.02, "lng"?: 28.97, "year"?: 1965 } ] }   — lat/lng/year sadece düzeltme veya elle konumlama için.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const geo = JSON.parse(fs.readFileSync(path.join(ROOT, "supabase/functions/_shared/geo.json"), "utf8"));
const { locate } = await import("./harvest.mjs");

const byKey = new Map();
const dataDir = path.join(ROOT, "pipeline/data");
for (const f of fs.readdirSync(dataDir).filter((f) => f.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(dataDir, f), "utf8").split("\n").filter(Boolean)) {
    const r = JSON.parse(line);
    byKey.set(r.source_key, r);
  }
}
// pano kimliği → source_key ("3-12@pool-a" veya "3-12@pool-a-needgeo")
const sheetIndex = new Map();
const reviewDir = path.join(ROOT, "pipeline/review");
if (fs.existsSync(reviewDir)) {
  for (const d of fs.readdirSync(reviewDir)) {
    const idx = path.join(reviewDir, d, "index.json");
    if (fs.existsSync(idx)) for (const e of JSON.parse(fs.readFileSync(idx, "utf8"))) sheetIndex.set(`${e.id}@${d}`, e.source_key);
  }
}

const sel = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const q = (v) => (v == null ? "null" : typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => (a?.length ? `array[${a.map(q).join(",")}]::text[]` : "null");
const rows = [], errors = [];
for (const it of sel.items) {
  const key = sheetIndex.get(it.key) ?? it.key;
  const c = byKey.get(key);
  if (!c) { errors.push(`bulunamadı: ${it.key}`); continue; }
  const lat = it.lat ?? c.lat, lng = it.lng ?? c.lng;
  if (lat == null || lng == null) { errors.push(`konum yok: ${it.key}`); continue; }
  const loc = locate(lat, lng);
  if (!loc) { errors.push(`Türkiye dışında: ${it.key} (${lat},${lng})`); continue; }
  for (const f of ["difficulty", "pool", "location_name", "story_tr"]) if (!it[f]) errors.push(`${f} eksik: ${it.key}`);
  rows.push(`(${[q(key), q(c.source_name), q(c.page_url), q(c.image_url), q(c.image_url.includes("/thumb/") ? c.image_url.replace(/\/\d+px-([^/]+)$/, "/120px-$1") : null),
    q(c.width), q(c.height), q(it.year ?? c.year), q(it.year ? "review" : c.year_source), q(lat), q(lng), q(it.lat ? "manual" : c.coord_kind),
    q(loc.province), q(loc.region), q(c.license_code), q(c.license_url ?? c.page_url), q(c.author), q(c.credit), q(c.title), q(c.description),
    arr(c.categories), q(c.query), "'approved'", q(it.location_name), q(it.title_tr ?? null), q(it.story_tr), `${q(it.difficulty)}::public.difficulty`,
    `${q(it.pool)}::public.photo_pool`, "now()"].join(", ")})`);
}
if (errors.length) { console.error(errors.join("\n")); if (!process.argv.includes("--force")) process.exit(1); }
const compact = process.argv.includes("--compact");
if (compact) {
  // Sadece ingest'in kullandığı alanlar (açıklama ve kategoriler hariç) — SQL'i küçük tutar
  for (let i = 0; i < rows.length; i++) rows[i] = rows[i].replace(/, ('(?:[^']|'')*'|null), (array\[[^\]]*\]::text\[\]|null), ('(?:[^']|'')*'|null), 'approved'/, ", null, null, $3, 'approved'");
}
console.log(`insert into public.photo_candidates (source_key, source_name, page_url, image_url, hash_url, width, height, year, year_source,
  lat, lng, coord_kind, province, region, license_code, license_url, author, credit, title, description, categories, query, status,
  location_name, title_tr, story_tr, difficulty, pool, reviewed_at) values
${rows.join(",\n")}
on conflict (source_key) do update set status = 'approved', year = excluded.year, lat = excluded.lat, lng = excluded.lng,
  province = excluded.province, region = excluded.region, location_name = excluded.location_name, title_tr = excluded.title_tr,
  story_tr = excluded.story_tr, difficulty = excluded.difficulty, pool = excluded.pool, reviewed_at = now();`);
console.error(`${rows.length} aday onaylandı.`);
void geo;
