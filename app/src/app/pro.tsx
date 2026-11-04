import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Platform, ScrollView, StyleSheet, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Screen, T, success } from "../components/ui";
import { track } from "../lib/analytics";
import { useApp } from "../lib/appState";
import { LINKS, PRO_PRICE_FALLBACK } from "../lib/config";
import { buyPro, proPackage, purchasesReady, restorePro } from "../lib/purchases";
import { font, radius, space, usePalette } from "../lib/theme";

const FEATURES: [string, string, string][] = [
  ["Günlük 5 fotoğraf", "✓", "✓"],
  ["İpuçları: dönem ve bölge", "–", "✓"],
  ["Canlı 1v1", "Günde 3", "Sınırsız"],
  ["Geçmiş günlerin arşivi", "–", "✓"],
  ["Dönem ve bölge istatistiği", "Temel", "Tam"],
  ["Seri koruyucu (ayda 1 gün)", "–", "✓"],
];

/** Pro: tek seferlik ödeme, abonelik yok. Sadece doğal anlarda açılır (ipucu, arşiv, 3. maç). */
export default function Pro() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { me, setPro, refresh } = useApp();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [busy, setBusy] = useState<"buy" | "restore" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    track("paywall_viewed", { from: from ?? "direct" });
    proPackage().then(setPkg).catch(() => {});
  }, [from]);

  const price = pkg?.product.priceString ?? PRO_PRICE_FALLBACK;

  const buy = async () => {
    if (!pkg) { setMsg(Platform.OS === "web" ? "Satın alma sadece uygulamada yapılabilir." : "Mağaza bağlantısı kurulamadı. Biraz sonra tekrar dene."); return; }
    setBusy("buy");
    try {
      if (await buyPro(pkg)) {
        track("pro_purchased", { from: from ?? "direct" });
        success(); setPro(); setTimeout(refresh, 3000);
        setMsg("Teşekkürler! Pro açıldı.");
        setTimeout(() => router.back(), 1200);
      }
    } catch (e) {
      if (!String((e as { userCancelled?: boolean })?.userCancelled ?? "").includes("true")) setMsg("Satın alma tamamlanmadı.");
    } finally { setBusy(null); }
  };

  const restore = async () => {
    setBusy("restore");
    try {
      if (await restorePro()) { track("pro_restored"); setPro(); setMsg("Pro geri yüklendi."); setTimeout(refresh, 3000); }
      else setMsg(purchasesReady() ? "Bu hesaba ait bir Pro satın alımı bulunamadı." : "Mağaza bağlantısı kurulamadı.");
    } catch { setMsg("Geri yükleme başarısız oldu."); } finally { setBusy(null); }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.xl, paddingBottom: insets.bottom + space.xl, gap: space.lg }}>
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Button title="Kapat" kind="ghost" small onPress={() => router.back()} />
        </View>
        <T v="label" color={c.accent}>Mazi Türkiye Pro</T>
        <T v="display" style={{ fontSize: 36, lineHeight: 40 }}>Bir kere öde, hep senin.</T>
        <T muted style={{ fontSize: 17, lineHeight: 25 }}>Abonelik yok. Günlük oyun herkese ücretsiz kalır; Pro daha fazlasını açar.</T>

        <View style={[styles.table, { borderColor: c.line, backgroundColor: c.surface }]}>
          <View style={[styles.tr, { borderColor: c.line }]}>
            <T v="label" muted style={{ flex: 1 }}> </T>
            <T v="label" muted style={styles.col}>Ücretsiz</T>
            <T v="label" color={c.accent} style={styles.col}>Pro</T>
          </View>
          {FEATURES.map(([f, a, b], i) => (
            <View key={f} style={[styles.tr, { borderColor: c.line, borderBottomWidth: i === FEATURES.length - 1 ? 0 : StyleSheet.hairlineWidth }]}>
              <T v="small" style={{ flex: 1, fontFamily: font.medium }}>{f}</T>
              <T v="small" muted style={styles.col}>{a}</T>
              <T v="small" style={[styles.col, { fontFamily: font.semibold }]}>{b}</T>
            </View>
          ))}
        </View>
        <T v="caption" muted>İpucu kullanılan bölümün en yüksek puanı %30 düşer ve sıralamada 💡 ile işaretlenir.</T>

        {me?.is_pro ? (
          <Button title="Pro zaten açık ✓" disabled />
        ) : (
          <Button title={`Pro'yu aç · ${price}`} onPress={buy} loading={busy === "buy"} />
        )}
        <Button title="Satın alımı geri yükle" kind="secondary" onPress={restore} loading={busy === "restore"} />
        {msg ? <T center style={{ fontFamily: font.semibold }}>{msg}</T> : null}
        <T v="caption" faint center>
          Tek seferlik, tüketilmeyen satın alım. İadeler {Platform.OS === "ios" ? "App Store" : "Google Play"} üzerinden yapılır.{" "}
          <T v="caption" faint style={{ textDecorationLine: "underline" }} onPress={() => Linking.openURL(LINKS.terms)}>Kullanım koşulları</T>
          {" · "}
          <T v="caption" faint style={{ textDecorationLine: "underline" }} onPress={() => Linking.openURL(LINKS.privacy)}>Gizlilik</T>
        </T>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  table: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  tr: { flexDirection: "row", alignItems: "center", paddingHorizontal: space.md, minHeight: 46, borderBottomWidth: StyleSheet.hairlineWidth },
  col: { width: 74, textAlign: "center" },
});
