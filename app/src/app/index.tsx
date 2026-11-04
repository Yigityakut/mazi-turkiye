import { Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, ErrorState, Loading, Pill, Screen, T } from "../components/ui";
import { api } from "../lib/api";
import { useApp } from "../lib/appState";
import { APP_NAME } from "../lib/config";
import { countdown, errorText, num } from "../lib/format";
import { prefs } from "../lib/prefs";
import { shareChallenge } from "../lib/share";
import { font, radius, space, usePalette } from "../lib/theme";

export default function Home() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { me, error, refresh } = useApp();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => { prefs.onboarded().then(setOnboarded); }, []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  // Ertelenmiş meydan okuma: ilk açılışta girilen kod
  useEffect(() => {
    prefs.pendingChallenge().then((code) => {
      if (code) { prefs.setPendingChallenge(null); router.push(`/challenge/${code}`); }
    });
  }, []);

  // Gün dönüşünde yenile
  useEffect(() => {
    if (me && now > Date.parse(me.next_rollover) + 2000) refresh();
  }, [now, me, refresh]);

  if (onboarded === false) return <Redirect href="/onboarding" />;
  if (!me && error) return <ErrorState message={errorText(error)} onRetry={refresh} />;
  if (!me || onboarded === null) return <Loading />;

  const done = !!me.today_result;
  const played = me.today_played;
  const left = Math.max(me.free_duels_per_day - me.duels_today, 0);

  const challenge = async () => {
    setSharing(true);
    try {
      const ch = await api.createChallenge();
      await shareChallenge(ch.url, ch.total, ch.number);
    } catch {} finally { setSharing(false); }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xxl, paddingHorizontal: space.lg, gap: space.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refresh(); setRefreshing(false); }} />}
      >
        <View style={styles.header}>
          <View>
            <T v="title" style={{ fontSize: 30 }}>Mazi</T>
            <T v="label" muted style={{ marginTop: -2 }}>Türkiye</T>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Ayarlar" hitSlop={10} onPress={() => router.push("/settings")}
            style={[styles.iconBtn, { borderColor: c.line, backgroundColor: c.surface }]}>
            <T style={{ fontSize: 20 }}>⚙︎</T>
          </Pressable>
        </View>

        <View style={styles.streakRow} accessible accessibilityLabel={`${me.streak.current} günlük seri, en iyi ${me.streak.best}`}>
          <T v="display" style={{ fontSize: 64, lineHeight: 68 }} color={me.streak.current > 0 ? c.accent : c.inkFaint}>{me.streak.current}</T>
          <View style={{ paddingBottom: 10 }}>
            <T style={{ fontFamily: font.semibold }}>günlük seri</T>
            <T v="small" muted>En iyi: {me.streak.best} gün</T>
          </View>
        </View>

        <Card style={{ gap: space.md, padding: space.xl }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <T v="label" muted>{me.today_number > 0 ? `Bugün · #${me.today_number}` : "Bugün · ön gösterim"}</T>
            {me.is_pro ? <Pill tone="accent">Pro</Pill> : null}
          </View>
          <T v="title">{done ? "Bugünün turu bitti" : played > 0 ? "Kaldığın yerden devam et" : "Bu fotoğraf nerede, hangi yıl?"}</T>
          <View style={styles.dots}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i < played ? c.accent : c.surfaceAlt, borderColor: c.line }]} />
            ))}
          </View>
          {done ? (
            <>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                <T v="number" color={c.accent}>{num(me.today_result!.total)}</T>
                <T muted>/ 5.000</T>
              </View>
              <Button title="Günün özeti" kind="secondary" onPress={() => router.push({ pathname: "/summary", params: { day: me.today } })} />
            </>
          ) : (
            <Button title={played > 0 ? `Devam et (${played}/5)` : "Oyna"} onPress={() => router.push("/play")} />
          )}
          <T v="small" muted center>Yeni fotoğraflar {countdown(Date.parse(me.next_rollover) - now)} sonra</T>
        </Card>

        <View style={{ flexDirection: "row", gap: space.md }}>
          <Card style={{ flex: 1, gap: space.sm }} onPress={() => router.push("/duel")} accessibilityLabel="Canlı 1v1 maç">
            <T v="label" color={c.accent}>Canlı 1v1</T>
            <T v="h2">Rakibinle aynı anda</T>
            <T v="small" muted>{me.is_pro ? `Derecen ${me.elo}` : left > 0 ? `Bugün ${left} maç hakkın var` : "Bugünkü hakların bitti"}</T>
          </Card>
          <Card style={{ flex: 1, gap: space.sm, opacity: done ? 1 : 0.7 }}
            onPress={done ? challenge : () => router.push("/play")} accessibilityLabel="Arkadaşına meydan oku">
            <T v="label" color={c.accent}>{sharing ? "Hazırlanıyor…" : "Meydan oku"}</T>
            <T v="h2">Arkadaşına gönder</T>
            <T v="small" muted>{done ? "Aynı 5 fotoğraf, skorlar yan yana" : "Önce bugünü bitir"}</T>
          </Card>
        </View>

        <View style={styles.links}>
          <LinkRow label="Sıralama" onPress={() => router.push("/leaderboard")} />
          <LinkRow label="İstatistik" onPress={() => router.push("/stats")} />
          <LinkRow label={me.is_pro ? "Arşiv" : "Arşiv · Pro"} onPress={() => router.push(me.is_pro ? "/archive" : { pathname: "/pro", params: { from: "archive" } })} />
          <LinkRow label="Meydan okuma kodu gir" onPress={() => router.push("/code")} />
        </View>
        <T v="caption" faint center>{APP_NAME} · Fotoğraflar açık lisanslı arşivlerden</T>
      </ScrollView>
    </Screen>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  const c = usePalette();
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => [styles.link, { borderColor: c.line, backgroundColor: pressed ? c.surfaceAlt : "transparent" }]}>
      <T style={{ fontFamily: font.medium }}>{label}</T>
      <T muted>›</T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  streakRow: { flexDirection: "row", alignItems: "flex-end", gap: space.md },
  dots: { flexDirection: "row", gap: 8 },
  dot: { flex: 1, height: 8, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth },
  links: { gap: 0 },
  link: { minHeight: 52, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 4 },
});
