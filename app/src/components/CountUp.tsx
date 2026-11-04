import { useEffect, useRef, useState } from "react";
import type { TextStyle } from "react-native";
import { num } from "../lib/format";
import { T } from "./ui";

/** Puanın sayılarak artması (açılım anı). */
export function CountUp({ to, from = 0, duration = 900, delay = 0, style, color, suffix = "", plain }:
  { to: number; from?: number; duration?: number; delay?: number; style?: TextStyle; color?: string; suffix?: string; plain?: boolean }) {
  const [v, setV] = useState(from);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    let start: number | null = null;
    const t = setTimeout(() => {
      const step = (ts: number) => {
        if (start == null) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setV(from + (to - from) * eased);
        if (p < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(t); if (raf.current) cancelAnimationFrame(raf.current); };
  }, [to, from, duration, delay]);
  return <T v="number" style={style} color={color}>{plain ? Math.round(v) : num(v)}{suffix}</T>;
}
