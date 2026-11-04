import { useColorScheme } from "react-native";

const light = {
  bg: "#F2EADB",          // eski kağıt
  surface: "#FBF7EF",
  surfaceAlt: "#EDE3D1",
  ink: "#1E1913",
  inkMuted: "#6A5D4C",
  inkFaint: "#756751",     // AA: bg 4,60:1 · surface 5,15:1 (QA O11)
  line: "#DCCFB8",
  accent: "#B8432A",      // kiremit
  accentInk: "#FFF8EE",
  accentSoft: "#F1D6C9",
  accentOnSoft: "#963520", // accentSoft zemindeki metin: 5,38:1 (accent 3,92:1 kalıyordu)
  good: "#2F6B4F",
  warn: "#B07A12",
  bad: "#A33A2A",
  water: "#CFD9D4",
  land: "#F8F1E3",
  landStroke: "#C9B596",
  pinGuess: "#B8432A",
  pinAnswer: "#1E1913",
  pinOpp: "#2E5D7A",
  overlay: "rgba(30,25,19,0.55)",
};
export type Palette = typeof light;

const dark: Palette = {
  bg: "#14110D",
  surface: "#1E1A14",
  surfaceAlt: "#29231B",
  ink: "#F1E8D8",
  inkMuted: "#B2A48E",
  inkFaint: "#988B76",     // AA: bg 5,64:1 · surfaceAlt 4,66:1
  line: "#3A3228",
  accent: "#E0694A",
  accentInk: "#1A120C",
  accentSoft: "#4A2A20",
  accentOnSoft: "#F0907A", // 5,46:1
  good: "#6DBB94",
  warn: "#E2B04A",
  bad: "#E07A66",
  water: "#1B2624",
  land: "#2A241C",
  landStroke: "#4B4033",
  pinGuess: "#E0694A",
  pinAnswer: "#F1E8D8",
  pinOpp: "#7FB2D6",
  overlay: "rgba(0,0,0,0.6)",
};

export function usePalette(): Palette {
  return useColorScheme() === "dark" ? dark : light;
}

export const font = {
  display: "Fraunces_700Bold",
  displayBlack: "Fraunces_900Black",
  displayItalic: "Fraunces_600SemiBold_Italic",
  body: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 14, lg: 22, pill: 999 };
