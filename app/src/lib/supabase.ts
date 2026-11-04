import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type Session } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";
import { DEMO } from "./demo";

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

/** Supabase Auth hız sınırı (HTTP 429, `over_request_rate_limit`, "rate limit"). */
export function isRateLimit(e: unknown) {
  const x = e as { status?: number; code?: string; message?: string } | null;
  return x?.status === 429 || /rate.?limit/i.test(`${x?.code ?? ""} ${x?.message ?? String(e)}`);
}

const BACKOFF_MS = [1500, 4000, 9000];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function signInAnonymouslyWithBackoff(): Promise<Session> {
  for (let attempt = 0; ; attempt++) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error && data.session) return data.session;
    const e = error ?? new Error("anonymous_sign_in_failed");
    // Sadece hız sınırında bekleyip yeniden dene; internet yoksa hemen hata ver (ekran "Tekrar dene" gösterir).
    if (!isRateLimit(e) || attempt >= BACKOFF_MS.length) throw e;
    await wait(BACKOFF_MS[attempt] + Math.random() * 500);
  }
}

let inflight: Promise<Session> | null = null;

/**
 * Günlük oyun hesap açmadan oynanır: oturum yoksa anonim oturum açılır.
 * Tek uçuş: aynı anda gelen çağrılar (ilk açılışta AppState + Ana ekran) aynı isteği paylaşır; aksi halde
 * iki anonim kullanıcı açılır ve RevenueCat/PostHog ile oyun verisi farklı kimliklere bağlanırdı (QA K1).
 */
export function ensureSession(): Promise<Session> {
  inflight ??= (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session;
    return signInAnonymouslyWithBackoff();
  })().finally(() => { inflight = null; });
  return inflight;
}

export function imageUrl(path: string | null | undefined, width = 1200) {
  if (!path) return undefined;
  if (DEMO) return `/demo/${path}`; // demo derlemesi: app/public/demo/ (web)
  // Supabase görsel dönüştürme: destekleyen istemcilere otomatik WebP
  return `${SUPABASE_URL}/storage/v1/render/image/public/photos/${path}?width=${width}&quality=80&resize=contain`;
}
