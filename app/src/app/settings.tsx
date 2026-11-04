import * as Application from "expo-application";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from "react-native";
import { Button, Card, Screen, T } from "../components/ui";
import { resetAnalytics, track } from "../lib/analytics";
import { api } from "../lib/api";
import { useApp } from "../lib/appState";
import { appleAvailable, googleConfigured, signInWithApple, signInWithGoogle } from "../lib/auth";
import { LINKS, SUPPORT_EMAIL } from "../lib/config";
import { errorText } from "../lib/format";
import { reminderTime, scheduleDailyReminder } from "../lib/notifications";
import { prefs } from "../lib/prefs";
import { supabase } from "../lib/supabase";
import { font, radius, space, usePalette } from "../lib/theme";

const HOURS = [9, 12, 15, 18, 20, 21, 22, 23];

export default function Settings() {
  const c = usePalette();
  const { me, refresh } = useApp();
  const [nick, setNick] = useState(me?.nickname ?? "");
  const [savedNick, setSavedNick] = useState(false);
  const [hour, setHour] = useState<number | null>(null);
  const [auto, setAuto] = useState<string>("");
  const [email, setEmail] = useState<string | null>(null);
  const [apple, setApple] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    prefs.reminderOverride().then(setHour);
    reminderTime().then((t) => setAuto(`${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`));
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.is_anonymous ? null : data.user?.email ?? "Bağlı hesap"));
    appleAvailable().then(setApple);
  }, []);

  const saveNick = async () => {
    try { await api.updateProfile({ nickname: nick.trim() || null }); setSavedNick(true); setErr(null); refresh(); }
    catch (e) { setErr(errorText(e)); }
  };
  const pickHour = async (h: number | null) => {
    setHour(h);
    await prefs.setReminderOverride(h);
    if (me) scheduleDailyReminder(!!me.today_result, me.streak.current);
  };
  const signIn = async (fn: () => Promise<void>) => {
    try { await fn(); await refresh(); const { data } = await supabase.auth.getUser(); setEmail(data.user?.email ?? "Bağlı hesap"); }
    catch (e) { if (!/cancel/i.test(String(e))) setErr(errorText(e)); }
  };
  const deleteAccount = () => {
    const run = async () => {
      try {
        await api.deleteAccount();
        track("account_deleted");
        resetAnalytics();
        await prefs.setOnboarded();
        router.replace("/");
        setTimeout(refresh, 500);
      } catch (e) { setErr(errorText(e)); }
    };
    if (Platform.OS === "web") { run(); return; }
    Alert.alert("Hesabı sil", "Skorların, serin, istatistiklerin ve sıralamadaki yerin kalıcı olarak silinir. Pro satın alımın mağaza hesabında kalır ve geri yüklenebilir.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Kalıcı olarak sil", style: "destructive", onPress: run },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xxl }}>
        <Section title="Takma ad">
          <T v="small" muted>Sıralamada ve meydan okumalarda görünür.</T>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <TextInput
              value={nick} onChangeText={(t) => { setNick(t); setSavedNick(false); }} maxLength={20} placeholder="Takma ad" placeholderTextColor={c.inkFaint}
              accessibilityLabel="Takma ad" style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.bg, fontFamily: font.body }]}
            />
            <Button title={savedNick ? "✓" : "Kaydet"} small onPress={saveNick} />
          </View>
          <Row label="Sıralamada görün">
            <Switch value={me?.show_on_leaderboard ?? true} onValueChange={async (v) => { await api.updateProfile({ show_on_leaderboard: v }); refresh(); }}
              trackColor={{ true: c.accent }} accessibilityLabel="Sıralamada görün" />
          </Row>
        </Section>

        <Section title="Günlük hatırlatıcı">
          <T v="small" muted>Günü bitirmediysen tek bir bildirim gelir. Otomatik saat, son 7 günde oynamaya başladığın saatlerin ortası ({auto}).</T>
          <View style={styles.chips}>
            <Chip label="Otomatik" active={hour == null} onPress={() => pickHour(null)} />
            {HOURS.map((h) => <Chip key={h} label={`${h}:00`} active={hour === h} onPress={() => pickHour(h)} />)}
          </View>
        </Section>

        <Section title="Hesap">
          {email ? (
            <T>Giriş yapıldı: <T style={{ fontFamily: font.semibold }}>{email}</T></T>
          ) : (
            <>
              <T v="small" muted>Günlük oyun için gerekmez. 1v1'de adınla görünmek ve cihaz değiştirdiğinde skorlarını korumak için giriş yap.</T>
              {apple ? <Button title=" Apple ile giriş yap" kind="secondary" onPress={() => signIn(signInWithApple)} /> : null}
              {googleConfigured() && Platform.OS !== "web" ? <Button title="Google ile giriş yap" kind="secondary" onPress={() => signIn(signInWithGoogle)} /> : null}
            </>
          )}
          {!me?.is_pro ? <Button title="Pro'ya göz at" kind="secondary" onPress={() => router.push({ pathname: "/pro", params: { from: "settings" } })} /> : null}
          <Button title="Hesabı sil" kind="danger" onPress={deleteAccount} />
        </Section>

        <Section title="Hakkında">
          <LinkRow label="Kaynaklar ve lisanslar" onPress={() => router.push("/sources")} />
          <LinkRow label="Gizlilik politikası" onPress={() => WebBrowser.openBrowserAsync(LINKS.privacy)} />
          <LinkRow label="KVKK aydınlatma metni" onPress={() => WebBrowser.openBrowserAsync(LINKS.kvkk)} />
          <LinkRow label="Kullanım koşulları" onPress={() => WebBrowser.openBrowserAsync(LINKS.terms)} />
          <LinkRow label="Destek" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Mazi%20T%C3%BCrkiye%20destek`)} />
        </Section>
        {err ? <T color={c.bad} center>{err}</T> : null}
        <T v="caption" faint center>Sürüm {Application.nativeApplicationVersion ?? "1.0.0"} ({Application.nativeBuildVersion ?? "web"}) · Kimlik {me?.id.slice(0, 8)}</T>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card style={{ gap: space.md }}>
      <T v="label" muted>{title}</T>
      {children}
    </Card>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}><T>{label}</T>{children}</View>;
}
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const c = usePalette();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress}
      style={[styles.chip, { borderColor: active ? c.accent : c.line, backgroundColor: active ? c.accentSoft : "transparent" }]}>
      <T v="small" style={{ fontFamily: font.semibold }} color={active ? c.accent : c.inkMuted}>{label}</T>
    </Pressable>
  );
}
function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <T>{label}</T><T muted>›</T>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  input: { flex: 1, height: 44, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: space.md, fontSize: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, minHeight: 36, justifyContent: "center" },
});
