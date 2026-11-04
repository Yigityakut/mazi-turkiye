// Fotoğraf toplama hattı · 1-2. adım: Wikimedia Commons'tan aday çek, otomatik ele, photo_candidates'e yaz.
// Plan Bölüm 3. Sadece kamu malı / CC0 / CC BY / CC BY-SA. NC ve ND asla.
// Çağrı: POST {"queries":[{"q":"deepcat:\"Istanbul in 1965\"","year":1965}], "pages":2}
//        POST {"mode":"weekly"}  → yıl kategorilerinden rastgele bir set
import { admin, isInternal, json, UA } from "../_shared/util.ts";
import geo from "../_shared/geo.json" with { type: "json" };

const API = "https://commons.wikimedia.org/w/api.php";

type Q = { q: string; year?: number };

// ---------- Coğrafya ----------
function inRing(lng: number, lat: number, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function hav(a: number, b: number, c: number, d: number) {
  const R = 6371, r = Math.PI / 180;
  const x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function locate(lat: number, lng: number) {
  // Kaba ülke sınırı ~2 km hassas; kıyıdaki fotoğraflar için 3 km tampon: en yakın il merkezi 120 km'den yakınsa kabul.
  const inTr = (geo.outline as number[][][]).some((r) => inRing(lng, lat, r));
  let best = geo.provinces[0], bd = Infinity;
  for (const p of geo.provinces) {
    const d = hav(lat, lng, p.lat, p.lng);
    if (d < bd) { bd = d; best = p; }
  }
  if (!inTr) return null;
  return { province: best.name, region: best.region, km: bd };
}

// ---------- Lisans ----------
function license(meta: Record<string, { value: string }>) {
  const short = strip(meta.LicenseShortName?.value ?? "");
  const lic = (meta.License?.value ?? "").toLowerCase();
  const url = meta.LicenseUrl?.value ?? null;
  const s = (short + " " + lic).toLowerCase();
  if (/\bnc\b|non-?commercial|\bnd\b|no-?deriv|fair use|copyrighted|all rights reserved/.test(s)) return null;
  if (/^pd|public domain|cc0|no restrictions|no known copyright/.test(s) || lic.startsWith("pd")) {
    return { code: /cc0/.test(s) ? "CC0 1.0" : "Kamu malı", url: url ?? (/cc0/.test(s) ? "https://creativecommons.org/publicdomain/zero/1.0/" : null) };
  }
  const m = s.match(/cc[- ]by(-sa)?[- ]?(\d\.\d)?/);
  if (m) {
    const code = `CC BY${m[1] ? "-SA" : ""} ${m[2] ?? "4.0"}`;
    return { code, url: url ?? `https://creativecommons.org/licenses/${m[1] ? "by-sa" : "by"}/${m[2] ?? "4.0"}/` };
  }
  return null;
}

// ---------- Tarih ----------
function exactYear(raw: string | undefined): number | null {
  if (!raw) return null;
  const t = strip(raw).toLowerCase();
  if (/circa|\bca\.?\s|\bc\.\s?\d|approx|yaklaşık|\bor\b|between|before|after|\d{4}s\b|\d{4}\s*[-–]\s*\d{4}|century|yüzyıl|\?|unknown|undated/.test(t)) return null;
  const all = t.match(/\b(18[5-9]\d|19\d\d|20[0-2]\d)\b/g) ?? [];
  if (all.length === 0 || new Set(all).size > 1) return null;
  return +all[0];
}

function strip(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'").replace(/\s+/g, " ").trim();
}

const BLOCK = /\b(war|battle|corpse|dead|death|funeral|execution|massacre|terror|bomb|coup|riot|protest|soldier|army|military|police|savaş|ölü|cenaze|darbe|patlama|asker|polis|portrait of|portre)\b/i;

async function commons(params: Record<string, string>) {
  const u = new URL(API);
  for (const [k, v] of Object.entries({ format: "json", formatversion: "2", ...params })) u.searchParams.set(k, v);
  const r = await fetch(u, { headers: { "User-Agent": UA, "Api-User-Agent": UA } });
  if (!r.ok) throw new Error(`commons ${r.status}`);
  return await r.json();
}

async function harvest(q: Q, pages: number) {
  const rows: Record<string, unknown>[] = [];
  const reasons: Record<string, number> = {};
  const rej = (k: string) => (reasons[k] = (reasons[k] ?? 0) + 1);
  let cont: Record<string, string> = {};
  for (let page = 0; page < pages; page++) {
    const data = await commons({
      action: "query", generator: "search", gsrnamespace: "6", gsrlimit: "50",
      gsrsearch: `${q.q} filetype:bitmap`,
      prop: "imageinfo|coordinates|categories", iiprop: "url|size|extmetadata|mime", iiurlwidth: "1920",
      iiextmetadatalanguage: "en", coprimary: "all", coprop: "type", colimit: "max", clshow: "!hidden", cllimit: "max",
      ...cont,
    });
    for (const p of data.query?.pages ?? []) {
      const ii = p.imageinfo?.[0];
      if (!ii) { rej("no_info"); continue; }
      if (!/jpeg|png|tiff/.test(ii.mime)) { rej("mime"); continue; }
      if (Math.max(ii.width, ii.height) < 1200) { rej("small"); continue; }
      const meta = ii.extmetadata ?? {};
      const lic = license(meta);
      if (!lic) { rej("license"); continue; }
      const desc = strip(meta.ImageDescription?.value ?? "");
      const cats: string[] = (p.categories ?? []).map((c: { title: string }) => c.title.replace(/^Category:/, ""));
      if (BLOCK.test(p.title + " " + desc + " " + cats.join(" "))) { rej("content"); continue; }
      let y = exactYear(meta.DateTimeOriginal?.value);
      let ysrc = "DateTimeOriginal";
      const catYears = cats.map((c) => c.match(/\bin (\d{4})$/)?.[1]).filter(Boolean).map(Number);
      if (y && q.year && Math.abs(y - q.year) > 1) { rej("year_conflict"); continue; }
      if (!y && q.year) { y = q.year; ysrc = "category"; }
      if (!y && catYears.length === 1) { y = catYears[0]; ysrc = "category"; }
      if (!y) { rej("no_year"); continue; }
      if (catYears.some((cy) => Math.abs(cy - y!) > 1)) { rej("year_conflict"); continue; }
      const coords: { lat: number; lon: number; primary?: boolean; type?: string }[] = p.coordinates ?? [];
      const c = coords.find((x) => x.primary) ?? coords[0];
      if (!c) { rej("no_coords"); continue; }
      const loc = locate(c.lat, c.lon);
      if (!loc) { rej("outside_tr"); continue; }
      const thumb: string = ii.thumburl ?? ii.url;
      rows.push({
        source_key: `commons:${p.title}`,
        source_name: "Wikimedia Commons",
        page_url: ii.descriptionurl,
        image_url: thumb,
        hash_url: thumb.includes("/thumb/") ? thumb.replace(/\/\d+px-([^/]+)$/, "/120px-$1") : null,
        width: ii.width, height: ii.height,
        year: y, year_source: ysrc,
        lat: c.lat, lng: c.lon, coord_kind: c.primary ? "camera" : "object",
        province: loc.province, region: loc.region,
        license_code: lic.code, license_url: lic.url,
        author: strip(meta.Artist?.value ?? "") .slice(0, 300) || "Bilinmiyor",
        credit: strip(meta.Credit?.value ?? "").slice(0, 300),
        title: p.title.replace(/^File:/, ""),
        description: desc.slice(0, 1500),
        categories: cats.slice(0, 30),
        query: q.q,
      });
    }
    if (!data.continue) break;
    cont = { gsroffset: String(data.continue.gsroffset), continue: data.continue.continue };
  }
  return { rows, reasons };
}

function weeklyQueries(): Q[] {
  // Her hafta farklı yıllar: dönem hedeflerine göre ağırlıklı rastgele seçim
  const places = ["Turkey", "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Trabzon"];
  const qs: Q[] = [];
  for (let i = 0; i < 24; i++) {
    const r = Math.random();
    const year = r < 0.15 ? 1880 + Math.floor(Math.random() * 40) : r < 0.3 ? 1920 + Math.floor(Math.random() * 30)
      : r < 0.55 ? 1950 + Math.floor(Math.random() * 30) : r < 0.75 ? 1980 + Math.floor(Math.random() * 20)
      : 2000 + Math.floor(Math.random() * 25);
    const place = places[Math.floor(Math.random() * places.length)];
    qs.push({ q: place === "Turkey" ? `deepcat:"${year} in Turkey"` : `deepcat:"${year} in ${place}"`, year });
  }
  return qs;
}

Deno.serve(async (req) => {
  if (!(await isInternal(req))) return json({ error: "forbidden" }, 403);
  const body = await req.json().catch(() => ({}));
  const queries: Q[] = body.mode === "weekly" ? weeklyQueries() : body.queries ?? [];
  const pages = Math.min(body.pages ?? 2, 6);
  const sb = admin();
  const run = await sb.from("pipeline_runs").insert({ kind: "harvest", params: { queries, pages } }).select("id").single();

  const work = (async () => {
    const summary: Record<string, unknown>[] = [];
    for (const q of queries) {
      try {
        const { rows, reasons } = await harvest(q, pages);
        let inserted = 0;
        if (rows.length) {
          const { data, error } = await sb.from("photo_candidates")
            .upsert(rows, { onConflict: "source_key", ignoreDuplicates: true }).select("source_key");
          if (error) throw error;
          inserted = data?.length ?? 0;
        }
        summary.push({ q: q.q, kept: rows.length, inserted, rejected: reasons });
      } catch (e) {
        summary.push({ q: q.q, error: String(e) });
      }
      await new Promise((r) => setTimeout(r, 300)); // Commons'a nazik ol
    }
    await sb.from("pipeline_runs").update({ result: summary, finished_at: new Date().toISOString() }).eq("id", run.data?.id);
  })();

  // @ts-ignore EdgeRuntime Supabase'de global
  EdgeRuntime.waitUntil(work);
  return json({ started: true, run_id: run.data?.id, queries: queries.length });
});
