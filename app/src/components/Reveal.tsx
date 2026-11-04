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
        <Pressable accessibilityRole="button" onPress={onReport} hitSlop={8} style={{ alignSelf: "flex-start", paddingVertical: 6 }}>
          <T v="small" color={c.inkMuted} style={{ textDecorationLine: "underline" }}>Bu bilgi yanlış mı?</T>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

export function Attribution({ answer }: { answer: Pick<Answer, "author" | "source_name" | "source_url" | "license_code" | "license_url"> }) {
  const c = usePalette();
  return (
    <T v="caption" muted>
      Fotoğraf: {answer.author} ·{" "}
      <T v="caption" color={c.inkMuted} style={{ textDecorationLine: "underline" }} onPress={() => Linking.openURL(answer.source_url)}>
        {answer.source_name}
      </T>
      {" · "}
      {answer.license_url ? (
        <T v="caption" color={c.inkMuted} style={{ textDecorationLine: "underline" }} onPress={() => Linking.openURL(answer.license_url!)}>
          {answer.license_code}
        </T>
      ) : answer.license_code}
    </T>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  stats: { flexDirection: "row", gap: space.lg },
});
