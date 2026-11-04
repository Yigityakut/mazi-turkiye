// RevenueCat webhook'u: pro_lifetime satın alındığında profiles.is_pro = true.
// RevenueCat panelinde Authorization başlığı olarak REVENUECAT_WEBHOOK_AUTH değeri girilir.
import { admin, json } from "../_shared/util.ts";

const GRANT = new Set(["INITIAL_PURCHASE", "NON_RENEWING_PURCHASE", "TRANSFER", "UNCANCELLATION", "PRODUCT_CHANGE"]);
const REVOKE = new Set(["CANCELLATION", "REFUND", "EXPIRATION"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const expected = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
  if (!expected || req.headers.get("Authorization") !== expected) return json({ error: "forbidden" }, 403);
  const { event } = await req.json();
  if (!event) return json({ ignored: true });
  const ids: string[] = [event.app_user_id, ...(event.aliases ?? []), ...(event.transferred_to ?? [])]
    .filter((x: unknown) => typeof x === "string" && UUID.test(x as string));
  const isPro = GRANT.has(event.type) ? true : REVOKE.has(event.type) && event.type === "REFUND" ? false : null;
  if (isPro === null || ids.length === 0) return json({ ignored: event.type });
  const sb = admin();
  const { error } = await sb.from("profiles")
    .update({ is_pro: isPro, pro_since: isPro ? new Date().toISOString() : null })
    .in("id", ids);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, ids, isPro });
});
