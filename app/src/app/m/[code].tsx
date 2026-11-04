import { Redirect, useLocalSearchParams } from "expo-router";

/** Evrensel link: https://maziturkiye.com/m/<KOD> → meydan okuma ekranı */
export default function ChallengeLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  // source: challenge_opened olayında link / elle girilen kod ayrımı (QA D12)
  return <Redirect href={{ pathname: "/challenge/[code]", params: { code: String(code).toUpperCase(), source: "link" } }} />;
}
