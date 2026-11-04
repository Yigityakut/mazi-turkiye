import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import * as StoreReview from "expo-store-review";
import { useCallback, useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CountUp } from "../components/CountUp";
import { Button, Card, ErrorState, Loading, Screen, T } from "../components/ui";
import { api } from "../lib/api";
import { useApp } from "../lib/appState";
import { errorText, km, num } from "../lib/format";
import { askPermissionAfterFirstRound } from "../lib/notifications";
import { prefs } from "../lib/prefs";
import { shareChallenge, shareResult, shareText } from "../lib/share";
import { imageUrl } from "../lib/supabase";
import { font, radius, space, usePalette } from "../lib/theme";
import type { Challenge, Day } from "../lib/types";

export default function Summary() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { me, refresh } = useApp();
  const { day: dayParam, challenge } = useLocalSearchParams<{ day?: string; challenge?: string }>();
  const [day, setDay] = useState<Day | null>(null);
  const [rank, setRank] = useState<{ rank: number; players: number } | null>(null);
  const [ch, setCh] = useState<Challenge | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shareErr, setShareErr] = useState<string | null>(null);

  // Zorunlu olan sadece günün verisi; sıralama, meydan okuma ve istatistik hatası tüm ekranı hataya düşürmez (QA D3)
  const load = useCallback(async () => {
    setErr(null);
    let d: Day;
    try {
      d = await api.day(dayParam ?? null, challenge || null);
      setDay(d);
    } catch (e) { setErr(errorText(e)); return; }
    if (d.is_today) {
      api.leaderboard("today").then((lb) => { if (lb.me) setRank({ rank: lb.me.rank, players: lb.players }); }).catch(() => {});
    }
    if (challenge) api.challenge(challenge).then(setCh).catch(() => {});
    try {
      const m = await refresh();
      // Bildirim izni: ilk bitirilen turun sonunda; başka cihazdan gelen veya ilk turu meydan okumayla bitiren de sorulur (QA O10).
      // askPermissionAfterFirstRound sadece bir kez sorar.
      if (m && m.days_completed >= 1) setTimeout(() => { void askPermissionAfterFirstRound(); }, 1800);
      // Puan isteme: 3. gün tamamlandı ve skor kendi ortalamasının üzerinde (puan kapısı yok)
      if (m && m.days_completed >= 3 && d.result && Platform.OS !== "web" && !(await prefs.reviewAsked())) {
        const st = await api.stats();
        if (d.result.total > st.avg_total && (await StoreReview.hasAction())) {
          await prefs.setReviewAsked();
          setTimeout(() => StoreReview.requestReview().catch(() => {}), 2500);
        }
      }
    } catch {}
  }, [dayParam, challenge, refresh]);

  useEffect(() => { void load(); }, [load]);

  if (err && !day) return <ErrorState message={err} onRetry={load} />;
  if (!day) return <Loading />;
  const plays = day.photos.map((p) => p.play).filter(Boolean) as NonNullable<Day["photos"][number]["play"]>[];
  const total = day.result?.total ?? plays.reduce((s, p) => s + p.score_location + p.score_year, 0);

  const sendChallenge = async () => {
    setBusy(true);
    try {
      const r = await api.createChallenge(day.day);
      await shareChallenge(r.url, r.total, r.number);
    } catch (e) { setShareErr(errorText(e)); } finally { setBusy(false); }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xxl, paddingHorizontal: space.lg, gap: space.lg }}>
        <T v="label" muted center>{day.number > 0 ? `#${day.number}` : "Ön gösterim"} · {day.is_today ? "Bugün" : day.day}</T>
        <View style={{ alignItems: "center" }}>
          <CountUp to={total} duration={1400} style={{ fontSize: 72, lineHeight: 78 }} color={c.accent} />
          <T muted>/ 5.000 puan</T>
          {rank ? <T style={{ marginTop: space.sm, fontFamily: font.semibold }}>Bugün {num(rank.players)} oyuncu arasında {num(rank.rank)}.</T> : null}
        </View>

        {ch && !ch.is_mine ? (
          <Card style={{ gap: space.sm }}>
            <T v="label" color={c.accent}>Meydan okuma</T>
            <T v="h2">
              {total > ch.creator_total ? "Meydan okumayı kazandın!" : total === ch.creator_total ? "Berabere!" : `${ch.creator_name} bu sefer önde.`}
            </T>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <T>Sen: <T style={{ fontFamily: font.semibold }}>{num(total)}</T></T>
              <T>{ch.creator_name}: <T style={{ fontFamily: font.semibold }}>{num(ch.creator_total)}</T></T>
            </View>
            {ch.slots?.map((s) => (
              <View key={s.slot} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <T v="small" muted>{s.slot}. fotoğraf</T>
                <T v="small">{s.me ?? "–"} · {s.creator}</T>
              </View>
            ))}
          </Card>
        ) : null}

        <View style={{ gap: space.sm }}>
          {day.photos.map((p, i) => p.play && (
            <Animated.View key={p.slot} entering={FadeInDown.delay(300 + i * 120)}>
              <View style={[styles.row, { backgroundColor: c.surface, borderColor: c.line }]}>
                <Image source={{ uri: imageUrl(p.image_path, 200) }} style={[styles.thumb, { backgroundColor: c.surfaceAlt }]} contentFit="cover" accessible={false} />
                <View style={{ flex: 1 }}>
                  <T style={{ fontFamily: font.semibold }} numberOfLines={1}>{p.play.answer.location_name}</T>
                  <T v="small" muted>{p.play.answer.year} · {km(p.play.distance_km)} · {p.play.year_diff === 0 ? "yıl tam" : `${p.play.year_diff} yıl`}</T>
                </View>
                <T v="h2" color={c.accent}>{num(p.play.score_location + p.play.score_year)}</T>
              </View>
            </Animated.View>
          ))}
        </View>

        <Button title="Sonucu paylaş" onPress={() => { shareResult(shareText(day.number, plays, !!day.result?.used_hint)).catch(() => {}); }} />
        <Button title="Arkadaşına meydan oku" kind="secondary" loading={busy} onPress={() => { setShareErr(null); void sendChallenge(); }} />
        {shareErr ? <T v="small" color={c.bad} center accessibilityRole="alert">{shareErr}</T> : null}
        {!me?.is_pro ? (
          <T v="small" muted center>Geçmiş günleri oynamak ve ipuçları için Pro'ya göz at.</T>
        ) : null}
        <Button title="Ana sayfa" kind="ghost" onPress={() => router.replace("/")} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  thumb: { width: 52, height: 52, borderRadius: 10 },
});
