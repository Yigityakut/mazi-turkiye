import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Button, Loading, Screen, T } from "../../components/ui";
import { api } from "../../lib/api";
import { errorText } from "../../lib/format";
import { space } from "../../lib/theme";

/** Admin'in Telegram linki: https://maziturkiye.com/d/<token> → bekleyen maça doğrudan bağlan. */
export default function AdminJoin() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    api.duelAdminJoin(token)
      .then((r) => {
        if (r.status === "matched" && r.duel_id) router.replace(`/duel/${r.duel_id}`);
        else setMsg("Oyuncu artık beklemiyor; başka biriyle veya botla eşleşti.");
      })
      .catch((e) => setMsg(String(e).includes("not_admin") ? "Bu link sadece admin hesabı içindir." : errorText(e)));
  }, [token]);
  if (!msg) return <Loading label="Maça bağlanılıyor" />;
  return (
    <Screen style={{ padding: space.xl, justifyContent: "center", gap: space.lg }}>
      <T v="h2" center>{msg}</T>
      <Button title="Ana sayfa" onPress={() => router.replace("/")} />
    </Screen>
  );
}
