import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import {
  GestureDetector, useExclusiveGestures, usePanGesture, usePinchGesture, useSimultaneousGestures, useTapGesture,
} from "react-native-gesture-handler";
import Animated, {
  Easing, useAnimatedProps, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withSpring, withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { G, Line, Path } from "react-native-svg";
import { MAP, project, unproject, type LatLng } from "../lib/geo";
import { font, usePalette } from "../lib/theme";
import { T, tap as hapticTap } from "./ui";

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedLine = Animated.createAnimatedComponent(Line);

export type MapPin = { id: string; at: LatLng; kind: "guess" | "answer" | "opponent"; label?: string };
export type MapLineDef = { from: LatLng; to: LatLng; kind?: "guess" | "opponent"; delay?: number };

type Props = {
  pins?: MapPin[];
  lines?: MapLineDef[];
  onPick?: (p: LatLng) => void;
  /** Bu noktaları kadraja alacak şekilde animasyonla yakınlaşır */
  focus?: LatLng[] | null;
  highlightRegion?: string | null;
  interactive?: boolean;
  compact?: boolean;
  /** Ekran okuyucu için açıklama (varsayılan: haritanın türüne göre). */
  accessibilityLabel?: string;
};

const MAX_ZOOM = 16;

function TurkeyMapInner({ pins = [], lines = [], onPick, focus, highlightRegion, interactive = true, compact, accessibilityLabel }: Props) {
  const c = usePalette();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const k = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const fitK = useSharedValue(1);
  const vw = useSharedValue(0);
  const vh = useSharedValue(0);

  const fit = useCallback((w: number, h: number, animated = false) => {
    const pad = compact ? 0.98 : 0.94;
    const kk = Math.min(w / MAP.width, h / MAP.height) * pad;
    fitK.value = kk;
    const ntx = (w - MAP.width * kk) / 2, nty = (h - MAP.height * kk) / 2;
    if (animated) {
      const cfg = { duration: 650, easing: Easing.out(Easing.cubic) };
      k.value = withTiming(kk, cfg); tx.value = withTiming(ntx, cfg); ty.value = withTiming(nty, cfg);
    } else { k.value = kk; tx.value = ntx; ty.value = nty; }
  }, [compact, fitK, k, tx, ty]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (Math.abs(w - size.w) < 1 && Math.abs(h - size.h) < 1) return;
    setSize({ w, h });
    vw.value = w; vh.value = h;
    fit(w, h);
  };

  // Odak noktalarına yakınlaş (açılım anı)
  const focusKey = focus?.map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`).join("|") ?? "";
  useEffect(() => {
    if (!size.w) return;
    if (!focus || focus.length === 0) { fit(size.w, size.h, true); return; }
    const xy = focus.map(project);
    const minX = Math.min(...xy.map((p) => p.x)), maxX = Math.max(...xy.map((p) => p.x));
    const minY = Math.min(...xy.map((p) => p.y)), maxY = Math.max(...xy.map((p) => p.y));
    const bw = Math.max(maxX - minX, 60), bh = Math.max(maxY - minY, 40);
    const base = Math.min(size.w / MAP.width, size.h / MAP.height);
    const kk = Math.min(Math.min((size.w * 0.7) / bw, (size.h * 0.62) / bh), base * 9);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const cfg = { duration: 900, easing: Easing.inOut(Easing.cubic) };
    k.value = withTiming(Math.max(kk, base * 0.94), cfg);
    tx.value = withTiming(size.w / 2 - cx * Math.max(kk, base * 0.94), cfg);
    ty.value = withTiming(size.h / 2 - cy * Math.max(kk, base * 0.94), cfg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, size.w, size.h]);

  const clampPan = () => {
    "worklet";
    const mw = MAP.width * k.value, mh = MAP.height * k.value;
    const marginX = vw.value * 0.5, marginY = vh.value * 0.5;
    tx.value = Math.min(Math.max(tx.value, vw.value - mw - marginX), marginX);
    ty.value = Math.min(Math.max(ty.value, vh.value - mh - marginY), marginY);
  };

  const pinch = usePinchGesture({
    enabled: interactive,
    onUpdate: (e) => {
      "worklet";
      const nk = Math.min(Math.max(k.value * e.scaleChange, fitK.value * 0.9), fitK.value * MAX_ZOOM);
      const r = nk / k.value;
      tx.value = e.focalX - (e.focalX - tx.value) * r;
      ty.value = e.focalY - (e.focalY - ty.value) * r;
      k.value = nk;
    },
    onDeactivate: () => {
      "worklet";
      if (k.value < fitK.value) {
        k.value = withSpring(fitK.value);
        tx.value = withSpring((vw.value - MAP.width * fitK.value) / 2);
        ty.value = withSpring((vh.value - MAP.height * fitK.value) / 2);
      }
    },
  });
  const pan = usePanGesture({
    enabled: interactive,
    minDistance: 6,
    onUpdate: (e) => {
      "worklet";
      tx.value += e.changeX;
      ty.value += e.changeY;
      clampPan();
    },
  });

  const pick = useCallback((x: number, y: number) => {
    if (!onPick) return;
    const mx = (x - tx.value) / k.value, my = (y - ty.value) / k.value;
    if (mx < 0 || my < 0 || mx > MAP.width || my > MAP.height) return;
    hapticTap();
    onPick(unproject({ x: mx, y: my }));
  }, [onPick, tx, ty, k]);

  const singleTap = useTapGesture({
    enabled: interactive && !!onPick,
    maxDistance: 10,
    runOnJS: true,
    onActivate: (e) => pick(e.x, e.y),
  });
  const doubleTap = useTapGesture({
    enabled: interactive,
    numberOfTaps: 2,
    onActivate: (e) => {
      "worklet";
      const nk = Math.min(k.value * 2.2, fitK.value * MAX_ZOOM);
      const r = nk / k.value;
      const cfg = { duration: 280 };
      tx.value = withTiming(e.x - (e.x - tx.value) * r, cfg);
      ty.value = withTiming(e.y - (e.y - ty.value) * r, cfg);
      k.value = withTiming(nk, cfg);
    },
  });
  const panPinch = useSimultaneousGestures(pinch, pan);
  const taps = useExclusiveGestures(doubleTap, singleTap);
  const gesture = useExclusiveGestures(panPinch, taps);

  const groupProps = useAnimatedProps(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: k.value }],
  }) as never);

  const provinces = useMemo(() => MAP.provinces.map((p) => (
    <Path
      key={p.n}
      d={p.d}
      fill={highlightRegion && p.r === highlightRegion ? c.accentSoft : c.land}
      stroke={c.landStroke}
      strokeWidth={0.9}
      vectorEffect="non-scaling-stroke"
      strokeLinejoin="round"
    />
  )), [c.land, c.landStroke, c.accentSoft, highlightRegion]);

  return (
    <View style={[styles.wrap, { backgroundColor: c.water }]} onLayout={onLayout}>
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill} collapsable={false} accessible accessibilityRole="image"
          accessibilityLabel={accessibilityLabel ?? (onPick ? "Türkiye haritası. Tahminini bırakmak için haritaya dokun." : `Türkiye haritası${pins.length ? `, ${pins.length} işaret` : ""}`)}>
          {size.w > 0 && (
            <Svg width={size.w} height={size.h}>
              <AnimatedG animatedProps={groupProps}>
                {provinces}
                {MAP.waterLines.map((w) => (
                  <Path key={w.n} d={w.d} stroke={c.water} strokeWidth={w.w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ))}
                {lines.map((l, i) => <MapLine key={i} def={l} k={k} />)}
              </AnimatedG>
            </Svg>
          )}
          {size.w > 0 && MAP.cities.map((city) => (
            <CityLabel key={city.n} name={city.n} x={city.xy[0]} y={city.xy[1]} rank={city.rank} k={k} fitK={fitK} tx={tx} ty={ty} />
          ))}
          {size.w > 0 && pins.map((p) => <Pin key={p.id} pin={p} k={k} tx={tx} ty={ty} />)}
        </View>
      </GestureDetector>
      {interactive && (
        <View style={styles.controls} pointerEvents="box-none">
          <ZoomButton label="+" onPress={() => zoomBy(1.8)} />
          <ZoomButton label="−" onPress={() => zoomBy(1 / 1.8)} />
          <ZoomButton label="⤢" onPress={() => fit(size.w, size.h, true)} a11y="Haritayı sığdır" />
        </View>
      )}
    </View>
  );

  function zoomBy(f: number) {
    const nk = Math.min(Math.max(k.value * f, fitK.value), fitK.value * MAX_ZOOM);
    const r = nk / k.value, cx = size.w / 2, cy = size.h / 2;
    const cfg = { duration: 260 };
    tx.value = withTiming(cx - (cx - tx.value) * r, cfg);
    ty.value = withTiming(cy - (cy - ty.value) * r, cfg);
    k.value = withTiming(nk, cfg);
  }
}

function ZoomButton({ label, onPress, a11y }: { label: string; onPress: () => void; a11y?: string }) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y ?? (label === "+" ? "Yakınlaştır" : "Uzaklaştır")}
      onPress={() => { hapticTap(); onPress(); }}
      hitSlop={6}
      style={({ pressed }) => [styles.zoomBtn, { backgroundColor: c.surface, borderColor: c.line, opacity: pressed ? 0.8 : 1 }]}
    >
      <T style={{ fontFamily: font.semibold, fontSize: 18, lineHeight: 20 }}>{label}</T>
    </Pressable>
  );
}

function MapLine({ def, k }: { def: MapLineDef; k: SharedValue<number> }) {
  const c = usePalette();
  const a = project(def.from), b = project(def.to);
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(def.delay ?? 350, withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) }));
  }, [def.from.lat, def.from.lng, def.to.lat, def.to.lng, def.delay, progress]);
  const props = useAnimatedProps(() => {
    const dash = 6 / k.value;
    return {
      x2: a.x + (b.x - a.x) * progress.value,
      y2: a.y + (b.y - a.y) * progress.value,
      strokeDasharray: [dash, dash * 0.8],
    } as never;
  });
  void len;
  return (
    <AnimatedLine
      x1={a.x} y1={a.y}
      animatedProps={props}
      stroke={def.kind === "opponent" ? c.pinOpp : c.pinGuess}
      strokeWidth={2.2}
      vectorEffect="non-scaling-stroke"
      strokeLinecap="round"
    />
  );
}

function Pin({ pin, k, tx, ty }: { pin: MapPin; k: SharedValue<number>; tx: SharedValue<number>; ty: SharedValue<number> }) {
  const c = usePalette();
  const { x, y } = project(pin.at);
  const pop = useSharedValue(0);
  useEffect(() => {
    pop.value = 0;
    pop.value = withDelay(pin.kind === "answer" ? 900 : 0, withSpring(1, { damping: 11, stiffness: 180 }));
  }, [pin.at.lat, pin.at.lng, pin.kind, pop]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value + x * k.value - 70 },
      { translateY: ty.value + y * k.value - 14 },
      { scale: pop.value },
    ],
  }));
  const color = pin.kind === "guess" ? c.pinGuess : pin.kind === "opponent" ? c.pinOpp : c.pinAnswer;
  return (
    <Animated.View pointerEvents="none" style={[styles.pinWrap, style]}>
      <View style={[styles.pinOuter, { borderColor: color, backgroundColor: pin.kind === "answer" ? color : c.surface }]}>
        <View style={[styles.pinInner, { backgroundColor: pin.kind === "answer" ? c.surface : color }]} />
      </View>
      {pin.label ? (
        <View style={[styles.pinLabel, { backgroundColor: color }]}>
          <T v="caption" style={{ fontFamily: font.semibold }} color={pin.kind === "answer" ? c.bg : "#fff"} numberOfLines={1}>{pin.label}</T>
        </View>
      ) : null}
    </Animated.View>
  );
}

function CityLabel({ name, x, y, rank, k, fitK, tx, ty }:
  { name: string; x: number; y: number; rank: number; k: SharedValue<number>; fitK: SharedValue<number>; tx: SharedValue<number>; ty: SharedValue<number> }) {
  const c = usePalette();
  const visible = useDerivedValue(() => {
    const z = k.value / fitK.value;
    return rank === 1 ? 1 : rank === 2 ? (z > 1.7 ? 1 : 0) : z > 3.2 ? 1 : 0;
  });
  const style = useAnimatedStyle(() => ({
    opacity: withTiming(visible.value, { duration: 160 }),
    transform: [{ translateX: tx.value + x * k.value - 3 }, { translateY: ty.value + y * k.value - 3 }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.city, style]}>
      <View style={[styles.cityDot, { backgroundColor: c.inkMuted }]} />
      <T v="caption" style={{ fontFamily: font.medium, fontSize: 11 }} color={c.inkMuted}>{name}</T>
    </Animated.View>
  );
}

export const TurkeyMap = memo(TurkeyMapInner);

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: "hidden" },
  controls: { position: "absolute", right: 10, top: 10, gap: 8 },
  zoomBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  pinWrap: { position: "absolute", left: 0, top: 0, alignItems: "center", width: 140 },
  pinOuter: { width: 28, height: 28, borderRadius: 14, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  pinInner: { width: 10, height: 10, borderRadius: 5 },
  pinLabel: { marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, maxWidth: 140, alignItems: "center" },
  city: { position: "absolute", left: 0, top: 0, flexDirection: "row", alignItems: "center", gap: 4 },
  cityDot: { width: 5, height: 5, borderRadius: 3 },
});
