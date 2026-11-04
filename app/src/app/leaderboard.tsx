import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { ErrorState, Loading, Screen, T } from "../components/ui";
import { api } from "../lib/api";
import { errorText, num } from "../lib/format";
import { font, radius, space, usePalette } from "../lib/theme";
import type { Leaderboard } from "../lib/types";

const TABS = [
  { key: "today", label: "Bugün" },
  { key: "week", label: "Hafta" },
  { key: "friends", label: "Arkadaşlar" },
] as const;

export default function LeaderboardScreen() {
  const c = usePalette();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("today");
  const [data, setData] = useState<Leaderboard | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const req = useRef(0);
  // Hata önce temizlenir: "Tekrar dene" ve sekme değişimi gerçekten yeniden yükler (QA O1). Eski sekmenin geç gelen cevabı yok sayılır.
  const load = useCallback(() => {
    const id = ++req.current;
    setErr(null);
    setData(null);
    api.leaderboard(tab)
      .then((d) => { if (id === req.current) setData(d); })
      .catch((e) => { if (id === req.current) setErr(errorText(e)); });
  }, [tab]);
  useEffect(load, [load]);

  return (
    <Screen>
      <View style={[styles.tabs, { backgroundColor: c.surfaceAlt }]} accessibilityRole="tablist">
        {TABS.map((t) => (
          <Pressable key={t.key} accessibilityRole="tab" accessibilityState={{ selected: tab === t.key }} onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && { backgroundColor: c.surface }]}>
            <T style={{ fontFamily: font.semibold }} color={tab === t.key ? c.ink : c.inkMuted}>{t.label}</T>
          </Pressable>
        ))}
      </View>
      {err ? <ErrorState message={err} onRetry={load} /> : !data ? <Loading /> : (
        <FlatList
          data={data.rows}
          keyExtractor={(r, i) => `${r.rank}-${i}`}
          contentContainerStyle={{ padding: space.lg, gap: 6 }}
          ListHeaderComponent={data.me ? (
            <T muted style={{ marginBottom: space.sm }}>Sen: {num(data.me.rank)}. sıra · {num(data.me.total)} puan · {num(data.players)} oyuncu</T>
          ) : (
            <T muted style={{ marginBottom: space.sm }}>
              {tab === "friends" ? "Meydan okuma linkiyle oynadığın arkadaşların burada görünür." : "Bugünü bitirince sıralamaya girersin."}
            </T>
          )}
          ListEmptyComponent={<T muted center style={{ marginTop: space.xl }}>Henüz kimse yok.</T>}
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: item.is_me ? c.accentSoft : c.surface, borderColor: c.line }]} accessible
              accessibilityLabel={`${item.rank}. sıra, ${item.name}${item.is_me ? " (sen)" : ""}, ${num(item.total)} puan${item.used_hint ? ", ipucu kullandı" : ""}`}>
              <T style={{ width: 36, fontFamily: font.semibold }} color={item.rank <= 3 ? (item.is_me ? c.accentOnSoft : c.accent) : c.inkMuted}>{item.rank}</T>
              <T style={{ flex: 1, fontFamily: item.is_me ? font.semibold : font.body }} numberOfLines={1}>
                {item.name}{item.used_hint ? " 💡" : ""}
              </T>
              <T style={{ fontFamily: font.semibold, fontVariant: ["tabular-nums"] }}>{num(item.total)}</T>
            </View>
          )}
          ListFooterComponent={<T v="caption" faint style={{ marginTop: space.md }}>💡 ipucu kullanıldı. Takma adını Ayarlar'dan değiştirebilir veya sıralamada gizleyebilirsin.</T>}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", margin: space.lg, marginBottom: 0, borderRadius: radius.pill, padding: 4 },
  tab: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.pill },
  row: { flexDirection: "row", alignItems: "center", padding: space.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, minHeight: 52 },
});
