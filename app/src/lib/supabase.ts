import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (s) => {
    if (s === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Günlük oyun hesap açmadan oynanır: oturum yoksa anonim oturum açılır. */
export async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  const { data: anon, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return anon.session!;
}

export function imageUrl(path: string | null | undefined, width = 1200) {
  if (!path) return undefined;
  // Supabase görsel dönüştürme: destekleyen istemcilere otomatik WebP
  return `${SUPABASE_URL}/storage/v1/render/image/public/photos/${path}?width=${width}&quality=80&resize=contain`;
}
