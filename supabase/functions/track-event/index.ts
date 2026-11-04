// Sunucu tarafı analitik olayları (QA D11). Sadece veritabanı (pg_net, private.track_events) gizli başlıkla çağırır.
// `duel_matched` olayı rakip türüyle (player/admin/bot) buradan gider; bot/admin bilgisi istemciye hiç açılmaz.
// Gerekli değer: POSTHOG_KEY (proje API anahtarı, phc_…; istemcideki EXPO_PUBLIC_POSTHOG_KEY ile aynı).
// İsteğe bağlı: POSTHOG_HOST (varsayılan AB: https://eu.i.posthog.com). Değer yoksa olay sessizce atlanır.
import { isInternal, json } from "../_shared/util.ts";

/** Kabul edilen olaylar; iç gizli değer sızsa bile rastgele olay yazılamasın. */
const ALLOWED = new Set(["duel_matched"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Ev = { distinct_id?: unknown; event?: unknown; properties?: unknown };

Deno.serve(async (req) => {
  if (!(await isInternal(req))) return json({ error: "forbidden" }, 403);
  const key = Deno.env.get("POSTHOG_KEY");
  if (!key) return json({ skipped: "posthog_not_configured" });
  const host = (Deno.env.get("POSTHOG_HOST") ?? "https://eu.i.posthog.com").replace(/\/+$/, "");
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const batch = (Array.isArray(body.events) ? body.events as Ev[] : [])
    .filter((e) => typeof e.event === "string" && ALLOWED.has(e.event) && typeof e.distinct_id === "string" && UUID.test(e.distinct_id))
    .slice(0, 10)
    .map((e) => ({
      event: e.event,
      distinct_id: e.distinct_id,
      timestamp: now,
      properties: { ...(e.properties && typeof e.properties === "object" ? e.properties : {}), $lib: "mazi-server" },
    }));
  if (!batch.length) return json({ ignored: true });
  const r = await fetch(`${host}/batch/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: key, batch }),
  });
  return json({ ok: r.ok, status: r.status, sent: batch.length });
});
