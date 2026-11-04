import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PROVINCE_CENTERS } from "../data/provinceCenters";
import type { LatLng } from "../lib/geo";
import { font, GAME_FONT_SCALE, radius, space, usePalette } from "../lib/theme";
import { Button, T } from "./ui";

/** Ekran okuyucu (VoiceOver/TalkBack) açık mı; açılıp kapanınca güncellenir. */
export function useScreenReader() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isScreenReaderEnabled().then((v) => { if (alive) setOn(v); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("screenReaderChanged", setOn);
    return () => { alive = false; sub.remove(); };
  }, []);
  return on;
}

const SORTED = [...PROVINCE_CENTERS].sort((a, b) => a[0].localeCompare(b[0], "tr"));

/**
 * Haritaya dokunamayan ekran okuyucu kullanıcıları için "İl seç" (QA O12): 81 ilin alfabetik listesi; seçilen ilin
 * merkezine iğne bırakılır. Sadece ekran okuyucu açıkken görünür.
 */
export function ProvincePicker({ onPick, disabled }: { onPick: (p: LatLng) => void; disabled?: boolean }) {
  const reader = useScreenReader();
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const data = useMemo(() => SORTED, []);
  if (!reader) return null;
  return (
    <>
      <Button small kind="secondary" disabled={disabled} maxFontSizeMultiplier={GAME_FONT_SCALE}
        title={picked ? `İl: ${picked}` : "İl seç"}
        accessibilityLabel={picked ? `Seçilen il ${picked}. Değiştirmek için il listesini aç` : "İl seç. Tahminini il listesinden bırak"}
        onPress={() => setOpen(true)} />
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + space.sm }}>
          <View style={styles.head}>
            <T v="h2" accessibilityRole="header">İl seç</T>
            <Button small kind="ghost" title="Kapat" onPress={() => setOpen(false)} />
          </View>
          <FlatList
            data={data}
            keyExtractor={(x) => x[0]}
            contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: insets.bottom + space.lg }}
            renderItem={({ item: [name, lat, lng] }) => (
              <Pressable accessibilityRole="button" accessibilityLabel={name} accessibilityState={{ selected: picked === name }}
                onPress={() => { setPicked(name); onPick({ lat, lng }); setOpen(false); }}
                style={({ pressed }) => [styles.row, { borderColor: c.line, backgroundColor: pressed ? c.surfaceAlt : "transparent" }]}>
                <T style={{ fontFamily: picked === name ? font.semibold : font.body }}>{name}</T>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.lg, paddingBottom: space.sm },
  row: { minHeight: 52, justifyContent: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderRadius: radius.sm, paddingHorizontal: space.sm },
});
