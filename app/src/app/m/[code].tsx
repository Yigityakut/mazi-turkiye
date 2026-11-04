import { Redirect, useLocalSearchParams } from "expo-router";

/** Evrensel link: https://maziturkiye.com/m/<KOD> → meydan okuma ekranı */
export default function ChallengeLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return <Redirect href={`/challenge/${String(code).toUpperCase()}`} />;
}
