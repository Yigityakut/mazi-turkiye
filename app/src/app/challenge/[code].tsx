import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Button, Card, ErrorState, Loading, Screen, T } from "../../components/ui";
import { track } from "../../lib/analytics";
import { api } from "../../lib/api";
import { errorText, num } from "../../lib/format";
import { font, space, usePalette } from "../../lib/theme";
import type { Challenge } from "../../lib/types";

const SOURCES = new Set(["link", "manual", "deferred"]);

export default function ChallengeScreen() {
  const c = usePalette();
  const { code, source } = useLocalSearchParams<{ code: string; source?: string }>();
  const [ch, setCh] = useState<Challenge | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => {
    setErr(null); // QA O1
    api.challenge(code)
      .then((x) => {
        setCh(x);
        // Kaynak rotadan: /m/<KOD> → link, kod ekranı → manual, karşılama → deferred (QA D12); kendi meydan okuman sayılmaz
        if (!x.is_mine) track("challenge_opened", { source: SOURCES.has(String(source)) ? String(source) : "link" });
      })
      .catch((e) => setErr(errorText(e)));
  }, [code, source]);
  useEffect(load, [load]);
  if (err) {
    return (
      <ErrorState message={err} onRetry={load}>
        <Button title="Ana sayfa" kind="ghost" onPress={() => router.replace("/")} />
      </ErrorState>
    );
  }
  if (!ch) return <Loading />;
  const played = ch.my_total != null;
  return (
    <Screen style={{ padding: space.xl, gap: space.lg, justifyContent: "center" }}>
      <Stack.Screen options={{ headerShown: true, title: "" }} />
      <T v="label" color={c.accent}>Meydan okuma · #{ch.number}</T>
      <T v="title">{ch.is_mine ? "Bu senin meydan okuman" : `${ch.creator_name} seni çağırıyor`}</T>
      <Card style={{ gap: space.sm }}>
        <T muted>{ch.creator_name} bu 5 fotoğrafta</T>
        <T v="number" color={c.accent}>{num(ch.creator_total)} <T muted>/ 5.000</T></T>
        {played ? <T>Senin skorun: <T style={{ fontFamily: font.semibold }}>{num(ch.my_total!)}</T></T> : null}
      </Card>
      <View style={{ flex: 1 }} />
      {played || ch.is_mine ? (
        <Button title="Karşılaştırmayı gör" onPress={() => router.replace({ pathname: "/summary", params: { day: ch.day, challenge: ch.code } })} />
      ) : (
        <Button title="Aynı 5 fotoğrafı oyna" onPress={() => router.replace({ pathname: "/play", params: { day: ch.day, challenge: ch.code } })} />
      )}
    </Screen>
  );
}
