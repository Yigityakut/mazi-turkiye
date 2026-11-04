import { router, Stack } from "expo-router";
import { Button, Screen, T } from "../components/ui";
import { space } from "../lib/theme";

export default function NotFound() {
  return (
    <Screen style={{ padding: space.xl, justifyContent: "center", gap: space.lg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <T v="title" center>Bu sayfa arşivde yok</T>
      <Button title="Ana sayfa" onPress={() => router.replace("/")} />
    </Screen>
  );
}
