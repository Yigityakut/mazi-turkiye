import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Button, ErrorState, Loading, Screen, T } from "../components/ui";
import { api } from "../lib/api";
import { useApp } from "../lib/appState";
import { errorText, num } from "../lib/format";
import { font, radius, space, usePalette } from "../lib/theme";

/** Geçmiş günlerin takvimi (Pro). Oynanan günlerde skor görünür. */
export default function Archive() {
  const c = usePalette();
  const { me, error, refresh } = useApp();
  const [played, setPlayed] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    api.stats().then((s) => setPlayed(Object.fromEntries(s.recent.map((r) => [r.day, r.total])))).catch(() => setPlayed({}));
  }, []);
  const days = useMemo(() => {
    if (!me) return [];
    const out: { day: string; number: number }[] = [];
    const t = new Date(me.today + "T12:00:00Z");
    for (let i = 1; i <= 120; i++) {
      const d = new Date(t.getTime() - i * 86400000);
      const n = me.today_number - i;
      if (n < 1) break;
      out.push({ day: d.toISOString().slice(0, 10), number: n });
    }
    return out;
  }, [me]);

  // İnternetsiz açılışta `me` hiç gelmeyebilir: sonsuz yükleme yerine hata + tekrar dene (QA D17)
  if (!me && error) return <ErrorState message={errorText(error)} onRetry={refresh} />;
  if (!me || played == null) return <Loading />;
  if (!me.is_pro) {
    return (
      <Screen style={{ padding: space.xl, justifyContent: "center", gap: space.lg }}>
        <T v="title" center>Geçmiş günlerin arşivi</T>
        <T muted center>Kaçırdığın günleri istediğin zaman oyna. Arşiv Pro'ya dahil.</T>
        <Button title="Pro'ya göz at" onPress={() => router.replace({ pathname: "/pro", params: { from: "archive" } })} />
      </Screen>
    );
  }
  return (
    <Screen>
      <FlatList
        data={days}
        numColumns={3}
        keyExtractor={(d) => d.day}
        contentContainerStyle={{ padding: space.lg, gap: space.sm }}
        columnWrapperStyle={{ gap: space.sm }}
        ListEmptyComponent={<T muted center>Arşiv, lansmandan sonraki ilk günden itibaren dolmaya başlar.</T>}
        renderItem={({ item }) => {
          const score = played[item.day];
          return (
            <Pressable accessibilityRole="button"
              accessibilityLabel={`Gün ${item.number}, ${item.day.slice(8, 10)}.${item.day.slice(5, 7)}, ${score != null ? `${num(score)} puan` : "oynanmadı"}`}
              onPress={() => router.push(score != null ? { pathname: "/summary", params: { day: item.day } } : { pathname: "/play", params: { day: item.day } })}
              style={({ pressed }) => [styles.cell, { backgroundColor: score != null ? c.accentSoft : c.surface, borderColor: c.line, opacity: pressed ? 0.8 : 1 }]}>
              <T v="label" muted>#{item.number}</T>
              <T style={{ fontFamily: font.semibold }}>{item.day.slice(8, 10)}.{item.day.slice(5, 7)}</T>
              <T v="small" color={score != null ? c.accentOnSoft : c.inkMuted}>{score != null ? num(score) : "Oyna"}</T>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  cell: { flex: 1, aspectRatio: 1, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", gap: 2 },
});
void View;
