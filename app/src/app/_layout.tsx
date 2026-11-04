import { Fraunces_600SemiBold_Italic, Fraunces_700Bold, Fraunces_900Black } from "@expo-google-fonts/fraunces";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { track } from "../lib/analytics";
import { AppStateProvider } from "../lib/appState";
import { usePalette } from "../lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const c = usePalette();
  const scheme = useColorScheme();
  const [loaded] = useFonts({
    Fraunces_700Bold, Fraunces_900Black, Fraunces_600SemiBold_Italic,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  // Bildirime dokunulunca ilgili ekrana git
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      track("notification_opened");
      const url = r.notification.request.content.data?.path as string | undefined;
      if (url) router.push(url as never);
    });
    return () => sub.remove();
  }, []);

  if (!loaded) return null;
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
