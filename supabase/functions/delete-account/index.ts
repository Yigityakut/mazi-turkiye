// Uygulama içi hesap silme (Apple 5.1.1(v), Google hesap silme kuralı).
// İstemci kendi oturum token'ıyla çağırır; kullanıcı ve ona bağlı tüm satırlar (cascade) silinir.
import { admin, json } from "../_shared/util.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const sb = admin();
  const { data, error } = await sb.auth.getUser(jwt);
  if (error || !data.user) return json({ error: "auth_required" }, 401);
  const del = await sb.auth.admin.deleteUser(data.user.id);
  if (del.error) return json({ error: del.error.message }, 500);
  return json({ deleted: true });
});
