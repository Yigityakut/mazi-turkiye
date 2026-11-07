import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Gizli olmayan yapılandırma burada; anahtarlar EAS ortam değişkenlerinden gelir (eas.json / expo.dev → Environment variables).
 * Gerekli değişkenler için bkz. app/README.md.
 */
const env = process.env;
const DOMAIN = env.EXPO_PUBLIC_DOMAIN ?? "maziturkiye.com";
const googleIosScheme = env.GOOGLE_IOS_URL_SCHEME; // com.googleusercontent.apps.xxxx

// EAS projesi (gizli değil): expo.dev/@rubygamestudios/mazi-turkiye. Ortam değişkeniyle ezilebilir.
const EAS_PROJECT_ID = env.EAS_PROJECT_ID ?? "3ad08474-a1e2-4d9b-af75-908376964a7a";
const EXPO_OWNER = env.EXPO_OWNER ?? "rubygamestudios";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Mazi Türkiye",
  slug: "mazi-turkiye",
  owner: EXPO_OWNER,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "maziturkiye",
  userInterfaceStyle: "automatic",
  runtimeVersion: { policy: "appVersion" },
  updates: { url: `https://u.expo.dev/${EAS_PROJECT_ID}` },
  ios: {
    bundleIdentifier: "com.maziturkiye.app",
    buildNumber: "1",
    supportsTablet: false,
    usesAppleSignIn: true,
    associatedDomains: [`applinks:${DOMAIN}`],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDisplayName: "Mazi Türkiye",
      CFBundleDevelopmentRegion: "tr",
      CFBundleLocalizations: ["tr"],
    },
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyAccessedAPITypes: [
        { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults", NSPrivacyAccessedAPITypeReasons: ["CA92.1"] },
      ],
    },
  },
  android: {
    package: "com.maziturkiye.app",
    versionCode: 1,
    adaptiveIcon: { foregroundImage: "./assets/adaptive-icon.png", backgroundColor: "#B8432A" },
    // Android'de Expo push (FCM V1) için; EAS'te dosya türünde ortam değişkeni (QA O6). Yoksa sadece yerel hatırlatıcı çalışır.
    ...(env.GOOGLE_SERVICES_JSON ? { googleServicesFile: env.GOOGLE_SERVICES_JSON } : {}),
    blockedPermissions: ["android.permission.RECORD_AUDIO", "android.permission.READ_MEDIA_IMAGES", "android.permission.ACCESS_FINE_LOCATION"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          { scheme: "https", host: DOMAIN, pathPrefix: "/m/" },
          { scheme: "https", host: DOMAIN, pathPrefix: "/d/" },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  // lang: tek sayfalık web derlemesinde <html lang="tr"> (büyük harf etiketlerde i → İ doğru çevrilsin)
  web: { bundler: "metro", output: "single", favicon: "./assets/favicon.png", lang: "tr" },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-image",
    "expo-localization",
    "expo-web-browser",
    "expo-apple-authentication",
    ["expo-splash-screen", { image: "./assets/splash-icon.png", imageWidth: 180, backgroundColor: "#F2EADB",
      dark: { image: "./assets/splash-icon.png", backgroundColor: "#14110D" } }],
    ["expo-notifications", { icon: "./assets/notification-icon.png", color: "#B8432A" }],
    ...(googleIosScheme ? [["@react-native-google-signin/google-signin", { iosUrlScheme: googleIosScheme }] as [string, object]] : []),
  ],
  experiments: { typedRoutes: true },
  extra: {
    eas: { projectId: EAS_PROJECT_ID },
    supabaseUrl: env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseKey: env.EXPO_PUBLIC_SUPABASE_KEY,
    // Alan adı yokken web GitHub Pages'te: EXPO_PUBLIC_WEB_URL (yalnız JS, OTA ile değişebilir)
    webUrl: env.EXPO_PUBLIC_WEB_URL ?? `https://${DOMAIN}`,
    supportEmail: env.EXPO_PUBLIC_SUPPORT_EMAIL,
    posthogKey: env.EXPO_PUBLIC_POSTHOG_KEY,
    posthogHost: env.EXPO_PUBLIC_POSTHOG_HOST,
    revenuecatIosKey: env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    revenuecatAndroidKey: env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
    googleWebClientId: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    googleIosClientId: env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    // iOS'ta Google düğmesi sadece URL şeması build'e eklendiyse görünür (aksi halde Google SDK çöker, QA O4)
    googleIosUrlScheme: !!googleIosScheme,
  },
});
