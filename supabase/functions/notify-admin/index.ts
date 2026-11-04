// Admin'e Telegram bildirimi. Sadece veritabanı (pg_net) gizli başlıkla çağırır.
import { isInternal, json, telegram } from "../_shared/util.ts";

Deno.serve(async (req) => {
  if (!(await isInternal(req))) return json({ error: "forbidden" }, 403);
  const { text, link } = await req.json();
  return json(await telegram(String(text).slice(0, 3500), link));
});
