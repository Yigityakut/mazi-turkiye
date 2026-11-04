import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Gizli olmayan yapılandırma burada; anahtarlar EAS ortam değişkenlerinden gelir (eas.json / expo.dev → Environment variables).
 * Gerekli değişkenler için bkz. app/README.md.
 */
const env = process.env;
const DOMAIN = env.EXPO_PUBLIC_DOMAIN ?? "maziturkiye.com";
const googleIosScheme = env.GOOGLE_IOS_URL_SCHEME; // com.googleusercontent.apps.xxxx

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Mazi Türkiye",
  slug: "mazi-turkiye",
  owner: env.EXPO_OWNER,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "maziturkiye",
  userInterfaceStyle: "automatic",
  runtimeVersion: { policy: "appVersion" },
  updates: env.EAS_PROJECT_ID ? { url: `https://u.expo.dev/${env.EAS_PROJECT_ID}` } : undefined,
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
  web: { bundler: "metro", output: "single", favicon: "./assets/favicon.png" },
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
    eas: env.EAS_PROJECT_ID ? { projectId: env.EAS_PROJECT_ID } : undefined,
    supabaseUrl: env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseKey: env.EXPO_PUBLIC_SUPABASE_KEY,
    webUrl: `https://${DOMAIN}`,
    supportEmail: env.EXPO_PUBLIC_SUPPORT_EMAIL,
    posthogKey: env.EXPO_PUBLIC_POSTHOG_KEY,
    posthogHost: env.EXPO_PUBLIC_POSTHOG_HOST,
    revenuecatIosKey: env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    revenuecatAndroidKey: env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
    googleWebClientId: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    googleIosClientId: env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  },
});
