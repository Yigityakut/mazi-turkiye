import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhotoCard, PhotoZoom } from "../components/Photo";
import { RevealSummary, StoryBlock } from "../components/Reveal";
import { TurkeyMap, type MapPin } from "../components/TurkeyMap";
import { Button, ErrorState, Loading, Screen, T, tap } from "../components/ui";
import { YearSlider } from "../components/YearSlider";
import { track } from "../lib/analytics";
import { api } from "../lib/api";
import { useApp } from "../lib/appState";
import { errorText } from "../lib/format";
import type { LatLng } from "../lib/geo";
import { prefs } from "../lib/prefs";
import { font, radius, space, usePalette } from "../lib/theme";
import type { Day, GuessResult } from "../lib/types";

type Revealed = Pick<GuessResult, "distance_km" | "year_diff" | "score_location" | "score_year" | "hint_location" | "hint_year" | "answer"> & {
  guess: LatLng; guessYear: number; dayComplete: boolean;
};

export default function Play() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { me, refresh } = useApp();
  const params = useLocalSearchParams<{ day?: string; challenge?: string }>();
  const [day, setDay] = useState<Day | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [slot, setSlot] = useState(1);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [year, setYear] = useState(1960);
  const [sending, setSending] = useState(false);
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [hints, setHints] = useState<Record<string, string>>({});
  const [reopen, setReopen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const startedAt = useRef(Date.now());

  const load = useCallback(async () => {
    setErr(null);
    try {
      const d = await api.day(params.day ?? null, params.challenge ?? null);
      if (!d.photos.length) throw new Error("day_not_found");
      setDay(d);
      const next = d.photos.find((p) => !p.play);
      if (!next) {
        router.replace({ pathname: "/summary", params: { day: d.day, challenge: params.challenge ?? "" } });
        return;
      }
      setSlot(next.slot);
      setYear(Math.round((d.min_year + d.max_year) / 2));
      if (d.mode === "daily" && next.slot === 1) prefs.recordStart();
      startedAt.current = Date.now();
    } catch (e) {
      setErr(errorText(e));
    }
  }, [params.day, params.challenge]);

  useEffect(() => { load(); }, [load]);

  const photo = day?.photos.find((p) => p.slot === slot);
  const yearHint = hints[`${slot}:year`] ?? null;
  const regionHint = hints[`${slot}:location`] ?? null;

  const guess = async () => {
    if (!day || !pin || sending) return;
    setSending(true);
    tap();
    try {
      const r = await api.guess({
        day: day.day, slot, lat: pin.lat, lng: pin.lng, year,
        durationMs: Date.now() - startedAt.current, challenge: params.challenge || null,
      });
      track("photo_guessed", {
        distance_km: Math.round(r.distance_km), year_diff: r.year_diff, duration_s: Math.round((Date.now() - startedAt.current) / 1000),
        hint: r.hint_location || r.hint_year, slot,
      });
      setRevealed({ ...r, guess: pin, guessYear: year, dayComplete: r.day_complete });
      setDay((d) => d && ({
        ...d,
        photos: d.photos.map((p) => p.slot === slot ? {
          ...p, play: {
            guess_lat: pin.lat, guess_lng: pin.lng, guess_year: year, distance_km: r.distance_km, year_diff: r.year_diff,
            score_location: r.score_location, score_year: r.score_year, hint_location: r.hint_location, hint_year: r.hint_year, answer: r.answer,
          },
        } : p),
      }));
      if (r.day_complete) {
        track("day_completed", { total: r.day_total, mode: day.mode });
        if (day.mode === "challenge") track("challenge_completed", { total: r.day_total });
        refresh();
      }
    } catch (e) {
      const m = errorText(e);
      if (String(e).includes("already_played")) load(); else setErr(m);
    } finally {
      setSending(false);
    }
  };

  const next = () => {
    if (!day || !revealed) return;
    if (revealed.dayComplete) {
      router.replace({ pathname: "/summary", params: { day: day.day, challenge: params.challenge ?? "" } });
      return;
    }
    const n = day.photos.find((p) => !p.play);
    setRevealed(null);
    setPin(null);
    setYear(Math.round((day.min_year + day.max_year) / 2));
    if (n) setSlot(n.slot);
    startedAt.current = Date.now();
  };

  const askHint = async (kind: "year" | "location") => {
    if (!day) return;
    if (!me?.is_pro) { track("paywall_viewed", { from: "hint" }); router.push({ pathname: "/pro", params: { from: "hint" } }); return; }
    try {
      const h = await api.hint(day.day, slot, kind);
      track("hint_used", { kind });
      setHints((x) => ({ ...x, [`${slot}:${kind}`]: h.text }));
    } catch (e) { setErr(errorText(e)); }
  };

  const pins = useMemo<MapPin[]>(() => {
    if (revealed) {
      return [
        { id: "g", at: revealed.guess, kind: "guess", label: "Sen" },
        { id: "a", at: { lat: revealed.answer.lat, lng: revealed.answer.lng }, kind: "answer", label: revealed.answer.province ?? undefined },
      ];
    }
    return pin ? [{ id: "g", at: pin, kind: "guess" }] : [];
  }, [pin, revealed]);

  if (err && !day) return <ErrorState message={err} onRetry={load} />;
  if (!day || !photo) return <Loading label="Fotoğraflar hazırlanıyor" />;

  const header = (
    <View style={[styles.top, { paddingTop: insets.top + 4 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Kapat" hitSlop={10} onPress={() => router.back()} style={styles.topBtn}>
        <T style={{ fontSize: 22 }}>✕</T>
      </Pressable>
      <View style={styles.progress}>
        {day.photos.map((p) => (
          <View key={p.slot} style={[styles.progDot, {
            backgroundColor: p.play ? c.accent : p.slot === slot ? c.ink : c.surfaceAlt, borderColor: c.line,
          }]} />
        ))}
      </View>
      <T v="label" muted style={{ minWidth: 44, textAlign: "right" }}>{slot}/5</T>
    </View>
  );

  if (revealed) {
    const answerAt = { lat: revealed.answer.lat, lng: revealed.answer.lng };
    return (
      <Screen>
        {header}
        <View style={{ height: height * 0.4 }}>
          <TurkeyMap pins={pins} lines={[{ from: revealed.guess, to: answerAt }]} focus={[revealed.guess, answerAt]} interactive />
        </View>
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: insets.bottom + 120 }}>
          <RevealSummary
            answer={revealed.answer} guessYear={revealed.guessYear} distanceKm={revealed.distance_km} yearDiffV={revealed.year_diff}
            scoreLocation={revealed.score_location} scoreYear={revealed.score_year} hintLoc={revealed.hint_location} hintYear={revealed.hint_year}
          />
          <Pressable accessibilityRole="button" onPress={() => setReopen(true)} style={[styles.reopen, { borderColor: c.line, backgroundColor: c.surface }]}>
            <PhotoThumb path={revealed.answer.image_path} />
            <T style={{ fontFamily: font.semibold, flex: 1 }}>Fotoğrafı tekrar aç</T>
            <T muted>›</T>
          </Pressable>
          <StoryBlock answer={revealed.answer} onReport={() => setReporting(true)} />
        </ScrollView>
        <Animated.View entering={FadeInUp.delay(900)} style={[styles.bottomBar, { paddingBottom: insets.bottom + space.md, backgroundColor: c.bg, borderColor: c.line }]}>
          <Button title={revealed.dayComplete ? "Günün özeti" : "Sonraki fotoğraf"} onPress={next} />
        </Animated.View>
        <PhotoZoom src={{ image_path: revealed.answer.image_path }} visible={reopen} onClose={() => setReopen(false)} />
        <ReportSheet visible={reporting} onClose={() => setReporting(false)} photoId={revealed.answer.photo_id} />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      <Animated.View key={slot} entering={FadeIn.duration(350)} style={{ height: height * 0.32, marginHorizontal: space.md, borderRadius: radius.lg, overflow: "hidden" }}>
        <PhotoCard src={{ image_path: photo.image_path }} style={{ flex: 1 }} />
      </Animated.View>
      <View style={{ flex: 1, marginTop: space.md, marginHorizontal: space.md, borderRadius: radius.lg, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: c.line }}>
        <TurkeyMap pins={pins} onPick={setPin} highlightRegion={regionHint ? regionHint.replace(" Bölgesi", "") : null} />
        {!pin ? (
          <View pointerEvents="none" style={[styles.mapHint, { backgroundColor: c.overlay }]}>
            <T v="small" color="#fff" style={{ fontFamily: font.semibold }}>Haritaya dokunup iğneni bırak</T>
          </View>
        ) : null}
      </View>
      <View style={[styles.panel, { paddingBottom: insets.bottom + space.md }]}>
        <View style={styles.hintRow}>
          <HintChip label={yearHint ?? "Dönem ipucu"} active={!!yearHint} onPress={() => !yearHint && askHint("year")} pro={!me?.is_pro} />
          <HintChip label={regionHint ?? "Bölge ipucu"} active={!!regionHint} onPress={() => !regionHint && askHint("location")} pro={!me?.is_pro} />
        </View>
        <YearSlider value={year} min={day.min_year} max={day.max_year} onChange={setYear} />
        {err ? <T v="small" color={c.bad} center>{err}</T> : null}
        <Button title={pin ? "Tahmin et" : "Önce haritada yer seç"} onPress={guess} disabled={!pin} loading={sending} />
      </View>
    </Screen>
  );
}

function PhotoThumb({ path }: { path: string }) {
  return (
    <View style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden" }}>
      <PhotoCard src={{ image_path: path }} style={{ flex: 1 }} label="Fotoğraf" />
    </View>
  );
}

function HintChip({ label, active, onPress, pro }: { label: string; active: boolean; onPress: () => void; pro: boolean }) {
  const c = usePalette();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={4}
      style={({ pressed }) => [styles.chip, { borderColor: active ? c.accent : c.line, backgroundColor: active ? c.accentSoft : c.surface, opacity: pressed ? 0.8 : 1 }]}>
      <T v="small" style={{ fontFamily: font.semibold }} color={active ? c.accent : c.inkMuted}>
        {active ? `💡 ${label}` : `💡 ${label}${pro ? " · Pro" : ""}`}
      </T>
    </Pressable>
  );
}

const REASONS: { key: string; label: string }[] = [
  { key: "yil", label: "Yıl yanlış" },
  { key: "konum", label: "Konum yanlış" },
  { key: "uygunsuz", label: "Uygunsuz içerik" },
  { key: "telif", label: "Telif / hak sahibiyim" },
];

function ReportSheet({ visible, onClose, photoId }: { visible: boolean; onClose: () => void; photoId: string }) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const [sent, setSent] = useState(false);
  const send = async (reason: string) => {
    try { await api.report(photoId, reason); track("photo_reported", { reason }); } catch {}
    setSent(true);
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: c.overlay }} onPress={onClose} accessibilityLabel="Kapat" />
      <View style={{ backgroundColor: c.surface, padding: space.xl, paddingBottom: insets.bottom + space.xl, gap: space.md, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }}>
        {sent ? (
          <>
            <T v="h2">Teşekkürler</T>
            <T muted>Bildirimin bize ulaştı. Fotoğrafı kaynağıyla tekrar kontrol edeceğiz.</T>
            <Button title="Tamam" onPress={() => { setSent(false); onClose(); }} />
          </>
        ) : (
          <>
            <T v="h2">Bu bilgi yanlış mı?</T>
            {REASONS.map((r) => <Button key={r.key} title={r.label} kind="secondary" onPress={() => send(r.key)} />)}
            <Button title="Vazgeç" kind="ghost" onPress={onClose} />
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", paddingHorizontal: space.md, paddingBottom: space.sm, gap: space.md },
  topBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  progress: { flex: 1, flexDirection: "row", gap: 6 },
  progDot: { flex: 1, height: 6, borderRadius: 3, borderWidth: StyleSheet.hairlineWidth },
  mapHint: { position: "absolute", left: 12, bottom: 12, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  panel: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.sm },
  hintRow: { flexDirection: "row", gap: space.sm, justifyContent: "center" },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 999, paddingHorizontal: 12, minHeight: 36, justifyContent: "center" },
  reopen: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth },
});
