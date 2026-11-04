// Haftalık KPI raporu → Telegram (Plan Bölüm 10). Ürün analitiği PostHog'da; burada sunucu tarafı sayılar.
import { admin, isInternal, json, telegram } from "../_shared/util.ts";

Deno.serve(async (req) => {
  if (!isInternal(req)) return json({ error: "forbidden" }, 403);
  const { data, error } = await admin().rpc("weekly_kpis");
  if (error) return json({ error: error.message }, 500);
  const k = data as Record<string, number>;
  const pct = (a: number, b: number) => (b ? `%${Math.round((a / b) * 100)}` : "–");
  const text = [
    "📊 Haftalık rapor",
    `Aktif oyuncu (7g): ${k.active_7d} (önceki hafta ${k.active_prev})`,
    `Günü bitiren oyuncu-gün: ${k.completions_7d}`,
    `Meydan okuma: ${k.challenges_7d} oluşturuldu, ${k.challenge_plays_7d} oynandı`,
    `1v1: ${k.duels_7d} maç, bot oranı ${pct(k.bot_duels_7d, k.duels_7d)}`,
    `Pro: ${k.pro_total} toplam, bu hafta +${k.pro_7d}`,
    `Program: ${k.days_ahead} gün ileri, ${k.photos_left} onaylı fotoğraf bekliyor`,
  ].join("\n");
  return json(await telegram(text));
});
