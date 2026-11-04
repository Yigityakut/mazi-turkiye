import PostHog from "posthog-react-native";
import { Platform } from "react-native";
import { POSTHOG_HOST, POSTHOG_KEY } from "./config";

/**
 * PostHog: kişiyi tanımlamayan olaylar (Plan Bölüm 10.2). Kimlik olarak Supabase'in rastgele kullanıcı kimliği
 * kullanılır; e-posta, isim, konum gibi kişisel veri olay özelliklerine yazılmaz.
 */
export type EventName =
  | "app_opened" | "onboarding_completed" | "photo_guessed" | "day_completed" | "share_tapped"
  | "challenge_sent" | "challenge_opened" | "challenge_completed" | "duel_search_started" | "duel_matched"
  | "duel_finished" | "paywall_viewed" | "pro_purchased" | "pro_restored" | "notification_opened"
  | "account_deleted" | "hint_used" | "photo_reported";

let ph: PostHog | null = null;
if (POSTHOG_KEY && Platform.OS !== "web") {
  ph = new PostHog(POSTHOG_KEY, {
    host: POSTHOG_HOST,
    captureAppLifecycleEvents: false,
    personProfiles: "identified_only",
  } as never);
}

export const track = (e: EventName, props?: Record<string, string | number | boolean | null>) => {
  ph?.capture(e, props ?? {});
};
export const identify = (uid: string) => ph?.identify(uid);
export const resetAnalytics = () => ph?.reset();
