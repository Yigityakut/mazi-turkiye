/**
 * Takma ad denetimi (App Store 1.2 / Play UGC, QA O7). Takma adlar sıralamada ve meydan okumalarda herkese görünür.
 *
 * Bu, İSTEMCİ tarafı ilk süzgeçtir: kaba kelime ve hakaretleri kaydetmeden önce yakalar. Sunucudaki `update_profile`
 * şu an yalnızca uzunluk ve karakter kümesini denetliyor; aynı listenin sunucuya da eklenmesi (`bad_nickname_word`
 * hatası) ve "takma adı bildir" akışı açık iş olarak `store/qa-report.md` → O7'de duruyor.
 *
 * Normalleştirme: küçük harf, Türkçe harfler ASCII'ye (ı→i, ş→s…), sık kullanılan rakam/işaret ikameleri (0→o, 1→i,
 * 3→e, 4→a, 5→s, 7→t, @→a, $→s). Uzatılmış harfler ("fuuuck") kısaltılır. Kısa veya başka kelimelerin içinde geçebilen
 * kökler sadece tam kelime olarak aranır; böylece "Işık" (isik), "Nigar", "Amina", "fukara" gibi adlar engellenmez.
 */

const MAP: Record<string, string> = {
  ı: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c", â: "a", î: "i", û: "u",
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s", "!": "i", "|": "i",
};

/** Adın içinde herhangi bir yerde geçerse engellenir. */
const ANYWHERE = [
  // Türkçe
  "orospu", "orosbu", "siktir", "sikerim", "sikeyim", "yarrak", "amcik", "aminako", "aminak", "pezevenk", "kahpe",
  "kaltak", "yavsak", "serefsiz", "gavat", "ibne", "dalyarak", "gotveren", "gotlek", "fahise", "surtuk", "kancik",
  // İngilizce
  "fuck", "shit", "bitch", "cunt", "nigger", "faggot", "whore", "slut", "pussy", "porn", "hitler",
];

/** Sadece ayrı bir kelime (veya adın tamamı) olarak engellenir. */
const WHOLE = [
  "am", "amk", "aq", "mk", "sik", "sikik", "sikis", "got", "oc", "pic", "pust", "yarak", "tasak",
  "fag", "dick", "cock", "rape", "nazi", "sex", "seks", "cum", "kys",
];

const hasDouble = (w: string) => /(.)\1/.test(w);
/** "fuuuck" → "fuck" */
const squeeze = (s: string) => s.replace(/(.)\1+/g, "$1");
/** "yarrrrak" → "yarrak" (çift harfli kökler için) */
const collapse = (s: string) => s.replace(/(.)\1{2,}/g, "$1$1");
const matches = (text: string, w: string, whole: boolean) => {
  const t = hasDouble(w) ? collapse(text) : squeeze(text);
  return whole ? t === w : t.includes(w);
};

export function normalizeNickname(s: string) {
  let out = "";
  for (const ch of s.toLocaleLowerCase("tr-TR")) out += MAP[ch] ?? ch;
  return out;
}

/** true: takma ad kaba/hakaret içeriyor. Boş ad (sıralamada "Oyuncu" görünür) her zaman geçer. */
export function isOffensiveNickname(name: string) {
  const norm = normalizeNickname(name.trim());
  const joined = norm.replace(/[^a-z]/g, "");
  if (!joined) return false;
  const words = norm.split(/[^a-z]+/).filter(Boolean);
  if (ANYWHERE.some((w) => matches(joined, w, false))) return true;
  return WHOLE.some((w) => matches(joined, w, true) || words.some((x) => matches(x, w, true)));
}
