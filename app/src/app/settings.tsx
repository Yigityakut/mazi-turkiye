import * as AppleAuthentication from "expo-apple-authentication";
import * as Application from "expo-application";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, useColorScheme, View } from "react-native";
import { Button, Card, Screen, T } from "../components/ui";
import { track } from "../lib/analytics";
import { api } from "../lib/api";
import { useApp } from "../lib/appState";
import {
  appleAuthorizationCode, appleAvailable, googleConfigured, hasAppleIdentity, isCancel, signInWithApple, signInWithGoogle,
} from "../lib/auth";
import { LINKS, SUPPORT_EMAIL } from "../lib/config";
import { ERRORS, errorText } from "../lib/format";
import { openLink, openMail } from "../lib/nav";
import { isOffensiveNickname } from "../lib/nickname";
import { reminderTime, scheduleDailyReminder } from "../lib/notifications";
import { prefs } from "../lib/prefs";
import { supabase } from "../lib/supabase";
import { font, radius, space, usePalette } from "../lib/theme";

const HOURS = [9, 12, 15, 18, 20, 21, 22, 23];

export default function Settings() {
  const c = usePalette();
  const scheme = useColorScheme();
  const { me, refresh } = useApp();
  const [nick, setNick] = useState(me?.nickname ?? "");
  const [savedNick, setSavedNick] = useState(false);
  const [hour, setHour] = useState<number | null>(null);
  const [auto, setAuto] = useState<string>("");
  const [email, setEmail] = useState<string | null>(null);
  const [apple, setApple] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const signingIn = useRef(false);

  /** Hesap bilgisi yerel oturumdan okunur (internet yokken de doğru gösterir). */
  const loadAccount = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      setEmail(!u || u.is_anonymous ? null : u.email ?? "Bağlı hesap");
    } catch {}
  }, []);

  useEffect(() => {
    prefs.reminderOverride().then(setHour);
    reminderTime().then((t) => setAuto(`${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`)).catch(() => {});
    loadAccount();
    appleAvailable().then(setApple);
  }, [loadAccount]);

  const saveNick = async () => {
    const n = nick.trim();
    // Küfür/hakaret süzgeci: önce istemcide (anında geri bildirim), aynısı sunucuda da var (update_profile → bad_nickname_word, QA O7)
    if (n && isOffensiveNickname(n)) { setErr(ERRORS.bad_nickname_word); setSavedNick(false); return; }
    try { await api.updateProfile({ nickname: n || null }); setSavedNick(true); setErr(null); refresh(); }
    catch (e) { setErr(errorText(e)); }
  };
  const pickHour = async (h: number | null) => {
    setHour(h);
    await prefs.setReminderOverride(h);
    if (me) scheduleDailyReminder(!!me.today_result, me.streak.current, me.next_rollover).catch(() => {});
  };
  const setVisible = async (v: boolean) => {
    try { await api.updateProfile({ show_on_leaderboard: v }); setErr(null); refresh(); }
    catch (e) { setErr(errorText(e)); }
  };
  const signIn = async (fn: () => Promise<void>) => {
    if (signingIn.current) return;
    signingIn.current = true;
    setErr(null);
    try { await fn(); await refresh(); await loadAccount(); }
    catch (e) { if (!isCancel(e)) setErr(errorText(e)); }
    finally { signingIn.current = false; }
  };

  const runDelete = async (appleCode: string | null) => {
    setDeleting(true);
    setErr(null);
    try {
      await api.deleteAccount(appleCode);
      track("account_deleted", { apple_revoked: !!appleCode });
      // Oturum kapanınca (SIGNED_OUT) appState eski veriyi temizler, PostHog/RevenueCat kimliğini sıfırlar ve yeni anonim oturum açar
      await prefs.setOnboarded();
      router.replace("/");
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setDeleting(false);
    }
  };

  /** Apple ile bağlı hesapta önce Apple'dan taze yetki kodu alınır; token'ı sunucu iptal eder (App Store 5.1.1(v)). */
  const deleteWithAppleRevoke = async () => {
    if (!apple || !(await hasAppleIdentity().catch(() => false))) return runDelete(null);
    try {
      const code = await appleAuthorizationCode();
      return runDelete(code);
    } catch {
      // Vazgeçti veya Apple doğrulaması başarısız: hesap yine de silinebilir, Apple bağlantısı elle kaldırılır
      Alert.alert(
        "Apple doğrulaması yapılmadı",
        "Hesabın yine de silinebilir. Apple ile Giriş bağlantısını iPhone Ayarlar'ında adına dokunup \"Apple ile Giriş\" bölümünden kaldırabilirsin.",
        [
          { text: "Vazgeç", style: "cancel" },
          { text: "Yine de sil", style: "destructive", onPress: () => { void runDelete(null); } },
        ],
      );
    }
  };

  const deleteAccount = () => {
    if (deleting) return;
    if (Platform.OS === "web") { void runDelete(null); return; }
    Alert.alert("Hesabı sil", "Skorların, serin, istatistiklerin ve sıralamadaki yerin kalıcı olarak silinir. Pro satın alımın mağaza hesabında kalır ve geri yüklenebilir.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Kalıcı olarak sil", style: "destructive", onPress: () => { void deleteWithAppleRevoke(); } },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: space.xxl }} keyboardShouldPersistTaps="handled">
        <Section title="Takma ad">
          <T v="small" muted>Sıralamada ve meydan okumalarda görünür. Kaba veya başkasını hedef alan adlar kabul edilmez.</T>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <TextInput
              value={nick} onChangeText={(t) => { setNick(t); setSavedNick(false); }} maxLength={20} placeholder="Takma ad" placeholderTextColor={c.inkFaint}
              accessibilityLabel="Takma ad" autoCorrect={false}
              style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.bg, fontFamily: font.body }]}
            />
            <Button title={savedNick ? "✓" : "Kaydet"} accessibilityLabel={savedNick ? "Takma ad kaydedildi" : "Takma adı kaydet"} small onPress={saveNick} />
          </View>
          <Row label="Sıralamada görün">
            <Switch value={me?.show_on_leaderboard ?? true} onValueChange={setVisible}
              trackColor={{ true: c.accent }} accessibilityLabel="Sıralamada görün" />
          </Row>
        </Section>

        <Section title="Günlük hatırlatıcı">
          <T v="small" muted>Günü bitirmediysen tek bir bildirim gelir. Otomatik saat, son 7 günde oynamaya başladığın saatlerin ortası ({auto}).</T>
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Hatırlatıcı saati">
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
              {apple ? (
                // Apple'ın resmi düğmesi (HIG, App Store 4.8): renk ve köşe yarıçapı sadece bu özelliklerle ayarlanır
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={scheme === "dark" ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={27}
                  style={styles.appleBtn}
                  onPress={() => signIn(signInWithApple)}
                />
              ) : null}
              {googleConfigured() ? <Button title="Google ile giriş yap" kind="secondary" onPress={() => signIn(signInWithGoogle)} /> : null}
            </>
          )}
          {!me?.is_pro ? <Button title="Pro'ya göz at" kind="secondary" onPress={() => router.push({ pathname: "/pro", params: { from: "settings" } })} /> : null}
          <Button title={deleting ? "Hesap siliniyor…" : "Hesabı sil"} kind="danger" loading={deleting} onPress={deleteAccount} />
        </Section>

        <Section title="Hakkında">
          <LinkRow label="Kaynaklar ve lisanslar" onPress={() => router.push("/sources")} />
          <LinkRow label="Gizlilik politikası" onPress={() => openLink(LINKS.privacy)} />
          <LinkRow label="KVKK aydınlatma metni" onPress={() => openLink(LINKS.kvkk)} />
          <LinkRow label="Kullanım koşulları" onPress={() => openLink(LINKS.terms)} />
          <LinkRow label="Destek" onPress={() => openMail(`mailto:${SUPPORT_EMAIL}?subject=Mazi%20T%C3%BCrkiye%20destek`, LINKS.support)} />
        </Section>
        {err ? <T color={c.bad} center accessibilityRole="alert">{err}</T> : null}
        <T v="caption" faint center>Sürüm {Application.nativeApplicationVersion ?? "1.0.0"} ({Application.nativeBuildVersion ?? "web"}) · Kimlik {me?.id.slice(0, 8)}</T>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card style={{ gap: space.md }}>
      <T v="label" muted accessibilityRole="header">{title}</T>
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
    <Pressable accessibilityRole="radio" accessibilityLabel={label === "Otomatik" ? "Otomatik saat" : `Saat ${label}`}
      accessibilityState={{ selected: active, checked: active }} onPress={onPress} hitSlop={{ top: 4, bottom: 4 }}
      style={[styles.chip, { borderColor: active ? c.accent : c.line, backgroundColor: active ? c.accentSoft : "transparent" }]}>
      <T v="small" style={{ fontFamily: font.semibold }} color={active ? c.accentOnSoft : c.inkMuted}>{label}</T>
    </Pressable>
  );
}
function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={label} onPress={onPress} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <T>{label}</T><T muted>›</T>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  input: { flex: 1, height: 44, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: space.md, fontSize: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, minHeight: 36, justifyContent: "center" },
  appleBtn: { height: 54, width: "100%" },
});
