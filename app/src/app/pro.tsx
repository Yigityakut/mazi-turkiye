import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Screen, T, success } from "../components/ui";
import { track } from "../lib/analytics";
import { useApp } from "../lib/appState";
import { LINKS, PRO_PRICE_DEMO } from "../lib/config";
import { DEMO } from "../lib/demo";
import { goBack, openLink } from "../lib/nav";
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
  const { me, setPro } = useApp();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  // Teklif (mağaza fiyatı) durumu: gelmeden sabit fiyat gösterilmez (QA O13)
  const [offer, setOffer] = useState<"loading" | "ready" | "error">(DEMO ? "ready" : "loading");
  const [busy, setBusy] = useState<"buy" | "restore" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const webOnly = Platform.OS === "web" && !DEMO;
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const loadOffer = useCallback(() => {
    if (DEMO) return;
    setOffer("loading");
    proPackage()
      .then((p) => { setPkg(p); setOffer(p ? "ready" : "error"); })
      .catch(() => setOffer("error"));
  }, []);

  useEffect(() => { track("paywall_viewed", { from: from ?? "direct" }); }, [from]);
  useEffect(() => { loadOffer(); }, [loadOffer]);

  const price = pkg?.product.priceString ?? (DEMO ? PRO_PRICE_DEMO : null);

  const buy = async () => {
    if (!pkg) { setMsg(webOnly ? "Satın alma sadece uygulamada yapılabilir." : "Mağaza bağlantısı kurulamadı. Biraz sonra tekrar dene."); return; }
    setBusy("buy");
    setMsg(null);
    try {
      if (await buyPro(pkg)) {
        track("pro_purchased", { from: from ?? "direct" });
        // Mağaza yetkisi istemcide hemen geçerli; sunucu onayı (webhook) gelene kadar appState yeniden dener
        success(); setPro();
        setMsg("Teşekkürler! Pro açıldı.");
        setTimeout(() => { if (alive.current) goBack(); }, 1200);
      } else {
        setMsg("Satın alma onay bekliyor olabilir. Onaylanınca Pro kendiliğinden açılır; açılmazsa \"Satın alımı geri yükle\"ye dokun.");
      }
    } catch (e) {
      if (!(e as { userCancelled?: boolean | null })?.userCancelled) setMsg("Satın alma tamamlanmadı.");
    } finally { setBusy(null); }
  };

  const restore = async () => {
    setBusy("restore");
    setMsg(null);
    try {
      if (await restorePro()) { track("pro_restored"); success(); setPro(); setMsg("Pro geri yüklendi."); }
      else setMsg(purchasesReady() ? "Bu hesaba ait bir Pro satın alımı bulunamadı." : webOnly ? "Satın alma sadece uygulamada yapılabilir." : "Mağaza bağlantısı kurulamadı.");
    } catch { setMsg("Geri yükleme başarısız oldu."); } finally { setBusy(null); }
  };

  return (
    <Screen>
      {/* iOS'ta sayfa kartı (modal) durum çubuğunun altında açılır; Android ve web'de tam ekran → üst güvenli alan */}
      <ScrollView contentContainerStyle={{ padding: space.xl, paddingTop: (Platform.OS === "ios" ? 0 : insets.top) + space.xl, paddingBottom: insets.bottom + space.xl, gap: space.lg }}>
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Button title="Kapat" kind="ghost" small onPress={goBack} />
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
        ) : webOnly ? (
          <Button title="Pro'yu aç" disabled accessibilityLabel="Pro'yu aç. Satın alma sadece mobil uygulamada." />
        ) : offer === "ready" && price ? (
          <Button title={`Pro'yu aç · ${price}`} onPress={buy} loading={busy === "buy"} />
        ) : offer === "loading" ? (
          <Button title="Fiyat yükleniyor…" disabled />
        ) : (
          <View style={{ gap: space.sm }}>
            <T center muted>Mağaza bağlantısı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.</T>
            <Button title="Tekrar dene" onPress={loadOffer} />
          </View>
        )}
        {webOnly ? <T v="small" muted center>Satın alma ve geri yükleme sadece iOS ve Android uygulamasında yapılabilir.</T> : null}
        <Button title="Satın alımı geri yükle" kind="secondary" onPress={restore} loading={busy === "restore"} />
        {msg ? <T center accessibilityLiveRegion="polite" style={{ fontFamily: font.semibold }}>{msg}</T> : null}
        <T v="caption" faint center>
          Tek seferlik, tüketilmeyen satın alım. İadeler {Platform.OS === "ios" ? "App Store" : "Google Play"} üzerinden yapılır.{" "}
          <T v="caption" faint style={{ textDecorationLine: "underline" }} accessibilityRole="link" onPress={() => openLink(LINKS.terms)}>Kullanım koşulları</T>
          {" · "}
          <T v="caption" faint style={{ textDecorationLine: "underline" }} accessibilityRole="link" onPress={() => openLink(LINKS.privacy)}>Gizlilik</T>
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
