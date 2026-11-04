/** Türk biçiminde sayı: 5.000 */
export const num = (n: number) => Math.round(n).toLocaleString("tr-TR").replace(/,/g, ".");

export function km(d: number) {
  if (d < 1) return "1 km'den az";
  if (d < 10) return `${d.toFixed(1).replace(".", ",")} km`;
  return `${num(d)} km`;
}

export function yearDiff(dy: number) {
  if (dy === 0) return "Tam isabet";
  return `${dy} yıl fark`;
}

/** "1960'lar" gibi on yıl etiketi (Türkçe ünlü uyumu) */
export function decade(y: number) {
  const d = Math.floor(y / 10) * 10;
  return `${d}'${[0, 20, 50, 70, 80].includes(d % 100) ? "ler" : "lar"}`;
}

export function countdown(ms: number) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

/** Puanı 5 kademeli renk karesine çevirir (paylaşım metni) */
export function square(score: number, max = 500) {
  const r = score / max;
  return r >= 0.9 ? "🟩" : r >= 0.6 ? "🟨" : r >= 0.3 ? "🟧" : "⬜";
}

export const ERRORS: Record<string, string> = {
  pro_required: "Bu özellik Pro'ya dahil.",
  already_played: "Bu fotoğrafı zaten tahmin ettin.",
  day_locked: "Bu gün henüz açılmadı.",
  day_not_found: "Bugünün fotoğrafları hazırlanıyor. Biraz sonra tekrar dene.",
  challenge_not_found: "Bu meydan okuma kodu bulunamadı.",
  duel_limit: "Bugünkü ücretsiz 3 maçını oynadın. Pro ile sınırsız oynayabilirsin.",
  duel_pool_empty: "1v1 fotoğrafları hazırlanıyor. Biraz sonra tekrar dene.",
  round_closed: "Bu turun süresi doldu.",
  finish_day_first: "Önce günün 5 fotoğrafını bitir.",
  bad_nickname: "Takma ad 2–20 karakter olmalı; harf, rakam, boşluk, nokta, tire.",
  network: "İnternet bağlantısı yok gibi görünüyor. Bağlantını kontrol edip tekrar dene.",
};

export function errorText(e: unknown): string {
  const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
  for (const k of Object.keys(ERRORS)) if (msg.includes(k)) return ERRORS[k];
  if (/network|fetch|Failed to fetch|timeout/i.test(msg)) return ERRORS.network;
  return "Bir şeyler ters gitti. Tekrar dener misin?";
}
