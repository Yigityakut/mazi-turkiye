import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from "react-native";
import { isNetworkText } from "../lib/format";
import { font, radius, space, usePalette } from "../lib/theme";

export const tap = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  if (Platform.OS !== "web") Haptics.impactAsync(style).catch(() => {});
};
export const success = () => {
  if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

type TVariant = "display" | "title" | "h2" | "body" | "small" | "label" | "number" | "caption";
export function T({ v = "body", muted, faint, color, center, style, children, ...rest }:
  TextProps & { v?: TVariant; muted?: boolean; faint?: boolean; color?: string; center?: boolean; children?: ReactNode }) {
  const c = usePalette();
  const base: Record<TVariant, TextStyle> = {
    display: { fontFamily: font.displayBlack, fontSize: 40, lineHeight: 44, letterSpacing: -0.5 },
    title: { fontFamily: font.display, fontSize: 28, lineHeight: 33, letterSpacing: -0.3 },
    h2: { fontFamily: font.display, fontSize: 20, lineHeight: 26 },
    body: { fontFamily: font.body, fontSize: 16, lineHeight: 23 },
    small: { fontFamily: font.body, fontSize: 14, lineHeight: 20 },
    label: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 1.1, textTransform: "uppercase" },
    number: { fontFamily: font.displayBlack, fontSize: 32, lineHeight: 36, fontVariant: ["tabular-nums"] },
    caption: { fontFamily: font.body, fontSize: 12, lineHeight: 16 },
  };
  return (
    <Text
      {...rest}
      style={[base[v], { color: color ?? (faint ? c.inkFaint : muted ? c.inkMuted : c.ink) }, center && { textAlign: "center" }, style]}
    >
      {children}
    </Text>
  );
}

export function Button({ title, onPress, kind = "primary", icon, loading, disabled, style, small, accessibilityLabel, maxFontSizeMultiplier }:
  { title: string; onPress?: () => void; kind?: "primary" | "secondary" | "ghost" | "danger"; icon?: ReactNode; loading?: boolean;
    disabled?: boolean; style?: StyleProp<ViewStyle>; small?: boolean; accessibilityLabel?: string; maxFontSizeMultiplier?: number }) {
  const c = usePalette();
  const bg = kind === "primary" ? c.accent : kind === "secondary" ? c.surface : kind === "danger" ? "transparent" : "transparent";
  const fg = kind === "primary" ? c.accentInk : kind === "danger" ? c.bad : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled || loading}
      onPress={() => { tap(); onPress?.(); }}
      style={({ pressed }) => [
        {
          minHeight: small ? 44 : 54, borderRadius: radius.pill, paddingHorizontal: small ? space.lg : space.xl,
          backgroundColor: bg, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: space.sm,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }],
          borderWidth: kind === "secondary" ? StyleSheet.hairlineWidth * 2 : 0, borderColor: c.line,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <>
        {icon}
        <Text maxFontSizeMultiplier={maxFontSizeMultiplier} style={{ color: fg, fontFamily: font.semibold, fontSize: small ? 15 : 17 }}>{title}</Text>
      </>}
    </Pressable>
  );
}

export function Card({ children, style, onPress, accessibilityLabel }:
  { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: PressableProps["onPress"]; accessibilityLabel?: string }) {
  const c = usePalette();
  const s: StyleProp<ViewStyle> = [{
    backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: c.line,
    shadowColor: "#3b2a14", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1,
  }, style];
  if (!onPress) return <View style={s}>{children}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={(e) => { tap(); onPress(e); }}
      style={({ pressed }) => [s, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}>
      {children}
    </Pressable>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "good" }) {
  const c = usePalette();
  const bg = tone === "accent" ? c.accentSoft : tone === "good" ? c.surfaceAlt : c.surfaceAlt;
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" }}>
      <T v="caption" style={{ fontFamily: font.semibold }} color={tone === "accent" ? c.accentOnSoft : c.inkMuted}>{children}</T>
    </View>
  );
}

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  return <View style={[{ flex: 1, backgroundColor: c.bg }, style]}>{children}</View>;
}

export function Divider() {
  const c = usePalette();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.line, marginVertical: space.md }} />;
}

export function Loading({ label }: { label?: string }) {
  const c = usePalette();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: space.md, backgroundColor: c.bg }}>
      <ActivityIndicator color={c.accent} />
      {label ? <T muted>{label}</T> : null}
    </View>
  );
}

/**
 * Tam ekran hata durumu. Başlık hatanın türüne göre: ağ hatasında "Bağlantı kurulamadı", diğerlerinde "Bir sorun oluştu".
 * `onRetry` verilen her ekranda "Tekrar dene" çalışır (ekran yükleme fonksiyonu hatayı önce temizler).
 */
export function ErrorState({ message, onRetry, title, children }:
  { message: string; onRetry?: () => void; title?: string; children?: ReactNode }) {
  const c = usePalette();
  return (
    <View accessibilityRole="alert" style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: space.xl, gap: space.lg, backgroundColor: c.bg }}>
      <T v="h2" center>{title ?? (isNetworkText(message) ? "Bağlantı kurulamadı" : "Bir sorun oluştu")}</T>
      <T muted center>{message}</T>
      {onRetry ? <Button title="Tekrar dene" onPress={onRetry} kind="secondary" /> : null}
      {children}
    </View>
  );
}

/** Ekranın üstünde ince hata şeridi (içerik görünürken oluşan hatalar için, ör. 1v1 maçında bağlantı kopması). */
export function ErrorBanner({ message }: { message: string }) {
  const c = usePalette();
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite"
      style={{ marginHorizontal: space.md, marginTop: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm,
        borderRadius: radius.md, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.bad }}>
      <T v="small" color={c.bad} center style={{ fontFamily: font.semibold }}>{message}</T>
    </View>
  );
}
