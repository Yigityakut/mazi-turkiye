import { identify, resetAnalytics } from "./analytics";
import { syncPushToken } from "./notifications";
import { resetPurchasesUser, syncPurchasesUser } from "./purchases";
import { supabase } from "./supabase";

/**
 * Kimlik eşitlemenin tek yeri (QA K1, K2, O9, O10): Supabase kullanıcı kimliği değişince (ilk anonim oturum,
 * Apple/Google girişi, hesap silme sonrası yeni anonim oturum) PostHog `identify`, RevenueCat `configure`/`logIn`
 * ve push token kaydı aynı kimlikle yapılır. Her çağrı idempotent: aynı kimlik için tekrar bir şey yapmaz.
 */
let purchasesUid: string | null = null;

export async function syncIdentity(uid: string) {
  identify(uid);
  void syncPushToken(uid);
  if (purchasesUid === uid) return;
  try {
    await syncPurchasesUser(uid);
    purchasesUid = uid;
  } catch (e) {
    // İnternet yoksa logIn başarısız olabilir; sonraki başarılı `refresh` yeniden dener
    if (__DEV__) console.warn("[identity] RevenueCat kimliği eşitlenemedi", e);
  }
}

/** Oturum olaylarını dinler. Çıkışta (hesap silme, geçersiz oturum) analitik ve RevenueCat kimliği sıfırlanır. */
export function startIdentitySync(onSignedOut: () => void) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    // Supabase: geri çağrı içinde başka Supabase çağrısı kilitlenmeye yol açabilir → bir sonraki tura ertele
    setTimeout(() => {
      if (event === "SIGNED_OUT") {
        purchasesUid = null;
        resetAnalytics();
        resetPurchasesUser().catch(() => {});
        onSignedOut();
      } else if (session?.user) {
        void syncIdentity(session.user.id);
      }
    }, 0);
  });
  return () => data.subscription.unsubscribe();
}
