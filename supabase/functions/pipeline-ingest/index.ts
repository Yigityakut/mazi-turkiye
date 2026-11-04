// Fotoğraf toplama hattı · 4. ve 7. adım: onaylanmış adayları indir, algısal hash ile tekrarı ele,
// Storage'a uuid adıyla yükle ve photos tablosuna yaz.
// Çağrı: POST {"limit":40}
import { decode } from "https://deno.land/x/imagescript@1.3.0/mod.ts";
import { admin, isInternal, json, UA } from "../_shared/util.ts";

async function dhash(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) return null;
    const img = await decode(new Uint8Array(await r.arrayBuffer()));
    // deno-lint-ignore no-explicit-any
    const small = (img as any).resize(9, 8);
    let bits = "";
    for (let y = 1; y <= 8; y++) {
      for (let x = 1; x <= 8; x++) {
        const a = small.getRGBAAt(x, y), b = small.getRGBAAt(x + 1, y);
        bits += lum(a) > lum(b) ? "1" : "0";
      }
    }
    return BigInt("0b" + bits).toString(16).padStart(16, "0");
  } catch {
    return null;
  }
}
const lum = (rgba: [number, number, number, number]) => 0.299 * rgba[0] + 0.587 * rgba[1] + 0.114 * rgba[2];
const hamming = (a: string, b: string) => {
  let x = BigInt("0x" + a) ^ BigInt("0x" + b), n = 0;
  while (x) { n += Number(x & 1n); x >>= 1n; }
  return n;
};

Deno.serve(async (req) => {
  if (!(await isInternal(req))) return json({ error: "forbidden" }, 403);
  const { limit = 40 } = await req.json().catch(() => ({}));
  const sb = admin();
  const { data: cands, error } = await sb.from("photo_candidates").select("*")
    .eq("status", "approved").is("photo_id", null).limit(Math.min(limit, 60));
  if (error) return json({ error: error.message }, 500);
  const { data: existing } = await sb.from("photos").select("phash").not("phash", "is", null);
  const hashes: string[] = (existing ?? []).map((x: { phash: string }) => x.phash);

  const work = (async () => {
    const out: Record<string, unknown>[] = [];
    for (const c of cands ?? []) {
      try {
        const h = c.hash_url ? await dhash(c.hash_url) : null;
        if (h && hashes.some((o) => hamming(o, h) <= 6)) {
          await sb.from("photo_candidates").update({ status: "rejected", reject_reason: "duplicate" }).eq("source_key", c.source_key);
          out.push({ key: c.source_key, dup: true });
          continue;
        }
        const r = await fetch(c.image_url, { headers: { "User-Agent": UA } });
        if (!r.ok) throw new Error(`download ${r.status}`);
        const bytes = new Uint8Array(await r.arrayBuffer());
        const id = crypto.randomUUID();
        const path = `${id}.jpg`;
        const up = await sb.storage.from("photos").upload(path, bytes, { contentType: "image/jpeg", upsert: false });
        if (up.error) throw up.error;
        const scale = Math.min(1, 1920 / Math.max(c.width, c.height));
        const { error: insErr } = await sb.from("photos").insert({
          id, image_path: path,
          width: Math.round(c.width * scale), height: Math.round(c.height * scale),
          year: c.year, year_uncertainty: 0, lat: c.lat, lng: c.lng,
          location_name: c.location_name, province: c.province, region: c.region,
          difficulty: c.difficulty ?? "orta", story_tr: c.story_tr, title_tr: c.title_tr,
          source_name: c.source_name, source_url: c.page_url, author: c.author,
          license_code: c.license_code, license_url: c.license_url,
          pool: c.pool ?? "daily", status: "onayli", phash: h,
        });
        if (insErr) throw insErr;
        if (h) hashes.push(h);
        await sb.from("photo_candidates").update({ status: "ingested", photo_id: id }).eq("source_key", c.source_key);
        out.push({ key: c.source_key, id });
      } catch (e) {
        out.push({ key: c.source_key, error: String(e) });
      }
    }
    await sb.from("pipeline_runs").insert({ kind: "ingest", params: { limit }, result: out, finished_at: new Date().toISOString() });
    // Yeni onaylılarla program boşluklarını doldur
    await sb.rpc("schedule_days", { p_horizon: 14 });
  })();
  // @ts-ignore EdgeRuntime Supabase'de global
  EdgeRuntime.waitUntil(work);
  return json({ started: true, candidates: cands?.length ?? 0 });
});
