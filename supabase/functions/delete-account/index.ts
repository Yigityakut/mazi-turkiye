// Uygulama içi hesap silme (Apple 5.1.1(v), Google hesap silme kuralı).
// İstemci kendi oturum token'ıyla çağırır; kullanıcı ve ona bağlı tüm satırlar (cascade) silinir.
// Apple ile giriş yapmış kullanıcıda istemci, silmeden hemen önce Apple'dan taze bir `authorization_code` alıp gönderir;
// burada refresh token'a çevrilip Apple'ın /auth/revoke uç noktasıyla iptal edilir (Apple'ın token iptali şartı).
// Gerekli gizli değerler: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (p8 içeriği), APPLE_CLIENT_ID (bundle ID).
import { admin, json } from "../_shared/util.ts";

const b64url = (b: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(b instanceof Uint8Array ? b : new Uint8Array(b))))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function appleClientSecret(): Promise<{ secret: string; clientId: string } | null> {
  const team = Deno.env.get("APPLE_TEAM_ID"), kid = Deno.env.get("APPLE_KEY_ID");
  const pem = Deno.env.get("APPLE_PRIVATE_KEY"), clientId = Deno.env.get("APPLE_CLIENT_ID") ?? "com.maziturkiye.app";
  if (!team || !kid || !pem) return null;
  const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const enc = new TextEncoder();
  const head = b64url(enc.encode(JSON.stringify({ alg: "ES256", kid })));
  const body = b64url(enc.encode(JSON.stringify({ iss: team, iat: now, exp: now + 300, aud: "https://appleid.apple.com", sub: clientId })));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(`${head}.${body}`));
  return { secret: `${head}.${body}.${b64url(sig)}`, clientId };
}

async function revokeApple(code: string) {
  const cs = await appleClientSecret();
  if (!cs) return "apple_not_configured";
  const form = (o: Record<string, string>) => new URLSearchParams(o).toString();
  const hdr = { "Content-Type": "application/x-www-form-urlencoded" };
  const t = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST", headers: hdr,
    body: form({ client_id: cs.clientId, client_secret: cs.secret, code, grant_type: "authorization_code" }),
  });
  const tok = await t.json().catch(() => ({}));
  const token = tok.refresh_token ?? tok.access_token;
  if (!token) return `apple_token_failed_${t.status}`;
  const r = await fetch("https://appleid.apple.com/auth/revoke", {
    method: "POST", headers: hdr,
    body: form({ client_id: cs.clientId, client_secret: cs.secret, token, token_type_hint: tok.refresh_token ? "refresh_token" : "access_token" }),
  });
  return r.ok ? "revoked" : `apple_revoke_failed_${r.status}`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const sb = admin();
  const { data, error } = await sb.auth.getUser(jwt);
  if (error || !data.user) return json({ error: "auth_required" }, 401);
  const body = await req.json().catch(() => ({}));
  let apple: string | null = null;
  if (typeof body.apple_authorization_code === "string" && body.apple_authorization_code) {
    apple = await revokeApple(body.apple_authorization_code).catch((e) => `apple_error_${String(e).slice(0, 60)}`);
  }
  const del = await sb.auth.admin.deleteUser(data.user.id);
  if (del.error) return json({ error: del.error.message }, 500);
  return json({ deleted: true, apple });
});
