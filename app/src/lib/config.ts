import Constants from "expo-constants";

/** Tek doğruluk kaynağı: isim değişirse sadece burası ve app.config.ts değişir. */
export const APP_NAME = "Mazi Türkiye";
export const APP_SCHEME = "maziturkiye";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export const SUPABASE_URL = extra.supabaseUrl ?? "https://ybhiddgwunzyquzrbzaf.supabase.co";
export const SUPABASE_KEY = extra.supabaseKey ?? "sb_publishable_YfIE8Fo1LCbF7DFH8kIR2g_gu-PbdtO";
export const WEB_URL = extra.webUrl ?? "https://maziturkiye.com";
export const SUPPORT_EMAIL = extra.supportEmail ?? "destek@maziturkiye.com";
export const POSTHOG_KEY = extra.posthogKey;
export const POSTHOG_HOST = extra.posthogHost ?? "https://eu.i.posthog.com";
export const RC_IOS_KEY = extra.revenuecatIosKey;
export const RC_ANDROID_KEY = extra.revenuecatAndroidKey;
export const GOOGLE_WEB_CLIENT_ID = extra.googleWebClientId;
export const GOOGLE_IOS_CLIENT_ID = extra.googleIosClientId;

export const PRO_PRICE_FALLBACK = "6 $";
export const LINKS = {
  privacy: `${WEB_URL}/gizlilik`,
  terms: `${WEB_URL}/kosullar`,
  kvkk: `${WEB_URL}/kvkk`,
  sources: `${WEB_URL}/kaynaklar`,
  support: `${WEB_URL}/destek`,
};
