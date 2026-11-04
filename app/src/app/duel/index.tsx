import { router, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Button, Screen, T } from "../../components/ui";
import { track } from "../../lib/analytics";
import { api } from "../../lib/api";
import { useApp } from "../../lib/appState";
import { errorText } from "../../lib/format";
import { supabase } from "../../lib/supabase";
import { font, space, usePalette } from "../../lib/theme";

/** Eşleşme: 0. sn arama → 60. sn admin'e Telegram → 120. sn bot (sunucu yönetir). */
export default function DuelSearch() {
  const c = usePalette();
  const { me } = useApp();
  const [waited, setWaited] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [limit, setLimit] = useState(false);
  const started = useRef(Date.now());
  const done = useRef(false);

  const go = (id: string) => {
    if (done.current) return;
    done.current = true;
    track("duel_matched", { wait_s: Math.round((Date.now() - started.current) / 1000) });
    router.replace(`/duel/${id}`);
  };

  useEffect(() => {
    let poll: ReturnType<typeof setInterval> | undefined;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    track("duel_search_started");
    (async () => {
      try {
        const r = await api.duelFind();
        if (r.status === "matched" && r.duel_id) return go(r.duel_id);
        if (me) {
          channel = supabase.channel(`queue-${me.id}`)
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "duel_queue", filter: `user_id=eq.${me.id}` },
              (p) => { const row = p.new as { status: string; duel_id: string | null }; if (row.duel_id) go(row.duel_id); })
            .subscribe();
        }
        poll = setInterval(async () => {
          try {
            const s = await api.duelQueueStatus();
            setWaited(s.waited);
            if (s.duel_id && s.status === "matched") go(s.duel_id);
          } catch {}
        }, 2000);
      } catch (e) {
        if (String(e).includes("duel_limit")) setLimit(true);
        setErr(errorText(e));
      }
    })();
    return () => {
      if (poll) clearInterval(poll);
      if (channel) supabase.removeChannel(channel);
      if (!done.current) api.duelCancel().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mm = Math.floor(waited / 60), ss = String(waited % 60).padStart(2, "0");
  return (
    <Screen style={{ padding: space.xl, justifyContent: "center", gap: space.xl }}>
      <Stack.Screen options={{ headerShown: true, title: "Canlı 1v1" }} />
      {err ? (
        <View style={{ gap: space.lg }}>
          <T v="h2" center>{err}</T>
          {limit ? <Button title="Pro ile sınırsız oyna" onPress={() => { track("paywall_viewed", { from: "duel_limit" }); router.replace({ pathname: "/pro", params: { from: "duel" } }); }} /> : null}
          <Button title="Ana sayfa" kind="secondary" onPress={() => router.replace("/")} />
        </View>
      ) : (
        <>
          <View style={{ alignItems: "center", gap: space.md }}>
            <ActivityIndicator size="large" color={c.accent} />
            <T v="title" center>Rakip aranıyor</T>
            <T muted center>Tahmini bekleme: 1–2 dk</T>
            <T style={{ fontFamily: font.semibold, fontVariant: ["tabular-nums"] }}>{mm}:{ss}</T>
          </View>
          <T v="small" faint center>
            Aynı 5 fotoğraf, ikiniz aynı anda. Her fotoğraf için 45 saniye. Rakip bulunamazsa yapay zekâ rakip atanabilir.
          </T>
          <Button title="Vazgeç" kind="secondary" onPress={() => router.back()} />
        </>
      )}
    </Screen>
  );
}
