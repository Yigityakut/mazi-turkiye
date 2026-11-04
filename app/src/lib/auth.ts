import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import { api } from "./api";
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_IOS_URL_SCHEME_SET, GOOGLE_WEB_CLIENT_ID } from "./config";
import { supabase } from "./supabase";

/**
 * Anonim oturumdan Apple/Google hesabına geçiş. Önce anonim hesap için birleştirme bileti alınır,
 * giriş yapılır, sonra bilet bozdurulup veriler yeni hesaba taşınır (DECISIONS.md).
 * Kimlik değişince RevenueCat `logIn` ve PostHog `identify` otomatik yapılır (identity.ts, onAuthStateChange).
 */
async function withMerge(signIn: () => Promise<void>) {
  const { data } = await supabase.auth.getSession();
  const wasAnon = data.session?.user.is_anonymous;
  const ticket = wasAnon ? await api.createMergeTicket() : null;
  await signIn();
  if (ticket) await api.redeemMergeTicket(ticket).catch(() => {});
}

export async function signInWithApple() {
  await withMerge(async () => {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
    if (!cred.identityToken) throw new Error("apple_no_token");
    const { error } = await supabase.auth.signInWithIdToken({ provider: "apple", token: cred.identityToken });
    if (error) throw error;
  });
}

export async function signInWithGoogle() {
  if (!googleConfigured()) throw new Error("google_not_configured");
  const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID });
  await withMerge(async () => {
    if (Platform.OS === "android") await GoogleSignin.hasPlayServices();
    const res = await GoogleSignin.signIn();
    if (res.type !== "success" || !res.data.idToken) throw new Error("google_cancelled");
    const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: res.data.idToken });
    if (error) throw error;
  });
}

export async function appleAvailable() {
  try {
    return Platform.OS === "ios" && (await AppleAuthentication.isAvailableAsync());
  } catch {
    return false;
  }
}

/**
 * Google girişi sadece gerekli tüm kimlikler varsa sunulur (QA O4): Android'de Web client ID; iOS'ta ayrıca iOS client ID
 * ve build'e URL şemasını ekleyen `GOOGLE_IOS_URL_SCHEME`. Biri eksikse Google SDK'sı iOS'ta uygulamayı çökertebilir.
 */
export const googleConfigured = () =>
  Platform.OS !== "web" && !!GOOGLE_WEB_CLIENT_ID && (Platform.OS !== "ios" || (!!GOOGLE_IOS_CLIENT_ID && GOOGLE_IOS_URL_SCHEME_SET));

/** Kullanıcı vazgeçti mi (Apple: ERR_REQUEST_CANCELED, Google: google_cancelled / SIGN_IN_CANCELLED). */
export const isCancel = (e: unknown) =>
  (e as { code?: unknown } | null)?.code === "ERR_REQUEST_CANCELED" || /cancel/i.test(String((e as Error)?.message ?? e));

/** Oturumdaki kullanıcı Apple ile bağlı mı (hesap silmede Apple token iptali için). */
export async function hasAppleIdentity(): Promise<boolean> {
  const fresh = await supabase.auth.getUser().catch(() => null);
  const user = fresh?.data.user ?? (await supabase.auth.getSession()).data.session?.user;
  if (!user) return false;
  const providers = (user.app_metadata?.providers as string[] | undefined) ?? [];
  return !!user.identities?.some((i) => i.provider === "apple") || providers.includes("apple") || user.app_metadata?.provider === "apple";
}

/**
 * Hesap silmeden hemen önce Apple'dan taze bir `authorizationCode` alır; delete-account fonksiyonu bunu refresh token'a
 * çevirip Apple'da iptal eder (App Store 5.1.1(v), QA Y2). Vazgeçilirse `ERR_REQUEST_CANCELED` fırlatır.
 */
export async function appleAuthorizationCode(): Promise<string | null> {
  const cred = await AppleAuthentication.signInAsync({ requestedScopes: [] });
  return cred.authorizationCode ?? null;
}
