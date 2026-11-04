import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TurkeyMap } from "../components/TurkeyMap";
import { Button, Screen, T } from "../components/ui";
import { track } from "../lib/analytics";
import { prefs } from "../lib/prefs";
import { font, radius, space, usePalette } from "../lib/theme";

const CODE = /([A-HJ-NP-Z2-9]{6})/;

/**
 * En fazla 3 adım. Oyunu anlatmak yerine ilk fotoğrafa yönlendirir.
 * Son adımda, linkle gelen ama app'i yeni kuran kişi için "Meydan okuma kodun var mı?" sorulur (ertelenmiş derin link).
 */
export default function Onboarding() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [code, setCode] = useState("");

  const finish = async (withCode?: string) => {
    await prefs.setOnboarded();
    track("onboarding_completed", { with_code: !!withCode });
    if (withCode) {
      // challenge_opened meydan okuma ekranında, kod geçerliyse gönderilir (QA D12)
      router.replace({ pathname: "/challenge/[code]", params: { code: withCode, source: "deferred" } });
    } else {
      router.replace("/play");
    }
  };

  const paste = async () => {
    try {
      const t = (await Clipboard.getStringAsync()).toUpperCase();
      const m = t.match(CODE);
      if (m) setCode(m[1]);
    } catch {} // pano izni reddedildi veya boş
  };

  return (
    <Screen style={{ paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.lg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {step === 0 && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.page}>
            <View style={{ gap: space.md }}>
              <T v="label" color={c.accent}>Mazi Türkiye</T>
              <T v="display">Her gün 5 fotoğraf. Türkiye'nin bir köşesi, bir yılı.</T>
              <T muted style={{ fontSize: 17, lineHeight: 25 }}>
                Fotoğrafın nerede ve hangi yıl çekildiğini tahmin et. 1880'lerden bugüne, Edirne'den Hakkâri'ye.
              </T>
            </View>
            <View style={[styles.mapBox, { borderColor: c.line }]} accessible accessibilityRole="image" accessibilityLabel="Türkiye haritası üzerinde örnek tahmin iğneleri">
              <TurkeyMap interactive={false} compact pins={[
                { id: "1", at: { lat: 41.0256, lng: 28.9744 }, kind: "answer" },
                { id: "2", at: { lat: 38.4192, lng: 27.1287 }, kind: "guess" },
                { id: "3", at: { lat: 39.92, lng: 32.85 }, kind: "opponent" },
              ]} />
            </View>
            <Button title="Nasıl oynanır?" onPress={() => setStep(1)} />
          </Animated.View>
        )}
        {step === 1 && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.page}>
            <View style={{ gap: space.lg }}>
              <T v="title">Üç dokunuş</T>
              <Rule n="1" title="Fotoğrafa bak" body="Tabelalar, arabalar, kıyafetler, binalar… Her ayrıntı bir ipucu. Dokunup yakınlaştırabilirsin." />
              <Rule n="2" title="Haritaya iğne bırak" body="Ne kadar yakınsan o kadar puan. 500 puan konum için." />
              <Rule n="3" title="Yılı seç" body="Tam yıl 500 puan. Her fotoğraf en çok 1.000, gün 5.000 puan." />
            </View>
            <Button title="Devam" onPress={() => setStep(2)} />
          </Animated.View>
        )}
        {step === 2 && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.page}>
            <View style={{ gap: space.md }}>
              <T v="title">Meydan okuma kodun var mı?</T>
              <T muted>Bir arkadaşın sana link gönderdiyse, sayfadaki 6 haneli kodu gir. Aynı 5 fotoğrafı oynayıp skorlarınızı karşılaştırın.</T>
              <TextInput
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                placeholder="ÖRN. K7M2QX"
                placeholderTextColor={c.inkFaint}
                autoCapitalize="characters"
                autoCorrect={false}
                accessibilityLabel="Meydan okuma kodu"
                style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.surface, fontFamily: font.display }]}
              />
              <Button title="Panodan yapıştır" kind="secondary" small onPress={paste} />
            </View>
            <View style={{ gap: space.sm }}>
              <Button title={code.length === 6 ? "Meydan okumayı aç" : "İlk fotoğrafı oyna"} onPress={() => finish(code.length === 6 ? code : undefined)} />
              {code.length === 6 ? <Button title="Kod olmadan başla" kind="ghost" onPress={() => finish()} /> : null}
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Rule({ n, title, body }: { n: string; title: string; body: string }) {
  const c = usePalette();
  return (
    <View style={{ flexDirection: "row", gap: space.md }}>
      <View style={[styles.num, { backgroundColor: c.accentSoft }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden><T v="h2" color={c.accentOnSoft}>{n}</T></View>
      <View style={{ flex: 1, gap: 2 }}>
        <T style={{ fontFamily: font.semibold, fontSize: 17 }}>{title}</T>
        <T muted>{body}</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: space.xl, justifyContent: "space-between", gap: space.xl },
  mapBox: { height: 220, borderRadius: radius.lg, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth },
  num: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  input: { height: 64, borderRadius: radius.md, borderWidth: 1, fontSize: 28, letterSpacing: 6, textAlign: "center" },
});
