import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { km, yearDiff } from "../lib/format";
import { font, space, usePalette } from "../lib/theme";
import type { Answer } from "../lib/types";
import { CountUp } from "./CountUp";
import { success, T } from "./ui";

/** Açılımın metin kısmı: yıl sayacı doğru yıla akar, puan sayılarak artar, hikaye ve atıf görünür. */
export function RevealSummary({ answer, guessYear, distanceKm, yearDiffV, scoreLocation, scoreYear, hintLoc, hintYear }:
  { answer: Answer; guessYear: number; distanceKm: number; yearDiffV: number; scoreLocation: number; scoreYear: number;
    hintLoc?: boolean; hintYear?: boolean }) {
  const c = usePalette();
  const total = scoreLocation + scoreYear;
  useEffect(() => {
    const t = setTimeout(() => { if (total >= 800) success(); }, 1700);
    return () => clearTimeout(t);
  }, [total]);
  return (
    <View style={{ gap: space.md }}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <T v="label" muted>Doğru cevap</T>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <CountUp to={answer.year} from={guessYear} duration={1100} delay={600} plain style={{ fontSize: 38, lineHeight: 42 }} />
          </View>
          <T v="h2" numberOfLines={2}>{answer.location_name}</T>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <T v="label" muted>Puan</T>
          <CountUp to={total} delay={1200} duration={900} style={{ fontSize: 38, lineHeight: 42 }} color={c.accent} />
          <T v="caption" faint>/ 1.000</T>
        </View>
      </View>
      <View style={styles.stats}>
        <Stat label="Konum" value={km(distanceKm)} score={scoreLocation} hinted={hintLoc} />
        <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: c.line }} />
        <Stat label="Yıl" value={yearDiff(yearDiffV)} score={scoreYear} hinted={hintYear} />
      </View>
    </View>
  );
}

function Stat({ label, value, score, hinted }: { label: string; value: string; score: number; hinted?: boolean }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <T v="label" muted>{label}{hinted ? " · ipuçlu" : ""}</T>
      <T style={{ fontFamily: font.semibold }}>{value}</T>
      <T v="small" muted>{score} / 500</T>
    </View>
  );
}

export function StoryBlock({ answer, onReport }: { answer: Answer; onReport?: () => void }) {
  const c = usePalette();
  const [more, setMore] = useState(false);
  return (
    <Animated.View entering={FadeInDown.delay(1500).duration(400)} style={{ gap: space.sm }}>
      {answer.title ? <T v="h2">{answer.title}</T> : null}
      {answer.story ? (
        <T numberOfLines={more ? undefined : 4} onPress={() => setMore(true)} style={{ lineHeight: 24 }}>{answer.story}</T>
      ) : null}
      <Attribution answer={answer} />
      {onReport ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Bu bilgi yanlış mı? Bildir" onPress={onReport} hitSlop={8} style={{ alignSelf: "flex-start", minHeight: 44, justifyContent: "center" }}>
          <T v="small" color={c.inkMuted} style={{ textDecorationLine: "underline" }}>Bu bilgi yanlış mı?</T>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const open = (url: string) => { Linking.openURL(url).catch(() => {}); };

/**
 * Atıf: eser sahibi + kaynak + lisans. Linkler satır içi metin değil, en az 44 pt yüksekliğinde ayrı dokunma alanları
 * (Plan 5.2, QA D18); 12 pt satır içi linklere parmakla isabet etmek zordu.
 */
export function Attribution({ answer }: { answer: Pick<Answer, "author" | "source_name" | "source_url" | "license_code" | "license_url"> }) {
  const c = usePalette();
  return (
    <View>
      <T v="caption" muted>Fotoğraf: {answer.author}</T>
      <View style={styles.links}>
        <LinkChip label={answer.source_name} a11y={`Kaynak: ${answer.source_name}`} onPress={() => open(answer.source_url)} color={c.inkMuted} />
        {answer.license_url ? (
          <LinkChip label={answer.license_code} a11y={`Lisans: ${answer.license_code}`} onPress={() => open(answer.license_url!)} color={c.inkMuted} />
        ) : (
          <View style={styles.link}><T v="caption" muted>{answer.license_code}</T></View>
        )}
      </View>
    </View>
  );
}

function LinkChip({ label, a11y, onPress, color }: { label: string; a11y: string; onPress: () => void; color: string }) {
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={a11y} onPress={onPress}
      style={({ pressed }) => [styles.link, { opacity: pressed ? 0.6 : 1 }]}>
      <T v="caption" color={color} style={{ textDecorationLine: "underline" }} numberOfLines={1}>{label}</T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  stats: { flexDirection: "row", gap: space.lg },
  links: { flexDirection: "row", flexWrap: "wrap", columnGap: space.lg },
  link: { minHeight: 44, justifyContent: "center", maxWidth: "100%" },
});
