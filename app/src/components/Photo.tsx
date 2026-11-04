import { Image } from "expo-image";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { GestureDetector, usePanGesture, usePinchGesture, useSimultaneousGestures, useTapGesture } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { imageUrl } from "../lib/supabase";
import { font, usePalette } from "../lib/theme";
import { T } from "./ui";

type Src = { image_path?: string | null; uri?: string; local?: number };
const source = (s: Src, w: number) => (s.local ? s.local : { uri: s.uri ?? imageUrl(s.image_path, w) });

/** Oyundaki fotoğraf: dokununca tam ekran açılır ve yakınlaştırılır. */
export function PhotoCard({ src, style, onOpen, label }: { src: Src; style?: object; onOpen?: () => void; label?: string }) {
  const c = usePalette();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={label ?? "Fotoğraf. Büyütmek için dokun."}
        onPress={() => { setOpen(true); onOpen?.(); }}
        style={[{ backgroundColor: "#0d0b09", overflow: "hidden" }, style]}
      >
        <Image source={source(src, 1200)} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} cachePolicy="memory-disk" />
        <View style={[styles.zoomHint, { backgroundColor: c.overlay }]}>
          <T v="caption" color="#fff" style={{ fontFamily: font.semibold }}>⤢ Büyüt</T>
        </View>
      </Pressable>
      <PhotoZoom src={src} visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function PhotoZoom({ src, visible, onClose }: { src: Src; visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const s = useSharedValue(1), tx = useSharedValue(0), ty = useSharedValue(0);
  const reset = () => { s.value = withTiming(1); tx.value = withTiming(0); ty.value = withTiming(0); };
  const pinch = usePinchGesture({
    onUpdate: (e) => { "worklet"; s.value = Math.min(Math.max(s.value * e.scaleChange, 1), 6); },
    onDeactivate: () => { "worklet"; if (s.value <= 1.01) { tx.value = withTiming(0); ty.value = withTiming(0); } },
  });
  const pan = usePanGesture({
    onUpdate: (e) => { "worklet"; if (s.value > 1) { tx.value += e.changeX; ty.value += e.changeY; } },
  });
  const dbl = useTapGesture({
    numberOfTaps: 2,
    onActivate: () => {
      "worklet";
      if (s.value > 1) { s.value = withTiming(1); tx.value = withTiming(0); ty.value = withTiming(0); }
      else s.value = withTiming(2.5);
    },
  });
  const g = useSimultaneousGestures(pinch, pan, dbl);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: s.value }] }));
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={() => { reset(); onClose(); }} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <GestureDetector gesture={g}>
          <Animated.View style={[{ flex: 1 }, st]} collapsable={false}>
            <Image source={source(src, 2000)} style={{ flex: 1 }} contentFit="contain" />
          </Animated.View>
        </GestureDetector>
        <Pressable
          accessibilityRole="button" accessibilityLabel="Kapat" onPress={() => { reset(); onClose(); }} hitSlop={12}
          style={[styles.close, { top: insets.top + 8 }]}
        >
          <T color="#fff" style={{ fontFamily: font.semibold, fontSize: 16 }}>Kapat</T>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  zoomHint: { position: "absolute", right: 10, bottom: 10, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  close: { position: "absolute", right: 16, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
});
