import { useCallback, useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { Attribution } from "../components/Reveal";
import { ErrorState, Loading, Screen, T } from "../components/ui";
import { api } from "../lib/api";
import { LINKS } from "../lib/config";
import { errorText } from "../lib/format";
import { openLink } from "../lib/nav";
import { space, usePalette } from "../lib/theme";
import type { Source } from "../lib/types";

/** Yayınlanmış her fotoğrafın eser sahibi, kaynağı ve lisansı (CC BY / BY-SA bunu zorunlu kılar). */
export default function Sources() {
  const c = usePalette();
  const [rows, setRows] = useState<Source[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => {
    setErr(null); // QA O1
    api.sources().then(setRows).catch((e) => setErr(errorText(e)));
  }, []);
  useEffect(load, [load]);
  if (err) return <ErrorState message={err} onRetry={load} />;
  if (!rows) return <Loading />;
  return (
    <Screen>
      <FlatList
        data={rows}
        keyExtractor={(r) => `${r.day}-${r.slot}`}
        contentContainerStyle={{ padding: space.lg, gap: space.md }}
        ListHeaderComponent={
          <View style={{ gap: space.sm, marginBottom: space.md }}>
            <T muted>Fotoğraflar kamu malı veya ticari kullanıma izin veren açık lisanslı (CC0, CC BY, CC BY-SA) arşivlerden alınır. Bugünün fotoğrafları gün bitince burada listelenir.</T>
            <T v="small" color={c.accent} accessibilityRole="link" onPress={() => openLink(LINKS.sources)} style={{ textDecorationLine: "underline" }}>Tam liste web'de</T>
          </View>
        }
        ListEmptyComponent={<T muted center>Liste ilk günden sonra dolmaya başlar.</T>}
        renderItem={({ item }) => (
          <View style={{ gap: 2, borderBottomWidth: 0.5, borderColor: c.line, paddingBottom: space.md }}>
            <T v="small" muted>#{item.number} · {item.slot}. fotoğraf</T>
            <T>{item.title ?? item.location_name}, {item.year}</T>
            <Attribution answer={item} />
          </View>
        )}
      />
    </Screen>
  );
}
