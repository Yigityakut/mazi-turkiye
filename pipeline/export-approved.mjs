// Onaylı seçimleri Supabase'e aktarmak için kısa SQL üretir (JSON dizisi + jsonb_array_elements).
// Kullanım: node pipeline/export-approved.mjs pipeline/selection/a.json [b.json…] --batch 40 --out /tmp/dir
import fs from "node:fs";
import path from "node:path";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const { locate } = await import("./harvest.mjs");
const args = process.argv.slice(2);
const batch = +(args[args.indexOf("--batch") + 1] || 40);
const outDir = args.includes("--out") ? args[args.indexOf("--out") + 1] : "/tmp";
const files = args.filter((a, i) => a.endsWith(".json") && args[i - 1] !== "--out");
const byKey = new Map();
for (const f of fs.readdirSync(path.join(ROOT, "pipeline/data")).filter((f) => f.endsWith(".jsonl")))
  for (const l of fs.readFileSync(path.join(ROOT, "pipeline/data", f), "utf8").split("\n").filter(Boolean)) { const r = JSON.parse(l); byKey.set(r.source_key, r); }
const sheet = new Map();
for (const d of fs.readdirSync(path.join(ROOT, "pipeline/review"))) {
  const idx = path.join(ROOT, "pipeline/review", d, "index.json");
  if (fs.existsSync(idx)) for (const e of JSON.parse(fs.readFileSync(idx, "utf8"))) sheet.set(`${e.id}@${d}`, e.source_key);
}
const rows = [];
for (const f of files) for (const it of JSON.parse(fs.readFileSync(f, "utf8")).items) {
  const key = sheet.get(it.key) ?? it.key; const c = byKey.get(key);
  if (!c) throw new Error("yok: " + it.key);
  const lat = it.lat ?? c.lat, lng = it.lng ?? c.lng; const loc = locate(lat, lng);
  if (!loc) throw new Error("TR dışı: " + it.key);
  const strip = (u) => u?.replace(/\?utm_[^#]*$/, "");
  rows.push([key, strip(c.page_url), strip(c.image_url), c.width, c.height, it.year ?? c.year, +lat.toFixed(5), +lng.toFixed(5),
    loc.province, loc.region, c.license_code, c.license_url ? strip(c.license_url) : null, c.author.slice(0, 120),
    it.location_name, it.title_tr ?? null, it.story_tr, it.difficulty, it.pool]);
}
for (let i = 0, n = 1; i < rows.length; i += batch, n++) {
  const j = JSON.stringify(rows.slice(i, i + batch)).replace(/'/g, "''");
  fs.writeFileSync(path.join(outDir, `import-${n}.sql`), `insert into public.photo_candidates (source_key, source_name, page_url, image_url, hash_url, width, height, year, year_source, lat, lng, coord_kind, province, region, license_code, license_url, author, location_name, title_tr, story_tr, difficulty, pool, status, reviewed_at)
select r->>0, 'Wikimedia Commons', r->>1, r->>2, regexp_replace(r->>2, '/\\d+px-([^/]+)$', '/120px-\\1'), (r->>3)::int, (r->>4)::int, (r->>5)::int, 'review',
  (r->>6)::float8, (r->>7)::float8, 'review', r->>8, r->>9, r->>10, r->>11, r->>12, r->>13, r->>14, r->>15, (r->>16)::public.difficulty, (r->>17)::public.photo_pool, 'approved', now()
from jsonb_array_elements('${j}'::jsonb) r
on conflict (source_key) do update set status = 'approved', year = excluded.year, lat = excluded.lat, lng = excluded.lng, province = excluded.province,
  region = excluded.region, location_name = excluded.location_name, title_tr = excluded.title_tr, story_tr = excluded.story_tr,
  difficulty = excluded.difficulty, pool = excluded.pool, reviewed_at = now() where public.photo_candidates.photo_id is null;
`);
}
console.log(rows.length, "satır,", Math.ceil(rows.length / batch), "parça →", outDir);
