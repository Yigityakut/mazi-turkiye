import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export function admin(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
}

/**
 * pg_cron / pg_net çağrıları için gizli başlık kontrolü. Değer veritabanında üretilir (private.secrets);
 * INTERNAL_SECRET ortam değişkeni varsa önce ona bakılır, yoksa veritabanından doğrulanır.
 */
export async function isInternal(req: Request): Promise<boolean> {
  const got = req.headers.get("x-internal-secret");
  if (!got) return false;
  const env = Deno.env.get("INTERNAL_SECRET");
  if (env) return got === env;
  const { data } = await admin().rpc("verify_internal_secret", { p: got });
  return data === true;
}

export async function telegram(text: string, link?: string | null) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chat = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
  if (!token || !chat) return { skipped: "telegram_not_configured" };
  const body: Record<string, unknown> = { chat_id: chat, text, disable_web_page_preview: true };
  if (link) body.reply_markup = { inline_keyboard: [[{ text: "Maça gir", url: link }]] };
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: r.ok, status: r.status };
}

export const UA = "MaziTurkiyePhotoPipeline/0.1 (+https://maziturkiye.com; license-aware historic photo game)";
