import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, BackHandler, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhotoCard } from "../../components/Photo";
import { Attribution } from "../../components/Reveal";
import { ProvincePicker } from "../../components/ProvincePicker";
import { TurkeyMap, type MapPin } from "../../components/TurkeyMap";
import { Button, Card, ErrorBanner, ErrorState, Loading, Screen, T, success } from "../../components/ui";
import { YearSlider } from "../../components/YearSlider";
import { track } from "../../lib/analytics";
import { api } from "../../lib/api";
import { useApp } from "../../lib/appState";
import { errorText, isNetworkText, km, num } from "../../lib/format";
import type { LatLng } from "../../lib/geo";
import { font, GAME_FONT_SCALE, radius, space, usePalette } from "../../lib/theme";
import type { DuelState } from "../../lib/types";

export default function Duel() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { me, refresh } = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [s, setS] = useState<DuelState | null>(null);
  const [err, setErr] = useState<string | null>(null);         // durum yoklaması (bağlantı)
  const [sendErr, setSendErr] = useState<string | null>(null); // tahmin gönderme (ör. tur kapandı); yeni turda silinir
  const [pin, setPin] = useState<LatLng | null>(null);
  const [year, setYear] = useState(1965);
  const [sending, setSending] = useState(false);
  const offset = useRef(0);
  const lastRound = useRef(0);
  const finishedTracked = useRef(false);
  const [, force] = useState(0);

  const inFlight = useRef(false);
  const fetchState = useCallback(async () => {
    if (inFlight.current) return; // yavaş bağlantıda istekler üst üste binmesin
    inFlight.current = true;
    try {
      const t0 = Date.now();
      const st = await api.duelState(id);
      offset.current = Date.parse(st.server_now) - (t0 + Date.now()) / 2;
      setS(st);
      setErr(null);
    } catch (e) { setErr(errorText(e)); }
    finally { inFlight.current = false; }
  }, [id]);

  // Maç durumu sadece `duel_state` yoklamasıyla gelir (1,2 sn). `duels` tablosu gizlilik için istemcilere kapalı ve
  // Realtime yayınında değil; postgres_changes aboneliği hiç olay getirmiyordu.
  useEffect(() => {
    fetchState();
    const poll = setInterval(fetchState, 1200);
    const tick = setInterval(() => force((x) => x + 1), 250);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [fetchState]);

  // Yeni tura geçince tahmini sıfırla
  useEffect(() => {
    if (s && s.round !== lastRound.current && s.phase === "guessing") {
      lastRound.current = s.round;
      setSendErr(null);
      setPin(null);
      setYear(1965);
    }
    if (s?.phase === "finished" && !finishedTracked.current) {
      finishedTracked.current = true;
      track("duel_finished", { outcome: s.result?.outcome ?? "unknown" });
      if (s.result?.outcome === "win") success();
      refresh();
    }
  }, [s, refresh]);

  // Maçtan onaylı çıkış (QA D18): ✕ düğmesi ve Android geri tuşu. Maç sunucuda sürer; kalan turlar 0 puan sayılır.
  const live = !!s && s.phase !== "finished";
  const liveRef = useRef(live);
  liveRef.current = live;
  const confirmExit = useCallback(() => {
    Alert.alert("Maçtan çıkılsın mı?", "Maç devam eder; kalan turlarda tahmin yapmazsan puan alamazsın ve büyük ihtimalle kaybedersin.", [
      { text: "Maça dön", style: "cancel" },
      { text: "Çık", style: "destructive", onPress: () => router.replace("/") },
    ]);
  }, []);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!liveRef.current) return false; // maç bitti veya yüklenmedi: normal geri
      confirmExit();
      return true;
    });
    return () => sub.remove();
  }, [confirmExit]);

  const now = Date.now() + offset.current;
  const send = async () => {
    if (!s || !pin || sending) return;
    setSending(true);
    setSendErr(null);
    try { setS(await api.duelGuess(id, s.round, pin.lat, pin.lng, year)); }
    catch (e) { setSendErr(errorText(e)); fetchState(); }
    finally { setSending(false); }
  };

  if (err && !s) {
    return (
      <ErrorState message={err} onRetry={fetchState}>
        <Button title="Ana sayfa" kind="ghost" onPress={() => router.replace("/")} />
      </ErrorState>
    );
  }
  if (!s) return <Loading label="Maç hazırlanıyor" />;

  const bar = (
    <View style={[styles.bar, { paddingTop: insets.top + 6, borderColor: c.line }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Maçtan çık" hitSlop={6} onPress={confirmExit} style={styles.exit}>
        <T style={{ fontSize: 20 }} maxFontSizeMultiplier={GAME_FONT_SCALE}>✕</T>
      </Pressable>
      <View style={{ flex: 1 }}>
        <T v="label" muted maxFontSizeMultiplier={GAME_FONT_SCALE}>Sen</T>
        <T v="h2" maxFontSizeMultiplier={GAME_FONT_SCALE}>{num(s.score_me)}</T>
      </View>
      <View style={{ alignItems: "center" }}>
        <T v="label" muted maxFontSizeMultiplier={GAME_FONT_SCALE}>Tur {Math.min(s.round, 5)}/5</T>
        {s.phase === "guessing" ? <Countdown deadline={Date.parse(s.round_deadline)} start={Date.parse(s.round_started_at)} now={now} /> : null}
      </View>
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        <T v="label" muted numberOfLines={1} maxFontSizeMultiplier={GAME_FONT_SCALE}>{s.opponent.name}{s.opponent.guessed && s.phase === "guessing" ? " ✓" : ""}</T>
        <T v="h2" maxFontSizeMultiplier={GAME_FONT_SCALE}>{num(s.score_opp)}</T>
      </View>
    </View>
  );
  // Maç sürerken oluşan hata (bağlantı koptu, tur kapandı): yoklama başarılı olunca kendiliğinden kalkar (QA O2)
  const shown = err ?? sendErr;
  const banner = shown ? <ErrorBanner message={isNetworkText(shown) ? "Bağlantı koptu, yeniden bağlanılıyor…" : shown} /> : null;

  if (s.phase === "countdown") {
    const left = Math.max(Math.ceil((Date.parse(s.round_started_at) - now) / 1000), 0);
    return (
      <Screen style={{ justifyContent: "center", alignItems: "center", gap: space.lg, padding: space.xl }}>
        <T v="label" color={c.accent}>Rakip bulundu</T>
        <T v="title" center>{s.opponent.name}</T>
        {s.opponent.elo ? <T muted>Derece {s.opponent.elo}</T> : null}
        <T v="display" style={{ fontSize: 96, lineHeight: 100 }} color={c.accent}>{left || "Başla"}</T>
      </Screen>
    );
  }

  if (s.phase === "finished" && s.result) {
    const r = s.result;
    const delta = (r.elo_after ?? r.elo_before) - r.elo_before;
    const outOf = (me?.free_duels_per_day ?? 3) - (me?.duels_today ?? 0);
    return (
      <Screen>
        <ScrollView contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + space.xxl, gap: space.lg }}>
          <T v="label" color={c.accent} center>Maç bitti</T>
          <T v="display" center>{r.outcome === "win" ? "Kazandın" : r.outcome === "draw" ? "Berabere" : "Kaybettin"}</T>
          <T center muted>{num(s.score_me)} – {num(s.score_opp)} · {s.opponent.name}</T>
          <T center style={{ fontFamily: font.semibold }} color={delta >= 0 ? c.good : c.bad}>
            Derece {r.elo_before} → {r.elo_after} ({delta >= 0 ? "+" : ""}{delta})
          </T>
          <Card style={{ gap: space.sm }}>
            {s.rounds.map((x) => (
              <View key={x.round} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <T v="small" muted>Tur {x.round}</T>
                <T v="small"><T v="small" style={{ fontFamily: font.semibold }}>{x.me ?? 0}</T> · {x.opp ?? 0}</T>
              </View>
            ))}
          </Card>
          <Button title="Yeni maç" onPress={() => {
            if (!me?.is_pro && outOf <= 0) router.replace({ pathname: "/pro", params: { from: "duel" } }); // paywall_viewed Pro ekranında
            else router.replace("/duel");
          }} />
          <Button title="Ana sayfa" kind="secondary" onPress={() => router.replace("/")} />
        </ScrollView>
      </Screen>
    );
  }

  if (s.phase === "reveal" && s.reveal) {
    const a = s.reveal.answer;
    const ans = { lat: a.lat, lng: a.lng };
    const pins: MapPin[] = [{ id: "a", at: ans, kind: "answer", label: `${a.year}` }];
    const lines = [];
    if (s.reveal.me.lat != null) { pins.push({ id: "m", at: { lat: s.reveal.me.lat, lng: s.reveal.me.lng! }, kind: "guess", label: "Sen" }); lines.push({ from: { lat: s.reveal.me.lat, lng: s.reveal.me.lng! }, to: ans }); }
    if (s.reveal.opp.lat != null) { pins.push({ id: "o", at: { lat: s.reveal.opp.lat, lng: s.reveal.opp.lng! }, kind: "opponent", label: s.opponent.name }); lines.push({ from: { lat: s.reveal.opp.lat, lng: s.reveal.opp.lng! }, to: ans, kind: "opponent" as const, delay: 500 }); }
    return (
      <Screen>
        {bar}
        {banner}
        <View style={{ height: height * 0.45 }}>
          <TurkeyMap pins={pins} lines={lines} focus={pins.map((p) => p.at)} interactive={false} />
        </View>
        <Animated.View entering={FadeIn} style={{ padding: space.lg, gap: space.md }}>
          <T v="h2">{a.location_name} · {a.year}</T>
          <View style={{ flexDirection: "row", gap: space.lg }}>
            <RoundScore who="Sen" g={s.reveal.me} color={c.pinGuess} />
            <RoundScore who={s.opponent.name} g={s.reveal.opp} color={c.pinOpp} />
          </View>
          <Attribution answer={a} />
          <T v="small" faint>Sonraki tur birkaç saniye içinde…</T>
        </Animated.View>
      </Screen>
    );
  }

  // Tahmin aşaması
  const waiting = !!s.my_guess;
  return (
    <Screen>
      {bar}
      {banner}
      {s.photo ? (
        <Animated.View key={s.round} entering={FadeIn} style={{ height: height * 0.3, marginHorizontal: space.md, marginTop: space.sm, borderRadius: radius.lg, overflow: "hidden" }}>
          <PhotoCard src={{ image_path: s.photo.image_path }} style={{ flex: 1 }} />
        </Animated.View>
      ) : null}
      <View style={{ flex: 1, margin: space.md, borderRadius: radius.lg, overflow: "hidden" }}>
        <TurkeyMap pins={pin ? [{ id: "g", at: pin, kind: "guess" }] : []} onPick={waiting ? undefined : setPin} />
      </View>
      <View style={{ paddingHorizontal: space.lg, paddingBottom: insets.bottom + space.md, gap: space.sm }}>
        {waiting ? (
          <Card style={{ alignItems: "center" }}><T style={{ fontFamily: font.semibold }} maxFontSizeMultiplier={GAME_FONT_SCALE}>Tahminin alındı. {s.opponent.guessed ? "Sonuçlar geliyor…" : "Rakip düşünüyor…"}</T></Card>
        ) : (
          <>
            <ProvincePicker key={s.round} onPick={setPin} />
            <YearSlider value={year} min={1880} max={new Date().getFullYear()} onChange={setYear} />
            <Button title={pin ? "Tahmin et" : "Haritada yer seç"} disabled={!pin} loading={sending} onPress={send} maxFontSizeMultiplier={GAME_FONT_SCALE} />
          </>
        )}
      </View>
    </Screen>
  );
}

function RoundScore({ who, g, color }: { who: string; g: { score: number; distance_km?: number; year?: number; year_diff?: number }; color: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <T v="label" color={color} numberOfLines={1}>{who}</T>
      <T v="h2">{g.score}</T>
      <T v="small" muted>{g.distance_km != null ? `${km(g.distance_km)} · ${g.year}` : "Tahmin yok"}</T>
    </View>
  );
}

function Countdown({ deadline, start, now }: { deadline: number; start: number; now: number }) {
  const c = usePalette();
  const total = Math.max(deadline - start, 1);
  const left = Math.max(deadline - now, 0);
  const w = useSharedValue(left / total);
  useEffect(() => { w.value = withTiming(left / total, { duration: 240, easing: Easing.linear }); }, [left, total, w]);
  const st = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <T style={{ fontFamily: font.semibold, fontVariant: ["tabular-nums"] }} color={left < 10000 ? c.bad : c.ink} maxFontSizeMultiplier={GAME_FONT_SCALE}>{Math.ceil(left / 1000)} sn</T>
      <View style={{ width: 90, height: 4, borderRadius: 2, backgroundColor: c.surfaceAlt, overflow: "hidden" }}>
        <Animated.View style={[{ height: 4, backgroundColor: left < 10000 ? c.bad : c.accent }, st]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  exit: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -space.sm, marginRight: space.xs },
  bar: { flexDirection: "row", alignItems: "center", paddingHorizontal: space.lg, paddingBottom: space.sm, borderBottomWidth: StyleSheet.hairlineWidth },
});
