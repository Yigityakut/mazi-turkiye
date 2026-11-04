// İnceleme yardımcısı: pano kimliklerinin meta verisini kısa yazdırır. node pipeline/show.mjs pool-c 1-2 1-12 ...
import fs from "node:fs";
const [, , set, ...ids] = process.argv;
const idx = JSON.parse(fs.readFileSync(`pipeline/review/${set}/index.json`, "utf8"));
const rows = new Map();
for (const f of fs.readdirSync("pipeline/data").filter((f) => f.endsWith(".jsonl")))
  for (const l of fs.readFileSync(`pipeline/data/${f}`, "utf8").split("\n").filter(Boolean)) { const r = JSON.parse(l); rows.set(r.source_key, r); }
for (const id of ids) {
  const k = idx.find((e) => e.id === id)?.source_key; const r = rows.get(k);
  if (!r) { console.log(id, "?"); continue; }
  console.log(`[${id}] ${r.year} ${r.province ?? "-"} ${r.lat ? r.lat.toFixed(4) + "," + r.lng.toFixed(4) : "NOGEO"} | ${r.license_code} | ${r.author.slice(0, 40)}\n  T: ${r.title.slice(0, 110)}\n  D: ${r.description.slice(0, 260)}\n  C: ${r.categories.slice(0, 6).join("; ").slice(0, 200)}`);
}
