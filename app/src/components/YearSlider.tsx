import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { GestureDetector, usePanGesture, useTapGesture, useSimultaneousGestures } from "react-native-gesture-handler";
import { font, radius, usePalette } from "../lib/theme";
import { T } from "./ui";

type Props = { value: number; min: number; max: number; onChange: (y: number) => void; disabled?: boolean };

/** Yıl kaydırıcısı: sürükle, dokun veya ± ile tek yıl ayarla. Her on yılda hafif titreşim. */
export function YearSlider({ value, min, max, onChange, disabled }: Props) {
  const c = usePalette();
  const [w, setW] = useState(0);
  const last = useRef(value);
  // Dışarıdan gelen değer (yeni fotoğrafta sıfırlama) ile eşitle; yoksa önceki yıla geri sürüklemek onChange tetiklemiyordu (QA D14)
  last.current = value;

  const set = (x: number) => {
    if (!w) return;
    const r = Math.min(Math.max(x / w, 0), 1);
    const y = Math.round(min + r * (max - min));
    if (y !== last.current) {
      if (Platform.OS !== "web" && Math.floor(y / 10) !== Math.floor(last.current / 10)) {
        Haptics.selectionAsync().catch(() => {});
      }
      last.current = y;
      onChange(y);
    }
  };
  const step = (d: number) => {
    const y = Math.min(Math.max(value + d, min), max);
    last.current = y;
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    onChange(y);
  };

  const pan = usePanGesture({ enabled: !disabled, runOnJS: true, minDistance: 0, onBegin: (e) => set(e.x), onUpdate: (e) => set(e.x) });
  const tapG = useTapGesture({ enabled: !disabled, runOnJS: true, onActivate: (e) => set(e.x) });
  const g = useSimultaneousGestures(pan, tapG);

  const ratio = (value - min) / Math.max(max - min, 1);
  const decades: number[] = [];
  for (let d = Math.ceil(min / 10) * 10; d <= max; d += 10) decades.push(d);
  const labels = decades.filter((d) => d % 20 === 0 || d === decades[0]);

  return (
    <View style={{ opacity: disabled ? 0.5 : 1 }}>
      <View style={styles.header}>
        <StepButton label="−" onPress={() => step(-1)} disabled={disabled || value <= min} a11y="Bir yıl geri" />
        <T
          v="number"
          style={{ fontSize: 40, lineHeight: 46, minWidth: 120, textAlign: "center" }}
          accessibilityRole="adjustable"
          accessibilityLabel={`Tahmin edilen yıl ${value}`}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) => step(e.nativeEvent.actionName === "increment" ? 1 : -1)}
        >
          {value}
        </T>
        <StepButton label="+" onPress={() => step(1)} disabled={disabled || value >= max} a11y="Bir yıl ileri" />
      </View>
      <GestureDetector gesture={g}>
        <View style={styles.hit} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} collapsable={false}>
          <View style={[styles.track, { backgroundColor: c.surfaceAlt, borderColor: c.line }]}>
            <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: c.accentSoft }]} />
            {decades.map((d) => (
              <View key={d} style={[styles.tick, { left: `${((d - min) / (max - min)) * 100}%`, backgroundColor: c.line }]} />
            ))}
          </View>
          <View pointerEvents="none" style={[styles.thumb, { left: ratio * w - 16, backgroundColor: c.accent, borderColor: c.surface }]} />
        </View>
      </GestureDetector>
      <View style={styles.labels} pointerEvents="none">
        {w > 0 && labels.map((d) => (
          <T key={d} v="caption" faint style={[styles.label, { left: ((d - min) / (max - min)) * w - 18 }]}>{d}</T>
        ))}
      </View>
    </View>
  );
}

function StepButton({ label, onPress, disabled, a11y }: { label: string; onPress: () => void; disabled?: boolean; a11y: string }) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={a11y} disabled={disabled} onPress={onPress} hitSlop={8}
      style={({ pressed }) => [styles.step, { borderColor: c.line, backgroundColor: c.surface, opacity: disabled ? 0.35 : pressed ? 0.7 : 1 }]}
    >
      <T style={{ fontFamily: font.semibold, fontSize: 22, lineHeight: 24 }}>{label}</T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 6 },
  hit: { height: 44, justifyContent: "center" },
  track: { height: 12, borderRadius: radius.pill, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0 },
  tick: { position: "absolute", top: 3, bottom: 3, width: 1 },
  thumb: { position: "absolute", width: 32, height: 32, borderRadius: 16, borderWidth: 4, top: 6,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  labels: { height: 16, marginTop: 2 },
  label: { position: "absolute", width: 36, textAlign: "center" },
  step: { width: 44, height: 44, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
});
