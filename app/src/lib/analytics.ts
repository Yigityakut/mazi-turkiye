import PostHog from "posthog-react-native";
import { Platform } from "react-native";
import { POSTHOG_HOST, POSTHOG_KEY } from "./config";

/**
 * PostHog: kişiyi tanımlamayan olaylar (Plan Bölüm 10.2). Kimlik olarak Supabase'in rastgele kullanıcı kimliği
 * kullanılır; e-posta, isim, konum gibi kişisel veri olay özelliklerine yazılmaz.
 * Hata takibi (Plan 7.3, QA Y3): yakalanmamış JS hataları ve reddedilen promise'ler otomatik, render hataları
 * `_layout.tsx` → `ErrorBoundary` üzerinden `captureException` ile gider. Konsol kayıtları gönderilmez.
 */
export type EventName =
  | "app_opened" | "onboarding_completed" | "photo_guessed" | "day_completed" | "share_tapped"
  | "challenge_sent" | "challenge_opened" | "challenge_completed" | "duel_search_started" | "duel_matched"
  | "duel_finished" | "paywall_viewed" | "pro_purchased" | "pro_restored" | "notification_opened"
  | "account_deleted" | "hint_used" | "photo_reported";

type Props = Record<string, string | number | boolean | null>;

let ph: PostHog | null = null;
if (POSTHOG_KEY && Platform.OS !== "web") {
  ph = new PostHog(POSTHOG_KEY, {
    host: POSTHOG_HOST,
    captureAppLifecycleEvents: false,
    personProfiles: "identified_only",
    errorTracking: { autocapture: { uncaughtExceptions: true, unhandledRejections: true, console: false } },
  });
}

let identified: string | null = null;

export const track = (e: EventName, props?: Props) => {
  ph?.capture(e, props ?? {});
};
/** Aynı kimlik için tekrar çağrılırsa bir şey yapmaz (kimlik eşitleme her oturum olayında çağırır). */
export const identify = (uid: string) => {
  if (identified === uid) return;
  identified = uid;
  ph?.identify(uid);
};
export const resetAnalytics = () => {
  identified = null;
  ph?.reset();
};
/** Hata nesnesi (mesaj + yığın) ve isteğe bağlı bağlam; kişisel veri eklenmez. */
export const captureException = (e: unknown, props?: Props) => {
  try { ph?.captureException(e, props); } catch {}
  if (__DEV__) console.warn("[captureException]", e);
};
