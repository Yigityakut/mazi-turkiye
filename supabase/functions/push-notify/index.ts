// Sunucu bildirimleri (Expo Push). Şimdilik: 23:00'te "seri tehlikede".
// Meydan okuma ve "arkadaşın skorunu geçti" bildirimleri istemciden tetiklenmez; ileride DB tetikleyicisine bağlanır.
import { admin, isInternal, json } from "../_shared/util.ts";

async function sendExpo(messages: unknown[]) {
  const out = [];
  for (let i = 0; i < messages.length; i += 100) {
    const r = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages.slice(i, i + 100)),
    });
    out.push(r.status);
  }
  return out;
}

Deno.serve(async (req) => {
  if (!isInternal(req)) return json({ error: "forbidden" }, 403);
  const { kind } = await req.json();
  const sb = admin();
  if (kind === "streak_danger") {
    const { data, error } = await sb.rpc("streak_danger_targets");
    if (error) return json({ error: error.message }, 500);
    const msgs = (data ?? []).map((u: { push_token: string; streak: number }) => ({
      to: u.push_token,
      title: `${u.streak} günlük serin tehlikede`,
      body: "Günün 5 fotoğrafı 04:00'te yenileniyor. Seriyi korumak için birkaç dakikan var.",
      data: { url: "maziturkiye://" },
      sound: "default",
    }));
    return json({ sent: msgs.length, status: await sendExpo(msgs) });
  }
  return json({ error: "unknown_kind" }, 400);
});
