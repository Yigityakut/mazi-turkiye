import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";

/**
 * Geri git; geri yığını yoksa ana sayfaya dön. Uygulama kapalıyken bir linkle (meydan okuma, bildirim) açıldığında
 * yığında sadece o ekran olur ve `router.back()` hiçbir şey yapmaz (QA O3).
 */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

/** Uygulama içi tarayıcıda açar; açılamazsa sistem tarayıcısına düşer. Hiçbir zaman reddedilen promise bırakmaz. */
export function openLink(url: string) {
  WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => {}));
}

/** mailto: açılamazsa (cihazda e-posta uygulaması yok) yedek sayfayı açar. */
export function openMail(mailto: string, fallbackUrl: string) {
  Linking.openURL(mailto).catch(() => openLink(fallbackUrl));
}
