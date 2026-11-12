# Mazi Türkiye · Expo app

Expo SDK 58 · Expo Router · React Native 0.88 · TypeScript. iOS (iPhone only), Android and web preview.
Builds, store submission and OTA updates are done with EAS; no Mac or Android Studio is needed.

> Expo changes with every SDK. Before touching an Expo/EAS API, check the docs at `https://docs.expo.dev/versions/v58.0.0/` (see `AGENTS.md`). When adding packages, always use `npx expo install <paket>`.

---

## 1. Local development

Requirements: Node 22 (EAS also uses `22.16.0`, see `eas.json`), npm.

```bash
cd app
npm install
npx expo start            # QR code: Expo Go or development build; "w" for web
npx expo start --web      # web preview only
```

- **It also opens without environment variables:** `src/lib/config.ts` carries default values for the Supabase URL and publishable key. Analytics, purchases and Google sign-in stay silently disabled if their keys are missing.
- **To use the EAS values locally:** `npx eas-cli@latest env:pull --environment development` → writes `app/.env.local` (`.env.*` is not committed to git). Expo CLI reads `.env.local` automatically.
- **Expo Go limits:** The map, game, reveal and leaderboard work in Expo Go. Google sign-in, Apple sign-in and real purchases need a **development build** (RevenueCat only runs in preview mode in Expo Go):

  ```bash
  npx eas-cli@latest build -p ios --profile development       # for the simulator: "ios": { "simulator": true } can be added to eas.json
  npx eas-cli@latest build -p android --profile development
  npx expo start --dev-client
  ```

- **Demo mode (store screenshots only):** `EXPO_PUBLIC_DEMO=1 npx expo start --web`. A serverless game with fixed data; details in the comment at the top of `src/lib/demo.ts`. **This variable is never added to any EAS environment (especially `production`).**

### Checks

```bash
npx tsc --noEmit          # or: npm run typecheck
npx expo lint             # or: npm run lint (on first run it sets up the ESLint config and adds it to package.json)
npx expo-doctor           # dependency and config diagnostics (needs network access to expo.dev and reactnative.directory)
npx expo config --type public          # resolved app.config output (are the environment variables read correctly?)
npx expo export --platform web --output-dir /tmp/mazi-web   # verifies that the JS bundle compiles
```

---

## 2. Environment variables

`app.config.ts` reads the variables below and puts them in the `extra` field; the app uses them through `src/lib/config.ts`.

> **Variables starting with `EXPO_PUBLIC_` are embedded in the JS bundle, so they are not secret.** Only *public* keys that the client needs to know anyway go here. Values such as the Supabase `service_role`/secret key, the RevenueCat secret key or the Google OAuth client secret are **never** written here.

| Variable | What | Where to get it | Required? |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://ybhiddgwunzyquzrbzaf.supabase.co`) | Supabase Dashboard → Project Settings → Data API → Project URL | No (default in `config.ts`), but should be set explicitly in production |
| `EXPO_PUBLIC_SUPABASE_KEY` | Supabase **publishable** key (`sb_publishable_…`) | Supabase Dashboard → Project Settings → API Keys → Publishable key | No (there is a default), should be set explicitly in production |
| `EXPO_PUBLIC_DOMAIN` | Web domain, without scheme (`maziturkiye.com`). iOS `associatedDomains`, Android `intentFilters`, share links and legal page links are generated from it | The domain (HUMAN_TODO item 9). Until it is bought, `maziturkiye.vercel.app` | No (default `maziturkiye.com`). **If it changes, a new native build is needed**, OTA is not enough |
| `EXPO_PUBLIC_SUPPORT_EMAIL` | Email address for Settings → Support | Project email (HUMAN_TODO item 9) | No (default `destek@maziturkiye.com`) |
| `EXPO_PUBLIC_POSTHOG_KEY` | PostHog Project API key (`phc_…`) | PostHog (EU region) → Project settings → Project API key | No. Without it analytics is off |
| `EXPO_PUBLIC_POSTHOG_HOST` | PostHog server | For EU, `https://eu.i.posthog.com` | No (default EU) |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | Public SDK key of the RevenueCat App Store app (`appl_…`) | RevenueCat → Project → API keys → App Store app | Yes, for purchases on iOS |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | Public SDK key of the RevenueCat Play Store app (`goog_…`) | RevenueCat → Project → API keys → Play Store app | Yes, for purchases on Android |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Client ID of the Google OAuth **Web** client (`…apps.googleusercontent.com`). The audience of the ID token; the same ID is also entered in the Supabase Google provider | Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application) | No. **If empty, the Google sign-in button is hidden** (on iOS the two variables below are also needed) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Client ID of the Google OAuth **iOS** client (bundle ID `com.maziturkiye.app`) | Google Cloud Console → Credentials → OAuth client ID (iOS) | Yes, for Google sign-in on iOS |
| `GOOGLE_IOS_URL_SCHEME` | Reversed ID of the iOS client: `com.googleusercontent.apps.<…>`. Read only at build time; **if set**, the `@react-native-google-signin/google-signin` config plugin is added, the URL scheme is written to Info.plist and `extra.googleIosUrlScheme: true` is set | Google Cloud Console → iOS OAuth client → "iOS URL scheme" | **Yes**, for Google sign-in on iOS. On iOS the button only appears if all three are set: Web client ID + iOS client ID + this variable (`src/lib/auth.ts` → `googleConfigured`); if one is missing the button is hidden and the app does not crash |
| `GOOGLE_SERVICES_JSON` | Firebase `google-services.json` file (a **file**-type variable in EAS; its value becomes the file path on the build machine). If set, it is added as `android.googleServicesFile` | Firebase Console → Android app `com.maziturkiye.app` → `google-services.json` | **Yes**, for server notifications on Android (Expo push, FCM V1). Without it only the local reminder works on Android |
| `EAS_PROJECT_ID` | UUID of the Expo project. `updates.url` (OTA) and `extra.eas.projectId` (Expo push token) are generated from it | Output of `npx eas-cli@latest init` or expo.dev → project → Overview → Project ID | **Yes.** Without it the build has no OTA URL and push token registration is skipped (the app does not crash; `src/lib/notifications.ts` checks `extra.eas.projectId` first, then `Constants.easConfig.projectId` written by the EAS build, and if neither exists only the local reminder works). If it is missing during an EAS build, `app.config.ts` writes a warning to the build log |
| `EXPO_OWNER` | Username of the Expo account or organization that owns the project | expo.dev account | Yes (EAS finds the project through this owner) |

The only other variable that enters the app code from outside is `EXPO_PUBLIC_DEMO` (above, for screenshots only).

### Defining them as EAS environment variables

EAS has three environments: `development`, `preview`, `production`. Each build profile in `eas.json` uses its own environment (`"environment": "production"` etc.), and `eas update` reads the same values with `--environment`.

Choosing visibility:
- `EXPO_PUBLIC_*` → `--visibility plaintext` (hiding them is pointless because they are embedded in the bundle; `secret` visibility cannot be read during a local `eas update`).
- `EAS_PROJECT_ID`, `EXPO_OWNER`, `GOOGLE_IOS_URL_SCHEME` → `plaintext` or `sensitive`.

Variables that take the same value in every environment (first `cd app`):

```bash
P=(--environment development --environment preview --environment production --visibility plaintext --scope project --non-interactive)

npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_URL           --value "https://ybhiddgwunzyquzrbzaf.supabase.co" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_KEY           --value "sb_publishable_…" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_PUBLIC_DOMAIN                 --value "maziturkiye.com" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPPORT_EMAIL          --value "destek@maziturkiye.com" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_PUBLIC_POSTHOG_HOST           --value "https://eu.i.posthog.com" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_PUBLIC_REVENUECAT_IOS_KEY     --value "appl_…" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value "goog_…" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID   --value "….apps.googleusercontent.com" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID   --value "….apps.googleusercontent.com" "${P[@]}"
npx eas-cli@latest env:create --name GOOGLE_IOS_URL_SCHEME              --value "com.googleusercontent.apps.…" "${P[@]}"
npx eas-cli@latest env:create --name EAS_PROJECT_ID                     --value "<uuid>" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_OWNER                         --value "<expo-kullanıcı-adı>" "${P[@]}"

# Android push (FCM V1): file type, build environments only
npx eas-cli@latest env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --environment production --environment preview --visibility secret --scope project --non-interactive
```

Variables that take a different value per environment are entered separately. Example: a separate "Mazi Türkiye (dev)" project in PostHog so that analytics events from development and preview do not pollute production data:

```bash
npx eas-cli@latest env:create --name EXPO_PUBLIC_POSTHOG_KEY --value "phc_DEV…"  --environment development --visibility plaintext --non-interactive
npx eas-cli@latest env:create --name EXPO_PUBLIC_POSTHOG_KEY --value "phc_DEV…"  --environment preview     --visibility plaintext --non-interactive
npx eas-cli@latest env:create --name EXPO_PUBLIC_POSTHOG_KEY --value "phc_PROD…" --environment production  --visibility plaintext --non-interactive
```

Checking and changing:

```bash
npx eas-cli@latest env:list --environment production
npx eas-cli@latest env:update --environment production                             # interactive: pick the variable, enter the new value
npx eas-cli@latest env:pull --environment development                               # downloads to .env.local
```

The same interface is also on expo.dev → project → **Environment variables**.

> **Chicken-and-egg note (`EAS_PROJECT_ID`, `EXPO_OWNER`):** EAS CLI must first recognize the project before it can download the environment variables from the server, and it reads the project ID from `app.config.ts`. If these two values are defined only in EAS, the CLI cannot find the project and may offer to create a new one. Fix: also define them in the terminal where you run eas commands
> (`export EAS_PROJECT_ID=<uuid> EXPO_OWNER=<kullanıcı>`) or (recommended) hard-code these two values in `app.config.ts`, since they are not secret (see `store/qa-report.md`).

---

## 3. EAS Build

First-time setup (once; Apple and Google steps are HUMAN_TODO items 5–6):

```bash
cd app
npx eas-cli@latest login
npx eas-cli@latest init            # prints the projectId because the config is dynamic → EAS_PROJECT_ID
npx eas-cli@latest credentials     # iOS: distribution certificate + provisioning profile (asks for Apple ID + 2FA)
                                   # Android: EAS generates and stores the upload keystore on the first build
```

- The iOS App ID capabilities (Sign in with Apple, Associated Domains, Push Notifications) are synced from `app.config.ts` during the EAS build.
- Version numbers: `eas.json` → `appVersionSource: "remote"` and `autoIncrement: true` in production. So `buildNumber` / `versionCode` are kept on the EAS server and increase with every production build; `buildNumber: "1"` and `versionCode: 1` in `app.config.ts` are ignored. The version shown in the store is `app.config.ts` → `version` (`1.0.0`); it is bumped by hand for each store release.

Build commands:

```bash
# Production (store): iOS .ipa, Android .aab
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest build -p android --profile production
npx eas-cli@latest build -p all --profile production

# Preview (internal distribution: Android .apk, iOS ad hoc; for iOS register devices first: npx eas-cli@latest device:create)
npx eas-cli@latest build -p android --profile preview

# Development client
npx eas-cli@latest build -p ios --profile development
```

The same tasks can be done through the Expo connection (MCP) with `build_run` and `build_submit`.

---

## 4. Store submission (EAS Submit)

First:
- In `eas.json` → `submit.production.ios.ascAppId`, replace `SET_AFTER_APP_STORE_CONNECT_RECORD` with the **Apple ID** from App Store Connect (the 10-digit number on the App Information page).
- iOS: App Store Connect API key (Users and Access → Integrations → App Store Connect API, role "App Manager"). EAS asks for it on the first `submit` and stores it.
- Android: Google Play **service account JSON** key (service account in Google Cloud → invited in Play Console → Users and permissions, with permission to publish releases). EAS asks for it on the first `submit`.
- **On Android the first AAB is uploaded to Play Console by hand** (the Google API does not accept the first upload). Download the `.aab` of the first production build from EAS and upload it via Play Console → Test and release → Internal testing → Create release; later ones go through `eas submit`.

```bash
# iOS: uploads the latest production build to App Store Connect (TestFlight)
npx eas-cli@latest submit -p ios --profile production --latest

# Android: uploads as a draft to the "internal" track, per eas.json
npx eas-cli@latest submit -p android --profile production --latest

# Build and submit in one command
npx eas-cli@latest build -p ios --profile production --auto-submit
```

Android closed testing and production tracks are managed in Play Console by promoting from internal testing (see `store/release-checklist.md`).

---

## 5. OTA updates (EAS Update)

Only JS and asset changes can be shipped via OTA. Because of `runtimeVersion: { policy: "appVersion" }`, an update only reaches apps built with the **same `version`** (e.g. `1.0.0`).

```bash
cd app
npx eas-cli@latest update --channel production --environment production --message "Açılım ekranında yazım düzeltmesi"
npx eas-cli@latest update --channel preview    --environment preview    --message "…"   # try it on the preview channel first
npx eas-cli@latest update:list
npx eas-cli@latest update:rollback                                              # roll back a faulty update
```

- Passing `--environment production` matters: `EXPO_PUBLIC_*` values are embedded into the update's JS bundle at that moment. If you forget it, the update ships with the default values (without the analytics/purchase keys).
- `updates.url` only enters the config if `EAS_PROJECT_ID` is set at build time. Check before building: `EAS_PROJECT_ID=<uuid> npx expo config --type public | grep -A2 updates`.
- **Changes that need a new native build:** a new package or config plugin, permissions, native fields in `app.config.ts` (`associatedDomains`, `intentFilters`, `infoPlist`, icon, splash), a change to `EXPO_PUBLIC_DOMAIN` or `GOOGLE_IOS_URL_SCHEME`, an Expo SDK upgrade. For these, `version` is bumped and a new build is sent to the store.

---

## 6. Universal links (iOS) and App Links (Android)

The app opens two kinds of https links:
- `https://<DOMAIN>/m/<KOD>`: challenge a friend (`src/app/m/[code].tsx` → `/challenge/<KOD>`)
- `https://<DOMAIN>/d/<token>`: the admin's link from Telegram to join a 1v1 (`src/app/d/[token].tsx`). Telegram buttons only accept https, so a universal link is required.

The custom scheme `maziturkiye://` also works, but https links are used for sharing. If the app is not installed, the same address opens the web page; the page shows the 6-digit code and copies it to the clipboard, and the app asks for the code on first launch (deferred deep link, `DECISIONS.md`).

### iOS (Associated Domains)

1. `app.config.ts` → `ios.associatedDomains: ["applinks:<DOMAIN>"]` (automatic, from `EXPO_PUBLIC_DOMAIN`).
2. The **`APPLE_TEAM_ID`** placeholder in `web/.well-known/apple-app-site-association` is replaced with Apple Developer → Membership details → Team ID (10 characters). Result: `"appIDs": ["ABCDE12345.com.maziturkiye.app"]`.
3. The file must be served at `https://<DOMAIN>/.well-known/apple-app-site-association` over **HTTPS, 200, without redirects** and with `Content-Type: application/json`. Apple's CDN does not follow redirects:

   ```bash
   curl -sI https://maziturkiye.com/.well-known/apple-app-site-association   # should be 200 + application/json, not 301/308
   curl -s  https://app-site-association.cdn-apple.com/a/v1/maziturkiye.com # the copy cached by Apple
   ```

   `"trailingSlash": true` in `web/vercel.json` may redirect extensionless files to a `/…/` address; always check after deploying (QA report).
4. Apple fetches the file through its own CDN when the app is installed and periodically afterwards; a change can take hours to propagate. After a change, delete and reinstall the app and test with a TestFlight build.
5. Long-pressing a link in Notes should show "Mazi Türkiye'de aç" (Open in Mazi Türkiye); a link typed into Safari's address bar does not trigger a universal link.

### Android (App Links)

1. `app.config.ts` → `android.intentFilters` (`autoVerify: true`, `https://<DOMAIN>/m/…` and `/d/…`).
2. **`PLAY_APP_SIGNING_SHA256_FINGERPRINT`** in `web/.well-known/assetlinks.json` is replaced with Play Console → Test and release → Setup → **App integrity** → App signing key certificate → **SHA-256**. Apps installed from Play are signed with Google's signature, not EAS's upload key.
3. So that it also works for builds installed outside Play (preview APK), the EAS upload/keystore SHA-256 is also added to the array: `npx eas-cli@latest credentials -p android` → Keystore → SHA256 Fingerprint. The array can hold more than one fingerprint.
4. Verification:

   ```bash
   adb shell pm verify-app-links --re-verify com.maziturkiye.app
   adb shell pm get-app-links com.maziturkiye.app          # maziturkiye.com: should be verified
   ```

   Google's tool: `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://maziturkiye.com&relation=delegate_permission/common.handle_all_urls`
5. The same Play signing **SHA-1** is also entered in the Android OAuth client in Google Cloud (for Google sign-in).

> If the domain changes (`maziturkiye.vercel.app` → `maziturkiye.com`): `EXPO_PUBLIC_DOMAIN` is updated, a **new native build** is made, and the `.well-known` files must be live on the new domain.

---

## 7. Notes and common pitfalls

- **Anonymous sign-in must be enabled in Supabase.** The daily game is played without an account; the app calls `signInAnonymously()` before the first RPC (`src/lib/supabase.ts`). If Dashboard → Authentication → Sign In / Providers → **Allow anonymous sign-ins** is off, every screen shows "Bağlantı kurulamadı" (Could not connect). Before launch, raise the anonymous sign-in limit in Authentication → **Rate Limits**: the default is 30 per hour per IP, and because Turkish mobile carriers share IPs (CGNAT), new users may get stuck on launch day. CAPTCHA (Cloudflare Turnstile) can be added if wanted.
  - `ensureSession()` is single-flight: concurrent calls open a single anonymous session (previously two anonymous users could be created on first launch). If it hits the rate limit (HTTP 429), it waits 1.5 / 4 / 9 s and retries; if it still fails, the screen shows "Şu an çok yoğunuz…" (We are very busy right now…) and a "Tekrar dene" (Try again) button. With no internet it says "İnternet bağlantısı yok gibi görünüyor…" (There seems to be no internet connection…) without waiting.
- **Identity sync (`src/lib/identity.ts`):** Whenever the Supabase user ID changes (first anonymous session, Apple/Google sign-in, new anonymous session after account deletion), `onAuthStateChange` runs PostHog `identify`, RevenueCat `configure`/`Purchases.logIn` and push token registration with the same ID. When the account is deleted (`SIGNED_OUT`), PostHog `reset` and RevenueCat `logOut` are called, old data on screen is cleared and a new anonymous session is opened. On a first launch without internet, the identity is linked on the first successful `refresh`.
- **The Google sign-in plugin is only added if `GOOGLE_IOS_URL_SCHEME` is set** (`app.config.ts`). The button appears on Android with `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, and on iOS only if `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and `GOOGLE_IOS_URL_SCHEME` are also set; if one is missing the button is hidden (previously it appeared on iOS and the Google SDK could crash the app because the URL scheme was missing). For Android, Google Cloud needs an Android OAuth client with package name `com.maziturkiye.app` + the Play signing SHA-1 (and the EAS keystore SHA-1); `google-services.json` is not needed on Android. Supabase → Authentication → Providers → Google: Web client ID + secret; the iOS and Android client IDs are also added to the "Authorized Client IDs" field. If you get a nonce error on iOS, turn on "Skip nonce checks".
- **Sign in with Apple:** `ios.usesAppleSignIn: true`. The bundle ID `com.maziturkiye.app` must be added to Supabase → Providers → Apple → **Client IDs** (it is the token audience for native sign-in); for web, the Services ID + key are entered separately. Apple requires Sign in with Apple in an app that offers Google sign-in (Guideline 4.8); the button is always visible on iOS and is Apple's official `AppleAuthenticationButton`.
  - **Apple token revocation on account deletion (App Store 5.1.1(v)):** If the user is linked with Apple, after the deletion confirmation the app gets a fresh `authorizationCode` with `AppleAuthentication.signInAsync()` and sends it to the `delete-account` function in the body as `{ apple_authorization_code }`; the function exchanges the code for a refresh token and revokes it at Apple. This needs the Supabase secrets `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` (the .p8 content of the Sign in with Apple key) and optionally `APPLE_CLIENT_ID`. If the user closes the Apple sheet, the app asks for confirmation and still deletes the account (the Apple link can be removed from iPhone Settings).
- **Anonymous → account migration:** A "merge ticket" is taken before sign-in and redeemed after sign-in, and scores, streak and Pro move to the new account (`src/lib/auth.ts`, `redeem_merge_ticket`).
- **RevenueCat:** Entitlement `pro`, Offering `default` → `$rc_lifetime` package → `pro_lifetime` in both stores (see `store/iap.md`). The user ID in RevenueCat is the Supabase user ID (`logIn` on sign-in, `logOut` on deletion; see identity sync). `profiles.is_pro` on the server is written by `revenuecat-webhook`; the webhook URL and Authorization header must be set in the RevenueCat dashboard.
  - **On the client, Pro = server `is_pro` OR store entitlement:** On each `refresh`, if the server says `is_pro: false`, `appState` asks RevenueCat (`hasProLocally`, with the same user ID). After a purchase/restore, Pro unlocks immediately and refreshes at increasing intervals from 2 s to 90 s until the server confirms; even if the webhook is late, the screen does not fall back to "Pro'yu aç" (Unlock Pro). Server-gated features (hints, archive, unlimited 1v1) unlock when the webhook arrives; meanwhile the hint says "Pro'n etkinleştiriliyor…" (Your Pro is being activated…). A server-side `sync-pro` function for a permanent fix is an open item in the QA report (Y1).
  - The Pro screen does not show a fixed price before the price comes from the store ("Fiyat yükleniyor…" (Loading price…)); if no offering arrives, "Tekrar dene" appears. `PRO_PRICE_DEMO` is only used in the demo build (screenshots).
- **Notifications:** The daily reminder is a local notification scheduled on the device (permission is asked at the end of the first round). Server notifications (streak in danger) go through Expo Push and need `EAS_PROJECT_ID`. On iOS the push key is added with `npx eas-cli@latest credentials` → Push Notifications. On Android the Expo push token needs a Firebase (FCM V1) setup: Firebase project → Android app `com.maziturkiye.app` → `google-services.json` (`android.googleServicesFile`, as a `--type file` environment variable in EAS) and the FCM V1 service account key in EAS credentials. `app.config.ts` adds this if the `GOOGLE_SERVICES_JSON` environment variable is set; the Firebase project has not been created yet (QA report O6). If permission is granted, the push token is re-registered on every identity change and app launch.
- **The map and fonts are bundled in the app;** they open without internet too. Photos come from the Supabase Storage image transformation URL (WebP). Without internet, every screen's loading path shows "Bağlantı kurulamadı" + "Tekrar dene"; a photo that fails to load shows "Fotoğraf yüklenemedi · Tekrar dene" (Photo could not be loaded · Try again) instead of a black box.
- **Error tracking:** PostHog `errorTracking.autocapture` (uncaught errors and rejected promises; console logs excluded) is on. Render errors are caught by `src/app/_layout.tsx` → `ErrorBoundary`: the app does not close, a "Beklenmeyen bir hata oldu" (An unexpected error occurred) screen appears ("Tekrar dene", "Uygulamayı yeniden başlat" (Restart the app)) and the error is sent with `captureException`. No personal data is attached. For native crashes, optional `@posthog/react-native-plugin` + `autocapture.nativeCrashes` (not installed).
- **Nickname filter:** `src/lib/nickname.ts` checks a Turkish/English profanity and insult list (normalizing Turkish letter and digit substitutions) on the client before saving. The server's `update_profile` currently only checks length/characters; adding the same list on the server is an open item (QA O7).
- **The web build** ships with `<html lang="tr">` (`app.config.ts` → `web.lang`; `src/app/+html.tsx` if switching to static output). This way uppercase labels are written with "İ".
- **No iPad:** `supportsTablet: false`. Portrait orientation only.
- **Encryption declaration:** `ITSAppUsesNonExemptEncryption: false` (HTTPS only). No export compliance question in TestFlight.
- **Privacy manifest:** `ios.privacyManifests` (UserDefaults, CA92.1). Third-party SDKs (PostHog, RevenueCat, Expo modules) bring their own manifests. No tracking, no ATT prompt.
- **Android permissions:** `RECORD_AUDIO`, `READ_MEDIA_IMAGES`, `ACCESS_FINE_LOCATION` are blocked. After the build, verify that `com.google.android.gms.permission.AD_ID` is not in the merged manifest (the Data safety form says the advertising ID is not used).
