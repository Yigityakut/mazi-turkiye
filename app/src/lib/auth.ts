import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import { api } from "./api";
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "./config";
import { supabase } from "./supabase";

/**
 * Anonim oturumdan Apple/Google hesabına geçiş. Önce anonim hesap için birleştirme bileti alınır,
 * giriş yapılır, sonra bilet bozdurulup veriler yeni hesaba taşınır (DECISIONS.md).
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
  return Platform.OS === "ios" && (await AppleAuthentication.isAvailableAsync());
}

export const googleConfigured = () => !!GOOGLE_WEB_CLIENT_ID;
