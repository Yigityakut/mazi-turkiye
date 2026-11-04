import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, ErrorState, Loading, Screen, T } from "../components/ui";
import { api } from "../lib/api";
import { errorText, num } from "../lib/format";
import { font, radius, space, usePalette } from "../lib/theme";
import type { Stats } from "../lib/types";

const ERA_LABEL: Record<string, string> = {
  "1880-1919": "1880–1919", "1920-1949": "1920–1949", "1950-1979": "1950–1979", "1980-1999": "1980–1999", "2000-": "2000 sonrası",
};

export default function StatsScreen() {
  const c = usePalette();
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => {
    setErr(null); // "Tekrar dene" hatayı temizlemeden yüklerse ekran hata durumunda kalıyordu (QA O1)
    api.stats().then(setS).catch((e) => setErr(errorText(e)));
  }, []);
  useEffect(load, [load]);
  if (err) return <ErrorState message={err} onRetry={load} />;
  if (!s) return <Loading />;
  const maxRecent = Math.max(...s.recent.map((r) => r.total), 1);
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
        <View style={styles.grid}>
          <Tile label="Oynanan gün" value={num(s.days)} />
          <Tile label="Ortalama" value={num(s.avg_total)} />
          <Tile label="En iyi" value={num(s.best_total)} />
          <Tile label="Seri / en iyi" value={`${s.streak.current} / ${s.streak.best}`} />
        </View>
        {s.recent.length > 0 && (
          <Card style={{ gap: space.md }}>
            <T v="label" muted>Son {s.recent.length} gün</T>
            <View style={styles.chart} accessible accessibilityRole="image"
              accessibilityLabel={`Son ${s.recent.length} günün skorları: ${s.recent.map((r) => num(r.total)).join(", ")}`}>
              {s.recent.map((r) => (
                <View key={r.day} style={{ flex: 1, justifyContent: "flex-end" }}>
                  <View style={{ height: `${(r.total / maxRecent) * 100}%`, backgroundColor: c.accent, borderRadius: 3, minHeight: 3 }} />
                </View>
              ))}
            </View>
          </Card>
        )}
        {s.full ? (
          <>
            <Card style={{ gap: space.sm }}>
              <T v="label" muted>Dönemlere göre yıl isabeti</T>
              {s.by_era.map((e) => (
                <Bar key={e.key} label={ERA_LABEL[e.key] ?? e.key} value={e.avg_score_year} max={500} note={`ort. ${String(e.avg_year_diff).replace(".", ",")} yıl fark`} />
              ))}
            </Card>
            <Card style={{ gap: space.sm }}>
              <T v="label" muted>Bölgelere göre konum isabeti</T>
              {s.by_region.map((r) => (
                <Bar key={r.key} label={r.key} value={r.avg_score_location} max={500} note={`ort. ${num(r.avg_km)} km`} />
              ))}
            </Card>
          </>
        ) : (
          <Card style={{ gap: space.md }}>
            <T v="h2">Hangi dönemde, hangi bölgede iyisin?</T>
            <T muted>On yıl ve bölge bazlı detaylı istatistikler Pro'da.</T>
            <Button title="Pro'ya göz at" kind="secondary" onPress={() => router.push({ pathname: "/pro", params: { from: "stats" } })} />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  const c = usePalette();
  return (
    <View style={[styles.tile, { backgroundColor: c.surface, borderColor: c.line }]}>
      <T v="h2">{value}</T>
      <T v="small" muted>{label}</T>
    </View>
  );
}

function Bar({ label, value, max, note }: { label: string; value: number; max: number; note: string }) {
  const c = usePalette();
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <T v="small" style={{ fontFamily: font.semibold }}>{label}</T>
        <T v="small" muted>{note}</T>
      </View>
      <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: c.surfaceAlt, overflow: "hidden" }}>
        <View style={{ height: 8, width: `${(value / max) * 100}%`, backgroundColor: c.accent }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  tile: { flexBasis: "47%", flexGrow: 1, padding: space.lg, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, gap: 2 },
  // Sütunlar dikeyde gerilir (alignItems: stretch); çubuk her sütunun içinde alta yaslı. "flex-end" sütun yüksekliğini 0 yapıp çubukları düzleştiriyordu.
  chart: { height: 90, flexDirection: "row", gap: 3 },
});
