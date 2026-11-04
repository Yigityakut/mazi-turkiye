// Pro yetkisini RevenueCat'ten doğrudan doğrular (QA Y1). İstemci satın alma / geri yükleme başarılı olunca
// kendi oturum token'ıyla çağırır; webhook gecikse de sunucudaki kapılar (ipucu, arşiv, sınırsız 1v1) hemen açılır.
// RevenueCat REST API v1: GET /v1/subscribers/{app_user_id} → subscriber.entitlements.pro aktifse is_pro = true.
// Sadece yetki VERİR; iade/geri alma revenuecat-webhook'ta (REFUND) kalır, böylece elle verilen Pro silinmez.
// Gerekli gizli değer: REVENUECAT_SECRET_KEY (RevenueCat → Project settings → API keys → Secret API key, v1).
import { admin, json } from "../_shared/util.ts";

const ENTITLEMENT = "pro";

type Ent = { expires_date?: string | null; grace_period_expires_date?: string | null };

function isActive(e: Ent | undefined, now = Date.now()) {
  if (!e) return false;
  // Tüketilmeyen ürün (pro_lifetime): expires_date null → süresiz
  if (!e.expires_date) return true;
  if (Date.parse(e.expires_date) > now) return true;
  return !!e.grace_period_expires_date && Date.parse(e.grace_period_expires_date) > now;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const sb = admin();
  const { data, error } = await sb.auth.getUser(jwt);
  if (error || !data.user) return json({ error: "auth_required" }, 401);
  const uid = data.user.id;

  const { data: prof } = await sb.from("profiles").select("is_pro").eq("id", uid).maybeSingle();
  if (prof?.is_pro) return json({ is_pro: true, changed: false });

  const key = Deno.env.get("REVENUECAT_SECRET_KEY");
  if (!key) return json({ is_pro: false, skipped: "revenuecat_not_configured" });

  const r = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  if (!r.ok) return json({ error: `revenuecat_${r.status}` }, 502);
  const body = await r.json().catch(() => ({}));
  const active = isActive(body?.subscriber?.entitlements?.[ENTITLEMENT]);
  if (!active) return json({ is_pro: false, changed: false });

  const { error: upErr } = await sb.from("profiles")
    .update({ is_pro: true, pro_since: new Date().toISOString() })
    .eq("id", uid).eq("is_pro", false);
  if (upErr) return json({ error: upErr.message }, 500);
  return json({ is_pro: true, changed: true });
});
