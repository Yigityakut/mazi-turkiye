import { router, Stack } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Button, Screen, T } from "../components/ui";
import { font, radius, space, usePalette } from "../lib/theme";

export default function EnterCode() {
  const c = usePalette();
  const [code, setCode] = useState("");
  return (
    <Screen style={{ padding: space.xl, gap: space.lg }}>
      <Stack.Screen options={{ headerShown: true, title: "Meydan okuma kodu" }} />
      <T muted>Arkadaşının gönderdiği linkteki 6 haneli kodu gir.</T>
      <TextInput
        value={code} autoFocus autoCapitalize="characters" autoCorrect={false} accessibilityLabel="Meydan okuma kodu"
        onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
        placeholder="K7M2QX" placeholderTextColor={c.inkFaint}
        style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.surface, fontFamily: font.display }]}
      />
      <View style={{ flex: 1 }} />
      <Button title="Aç" disabled={code.length !== 6} onPress={() => router.replace(`/challenge/${code}`)} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  input: { height: 64, borderRadius: radius.md, borderWidth: 1, fontSize: 28, letterSpacing: 6, textAlign: "center" },
});
