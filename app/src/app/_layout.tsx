import { Fraunces_600SemiBold_Italic, Fraunces_700Bold, Fraunces_900Black } from "@expo-google-fonts/fraunces";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { router, Stack, type ErrorBoundaryProps } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import { useEffect, useRef } from "react";
import { Platform, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Button, ErrorState } from "../components/ui";
import { captureException, track } from "../lib/analytics";
import { AppStateProvider } from "../lib/appState";
import { usePalette } from "../lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Bildirim verisindeki adres → uygulama içi yol. Sunucu ve yerel bildirim `url` gönderir (eski sürüm `path`). */
function notificationPath(data: unknown): string | null {
  const d = (data ?? {}) as { url?: unknown; path?: unknown };
  const raw = typeof d.path === "string" ? d.path : typeof d.url === "string" ? d.url : null;
  if (!raw) return null;
  const p = raw.replace(/^maziturkiye:\/\//, "/").replace(/^https?:\/\/[^/]+/, "").replace(/^\/+/, "/");
  return p.startsWith("/") ? p : `/${p}`;
}

export default function RootLayout() {
  const c = usePalette();
  const scheme = useColorScheme();
  const [loaded, fontError] = useFonts({
    Fraunces_700Bold, Fraunces_900Black, Fraunces_600SemiBold_Italic,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });
  // Font yüklenemezse sistem fontuyla devam et; splash'te takılı kalma (QA D18)
  const ready = loaded || !!fontError;
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const pendingPath = useRef<string | null>(null);

  useEffect(() => {
    if (fontError) captureException(fontError, { source: "fonts" });
    if (ready) SplashScreen.hideAsync().catch(() => {});
    if (ready && pendingPath.current) {
      const p = pendingPath.current;
      pendingPath.current = null;
      setTimeout(() => { try { router.navigate(p as never); } catch {} }, 0);
    }
  }, [ready, fontError]);

  // Bildirime dokunulunca ilgili ekrana git. Uygulamayı bildirim açtıysa (soğuk açılış) son yanıt da okunur.
  useEffect(() => {
    if (Platform.OS === "web") return;
    const seen = new Set<string>();
    const handle = (r: Notifications.NotificationResponse | null) => {
      if (!r) return;
      const key = `${r.notification.request.identifier}:${r.notification.date}`;
      if (seen.has(key)) return;
      seen.add(key);
      track("notification_opened");
      const path = notificationPath(r.notification.request.content.data);
      if (!path || path === "/") return; // ana ekran zaten açılış ekranı
      if (readyRef.current) { try { router.navigate(path as never); } catch {} }
      else pendingPath.current = path;
    };
    Notifications.getLastNotificationResponseAsync().then(handle).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, []);

  if (!ready) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.bg }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: c.bg },
              headerStyle: { backgroundColor: c.bg },
              headerTintColor: c.ink,
              headerShadowVisible: false,
              headerTitleStyle: { fontFamily: "Fraunces_700Bold" },
              headerBackButtonDisplayMode: "minimal",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="play" options={{ gestureEnabled: false }} />
            <Stack.Screen name="summary" options={{ gestureEnabled: false }} />
            <Stack.Screen name="pro" options={{ presentation: "modal" }} />
            <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: "fade" }} />
            <Stack.Screen name="duel/[id]" options={{ gestureEnabled: false }} />
            <Stack.Screen name="leaderboard" options={{ headerShown: true, title: "Sıralama" }} />
            <Stack.Screen name="stats" options={{ headerShown: true, title: "İstatistik" }} />
            <Stack.Screen name="archive" options={{ headerShown: true, title: "Arşiv" }} />
            <Stack.Screen name="settings" options={{ headerShown: true, title: "Ayarlar" }} />
            <Stack.Screen name="sources" options={{ headerShown: true, title: "Kaynaklar ve lisanslar" }} />
          </Stack>
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Render hatası: uygulama kapanmaz, hata PostHog'a gider (Plan 7.3, QA Y3). Kişisel veri eklenmez.
 * "Tekrar dene" aynı ekranı yeniden çizer; "Yeniden başlat" JS paketini baştan yükler (ana ekran).
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    captureException(error, { source: "error_boundary" });
  }, [error]);
  const restart = () => {
    if (Platform.OS === "web") { globalThis.location?.assign("/"); return; }
    Updates.reloadAsync().catch(() => { retry().catch(() => {}); });
  };
  return (
    <ErrorState
      title="Beklenmeyen bir hata oldu"
      message="Bu ekranda bir sorun çıktı. Tekrar deneyebilir veya uygulamayı yeniden başlatabilirsin."
      onRetry={() => { retry().catch(() => {}); }}
    >
      <Button title="Uygulamayı yeniden başlat" kind="ghost" onPress={restart} />
    </ErrorState>
  );
}
