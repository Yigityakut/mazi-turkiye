import { Share } from "react-native";
import { track } from "./analytics";
import { APP_NAME, WEB_URL } from "./config";
import { num, square } from "./format";

/** Wordle tarzı, fotoğrafı ele vermeyen özet. */
export function shareText(number: number, plays: { score_location: number; score_year: number }[], hint = false) {
  const total = plays.reduce((s, p) => s + p.score_location + p.score_year, 0);
  const label = number > 0 ? `#${number}` : "Ön gösterim";
  return [
    `${APP_NAME} ${label} · ${num(total)}/5.000${hint ? " (ipuçlu)" : ""}`,
    `📍${plays.map((p) => square(p.score_location)).join("")}`,
    `📅${plays.map((p) => square(p.score_year)).join("")}`,
    WEB_URL.replace(/^https?:\/\//, ""),
  ].join("\n");
}

export async function shareResult(text: string) {
  track("share_tapped", { channel: "system" });
  await Share.share({ message: text });
}

export async function shareChallenge(url: string, total: number, number: number) {
  track("challenge_sent", { day: number });
  const message = `${APP_NAME} #${number}'de ${num(total)} puan yaptım. Aynı 5 fotoğrafta beni geçebilir misin? 📸🗺️\n${url}`;
  // Link zaten mesajın içinde; ayrıca `url` verilince bazı hedefler metni atıyor veya linki iki kez gösteriyordu (QA D15)
  await Share.share({ message });
}
