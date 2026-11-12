# QA report · Mazi Türkiye 1.0 (iOS + Android)

_Date: 2026-11-04 · Scope: `app/` (Expo SDK 58), `app/app.config.ts`, `app/eas.json`; where relevant `supabase/functions`, `supabase/migrations`, `web/` · Method: automated checks + a line-by-line read of every file under `app/src`. Testing on a real device was **not done** (no simulator/device in the container); device tests are in `store/release-checklist.md` → Section C._

> Line numbers refer to the files as they were when this report was written. Because other agents keep working on `app/src`, some lines may have shifted; go by the file and function name.

## 0. Fix round (2026-11-04, second round)

Each finding's heading / row shows its status: **✅ fixed**, **🟡 partial** (client side done, server or human work remains), **⏳ open**.

| Severity | ✅ | 🟡 | ⏳ |
| --- | --- | --- | --- |
| Critical (2) | K1, K2 | – | – |
| High (6) | Y1, Y2, Y3, Y6 (Y1/Y2 waiting on secrets) | Y4, Y5 (human work) | – |
| Medium (13) | O1–O5, O7–O13 | O6 (human work: Firebase) | – |
| Low (18) | D1–D18 (D7, D11 waiting on secrets) | – | – |

**Verification:** `npx tsc --noEmit` 0 errors · `EXPO_PUBLIC_DEMO=1 npx expo export --platform web` ✅ (`<html lang="tr">`) · in the demo build, 11 screens opened in Playwright with no console/page errors · in the non-demo build, 9 screens were tried with Supabase requests blocked (no internet): all showed the Turkish "Bağlantı kurulamadı" ("Could not connect") + "Tekrar dene" ("Try again"), no uncaught errors. **Still not tested on a device** (purchase, Apple revocation, Android zoom, push).

**Findings from the screenshot agent (not previously in this report):**
- ✅ The `stats.tsx` chart looked flat: removed `alignItems: "flex-end"` from `styles.chart` (columns stretch, the bar sits at the bottom of the column); in Playwright all 14 bars have the correct height.
- ✅ The "⤢ Büyüt" ("Enlarge") badge was clipped on the 48 pt small preview in the reveal: added `badge={false}` to `PhotoCard` (and `interactive={false}`, which leaves the tap to the parent row).
- ✅ The 1v1 match screen no longer opens a Realtime `postgres_changes` subscription on the `duels` table (the table is closed to clients for privacy and is not in the publication); state comes only from 1.2 s `duel_state` polling, and requests do not overlap. The `duel_queue` subscription (search screen) remains.
- ✅ Web page language: `app.config.ts` → `web.lang: "tr"` (the single-page output uses this; uppercase labels now read "İSABETİ", "TÜRKİYE"), plus `src/app/+html.tsx` (`lang="tr"`) in case we switch to static output.

**Third round (2026-11-04):** remaining code work closed: `sync-pro` (Y1), `vercel.json` `.well-known` headers (Y6), server-side nickname filter (O7), "İl seç" ("Choose province") (O12), RevenueCat/PostHog deletion on account deletion (D7), reminder based on `next_rollover` (D9), `duel_matched` from the server (D11), `challenge_opened` source (D12), dead code (D13), queue cancellation in the background (D17), confirmed exit from duels + Android back button, 44 pt attribution links, font scale limit in the game panel (D18). Tests: `supabase/tests` 62/62 (new: nickname filter, server `duel_matched`), `npx tsc --noEmit` 0 errors. **To deploy (coordinator):** migrations `20261104000800_nickname_filter.sql`, `20261104000900_duel_events.sql`; edge functions `sync-pro`, `track-event` (new), `delete-account` (updated).

**Remaining open work (all human/account work):** Supabase secrets `REVENUECAT_SECRET_KEY` (Y1, D7), `POSTHOG_KEY` (D11), `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID` (D7), `APPLE_TEAM_ID`/`APPLE_KEY_ID`/`APPLE_PRIVATE_KEY` (Y2) · Supabase anonymous sign-in rate limit (Y5) · post-launch AASA `curl` check and the `APPLE_TEAM_ID` placeholder (Y6) · Firebase/FCM (O6) · pinning the project ID after `eas init` (Y4) · device tests.

## 1. Automated checks

| Check | Result | Note |
| --- | --- | --- |
| `npx tsc --noEmit` | ✅ 0 errors | TypeScript 6.0, `strict` |
| `npx expo-doctor` (v1.21.6) | ⚠️ 18/20 passed | The 2 failed checks are **network-related**: "Expo config schema" (`exp.host` could not be resolved) and "React Native Directory" (no server response). Access to expo.dev is blocked from the container. Checks for dependency versions, peer dependencies, duplicate packages, lock file, Metro, and store version requirements ✅. Should be rerun on a machine with network access. |
| `npx expo config --type public` | ✅ | Config resolves. With no environment variables, `owner`, `updates`, `extra.eas` are **empty** (see Y4). The Google Sign-In plugin is not added because `GOOGLE_IOS_URL_SCHEME` is missing (expected). |
| `npx expo export --platform web` | ✅ | 13 MB, all routes bundled |
| `npx expo export --platform android` | ✅ | Hermes bytecode 7.7 MB, 2,252 modules; the native JS bundle builds |
| `npx expo lint` | ⏭️ not run | The project has no ESLint config; the first run creates `eslint.config.js` and modifies `package.json` (outside this agent's file boundary). Recommendation: set up ESLint and review the `react-hooks/exhaustive-deps` warnings. |
| Assets | ✅ | `icon.png` 1024×1024 RGB (no alpha, App Store compliant), adaptive icon 1024 RGBA, notification icon 96 px |
| Android permissions (dependency manifests) | ✅ | `expo-notifications`: `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`. No `SCHEDULE_EXACT_ALARM`. `AD_ID` may be in RevenueCat's Maven package; the merged manifest should be checked after the build. |

## 2. Summary

| Severity | Count | Meaning |
| --- | --- | --- |
| **Critical** | 2 | Money/data loss or store rejection is almost certain; must be fixed before launch |
| **High** | 6 | Could block release or break launch day; must be fixed before launch |
| **Medium** | 13 | User experience, accessibility, or policy risk; recommended to fix in 1.0 |
| **Low** | 18 | Improvement; in 1.0.x updates |

The code is solid overall: scoring and the correct answer are on the server, and the answer never reaches the client before the guess; every reveal and the "Kaynaklar" ("Sources") screen have attribution; the bot is clearly disclosed; notification permission is requested at the end of the first round; account deletion and "Satın alımı geri yükle" ("Restore purchase") exist; main buttons are 44–54 pt and labeled; the map and fonts are bundled, so the app opens without internet; in the paths reviewed, no code was found that would crash when there is no internet. The main risks are **identity management** (the anonymous session, RevenueCat, and PostHog identities drifting apart) and **Pro entitlement depending only on the webhook**.

---

## 3. Findings

### Critical

#### K1. Two anonymous users can be created on first launch; RevenueCat/PostHog get tied to a different person than the session · ✅ fixed
- **Status (2026-11-04):** ✅ fixed. `ensureSession` is single-flight (concurrent calls share the same promise); identity sync is in one place (`app/src/lib/identity.ts`, `onAuthStateChange` + first launch): PostHog `identify` and RevenueCat `configure` use the same Supabase identity.
- **File:** `app/src/lib/supabase.ts:25-31` (`ensureSession`), `app/src/lib/appState.tsx:30-43`, `app/src/app/index.tsx:26` (`useFocusEffect(refresh)`)
- **Problem:** On a clean install, Home's `useFocusEffect(refresh)` call (child effect, runs first) and `AppStateProvider`'s `ensureSession()` call both see `getSession()` → `null` at the same time and **both** call `signInAnonymously()` (auth-js 2.118 does not deduplicate this; checked). Two anonymous users are created; the last-written session is stored. `identify()` and `configurePurchases()` may run with the first user's identity while game data runs with the second. Result: the purchase is recorded in RevenueCat under the **wrong** `app_user_id` → the webhook does not write `is_pro` to the player's profile → the user pays and Pro does not unlock. Also, every new user counts twice against the anonymous sign-in quota (see Y5).
- **Recommendation:** Share the in-flight request:
  ```ts
  let inflight: Promise<Session> | null = null;
  export function ensureSession(): Promise<Session> {
    inflight ??= (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) return data.session;
      const { data: anon, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      return anon.session!;
    })().finally(() => { inflight = null; });
    return inflight;
  }
  ```
  And move identity binding to one place: `supabase.auth.onAuthStateChange((_e, s) => s && syncIdentity(s.user.id))` (see K2).

#### K2. RevenueCat identity is not updated after Apple/Google sign-in or account deletion · ✅ fixed
- **Status (2026-11-04):** ✅ fixed. `purchases.ts` → `syncPurchasesUser(uid)` (`configure` on the first call, then `Purchases.logIn(uid)` if the identity differs); on `SIGNED_OUT` (account deletion) `Purchases.logOut()` + PostHog `reset`, and the new anonymous session is re-bound; RevenueCat calls are queued. After Apple/Google sign-in, PostHog `identify(yeniId)`.
- **File:** `app/src/lib/purchases.ts:9-14` (once `configured` is true, nothing else is ever done), `app/src/lib/auth.ts:11-17`, `app/src/app/settings.tsx:47-50` (`signIn`), `app/src/app/settings.tsx:51-61` (`deleteAccount`)
- **Problem:** RevenueCat is configured at launch with the anonymous user's identity. When the user signs in with Apple/Google in the same session, the Supabase identity changes but `Purchases.logIn(yeniId)` is not called; no new `identify` goes to PostHog either. A purchase or **restore** made in this session (the most common flow on a new device: sign in → restore) is written to the old anonymous identity; since the merge ticket has already been redeemed, `is_pro` never reaches the signed-in account. The same happens on account deletion: a new anonymous session is opened but RevenueCat stays on the deleted user's identity. The review notes present sign-in to the review team as optional; if the team signs in first and then purchases, hints return `pro_required` → **3.1.1 / 2.1 rejection**.
- **Recommendation:** Add to `purchases.ts`
  ```ts
  export async function syncPurchasesUser(uid: string) {
    if (!configured) return configurePurchases(uid);
    if ((await Purchases.getAppUserID()) !== uid) await Purchases.logIn(uid);
  }
  ```
  and call `syncPurchasesUser` + `identify` inside `onAuthStateChange` (on SIGNED_IN, not TOKEN_REFRESHED). Do the same for the new anonymous session after `deleteAccount`, together with `resetAnalytics()`. `Purchases.restorePurchases()` is not needed after sign-in; `logIn` is enough.

### High

#### Y1. Pro entitlement depends only on the webhook; Pro can switch back off 3 s after purchase · ✅ fixed (waiting on secret)
- **Status (2026-11-04, third round):** ✅ fixed. New edge function `supabase/functions/sync-pro`: called with the user's JWT, it writes `profiles.is_pro = true` if the `pro` entitlement is active in RevenueCat REST v1 (`GET /v1/subscribers/{uid}`, `REVENUECAT_SECRET_KEY`) (it only grants; refunds are handled in the webhook). Client: `api.syncPro()`; the `appState` confirmation loop calls `sync-pro` first on each attempt, then `get_me` (0.3 s → 90 s); if the store says Pro but the server does not (e.g. restore on another device), it starts once on its own during refresh. **Remaining:** the `REVENUECAT_SECRET_KEY` secret (HUMAN_TODO 8) and deploy.
- **Status (2026-11-04, second round):** 🟡 partially fixed (client). On the client, Pro = server `is_pro` OR RevenueCat entitlement (`hasProLocally(uid)`, merged by `appState` on every `refresh`); after purchase/restore Pro stays on locally and refreshes at increasing intervals from 2 s → 90 s until the server confirms; `addCustomerInfoUpdateListener` catches pending payments. **Open:** the server-side `sync-pro` Edge Function was not written; if the webhook is delayed, hints/archive/1v1 limit still return `pro_required` on the server (the hint screen says "Pro'n etkinleştiriliyor" ("Your Pro is being activated")).
- **File:** `app/src/app/pro.tsx:43-47` and `:57` (`setPro(); setTimeout(refresh, 3000)`), `app/src/lib/appState.tsx:17-28` (`setMe(m)` overwrites local Pro with the server value), `supabase/functions/revenuecat-webhook/index.ts`
- **Problem:** Hints, the archive, and the 1v1 limit are gated on the server by `profiles.is_pro`; only the RevenueCat webhook writes this field. If the webhook is delayed (can take minutes in sandbox), misconfigured, or goes to another identity because of K2: the `refresh` 3 s later returns `is_pro: false`, the screen reverts to "Pro'yu aç" ("Unlock Pro"), and hints return `pro_required`. The worst experience for a user who has paid.
- **Recommendation:** A `sync-pro` Edge Function called with the user's JWT: if `entitlements.pro` is active in the RevenueCat REST API (`GET https://api.revenuecat.com/v1/subscribers/{uid}`, secret key `REVENUECAT_SECRET_KEY` in a Supabase secret), it writes `is_pro = true`. When `buy` and `restore` succeed, first `await api.syncPro()`, then `refresh()`. Additionally, with `Purchases.addCustomerInfoUpdateListener`, call `syncPro` if the entitlement is active but `me.is_pro` is false. The webhook stays as a fallback.

#### Y2. Sign in with Apple token is not revoked on account deletion (App Store 5.1.1(v)) · ✅ fixed (client; waiting on secrets)
- **Status (2026-11-04):** ✅ fixed (client; waiting on secrets). For an Apple-linked account (`user.identities` / `app_metadata.providers`), after the deletion confirmation `AppleAuthentication.signInAsync()` → `authorizationCode` → `api.deleteAccount(code)` with `apple_authorization_code` in the body; the `delete-account` function revokes the code. If the user closes the Apple sheet, a separate confirmation deletes without Apple revocation. **Remaining:** the Supabase secrets `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` must be entered (otherwise the function returns `apple_not_configured`, and deletion still happens) and it must be tried on a device.
- **File:** `supabase/functions/delete-account/index.ts:11`, `app/src/lib/api.ts:40-45`, `app/src/lib/auth.ts:19-28`
- **Problem:** Apple requires apps that offer Sign in with Apple to revoke the user's tokens through Apple's REST API (`/auth/revoke`) when the account is deleted. The function only deletes the Supabase user. App Review often asks about this step.
- **Recommendation:** Simplest path: for an Apple-linked account, after the deletion confirmation get a fresh `authorizationCode` with `AppleAuthentication.signInAsync()` and send it in the body to `delete-account`. The function exchanges the code for a `refresh_token` via `https://appleid.apple.com/auth/token` (client_id `com.maziturkiye.app`, client_secret: an ES256 JWT signed with the Sign in with Apple key; secrets `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`), calls `https://appleid.apple.com/auth/revoke`, then deletes the user. The user's Apple identity is read from `auth.identities`.

#### Y3. No crash reporting and no error boundary (Plan 7.3: "Crash and analytics events reach PostHog") · ✅ fixed
- **Status (2026-11-04):** ✅ fixed. PostHog `errorTracking.autocapture` (uncaught errors + rejected promises, excluding console) and a `captureException` helper; `_layout.tsx` → `ErrorBoundary` ("Beklenmeyen bir hata oldu" ("An unexpected error occurred"), "Tekrar dene" / "Uygulamayı yeniden başlat" ("Restart the app")) sends the error without adding personal data. The native crash plugin (`@posthog/react-native-plugin`) was not installed.
- **File:** `app/src/lib/analytics.ts:16-22`, `app/src/app/_layout.tsx` (no ErrorBoundary)
- **Problem:** PostHog is configured only for events; uncaught JS errors and promise rejections do not go to PostHog. Because Expo Router `ErrorBoundary` is not exported, a render error closes the app in production. The last item of Plan 7.3 cannot pass as is; the "Crash Data" declared in App Privacy is not actually collected.
- **Recommendation:**
  ```ts
  ph = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST, personProfiles: "identified_only",
    errorTracking: { autocapture: { uncaughtExceptions: true, unhandledRejections: true, console: ["error"] } } });
  export const captureException = (e: unknown) => ph?.captureException(e);
  ```
  Add `export function ErrorBoundary({ error, retry }: ErrorBoundaryProps)` to `_layout.tsx`: `captureException(error)` + `ErrorState` ("Beklenmeyen bir hata oldu", "Tekrar dene" → `retry`). For native crashes, optionally `@posthog/react-native-plugin` + `autocapture.nativeCrashes`.

#### Y4. `EAS_PROJECT_ID` and `EXPO_OWNER` come only from environment variables · 🟡 partially fixed
- **Status (2026-11-04):** 🟡 partially fixed. As requested, they are still read from environment variables; the push code checks `extra.eas.projectId` → `Constants.easConfig.projectId` in that order and skips without crashing if neither exists; if `EAS_PROJECT_ID` is missing during an EAS build, `app.config.ts` writes a warning to the build log; `app/README.md` updated. **Open:** the recommendation to pin the values in code after `eas init` still stands (human work).
- **File:** `app/app.config.ts:15`, `:22`, `:74`
- **Problem:** To download environment variables from the server, the EAS CLI must first identify the project from `app.config.ts`; if these values are defined only in EAS, the CLI cannot find the project (it may offer to create a new one). In a build where they are forgotten, `updates.url` and `extra.eas.projectId` stay **silently** empty: an urgent fix cannot be shipped via OTA, and the Expo push token cannot be obtained (`notifications.ts:74-77` swallows the error). A silent failure that could close the hotfix path on launch day.
- **Recommendation:** Pin these two non-secret values in code after `eas init`: `owner: "<hesap>"`, `updates: { url: "https://u.expo.dev/<uuid>" }`, `extra.eas.projectId: "<uuid>"`. If you want to keep reading env, provide a default with `?? "<uuid>"`. Verify with `npx expo config --type public` before building.

#### Y5. The anonymous sign-in rate limit could stop launch day · 🟡 partially fixed (client)
- **Status (2026-11-04):** 🟡 partially fixed (client). `ERRORS.rate_limit` ("Şu an çok yoğunuz…" ("We're very busy right now…"); mapping for 429 / `over_request_rate_limit` / "rate limit"); on the anonymous sign-in rate limit it retries with 1.5 / 4 / 9 s backoff; with K1, one anonymous sign-in per install. **Open:** raising the limit in the Supabase dashboard, optional CAPTCHA (human work).
- **File:** `app/src/lib/supabase.ts:28` (`signInAnonymously`), `app/src/lib/format.ts:48-53` (`errorText`), Supabase Dashboard → Authentication → Rate Limits
- **Problem:** Supabase's default anonymous sign-in limit is 30 per hour per IP. Mobile carriers in Türkiye put many users behind the same IP via CGNAT; at launch/press time, new users see "Bağlantı kurulamadı". K1 doubles the problem because it counts every new install twice. Because `errorText` does not recognize 429 (`over_request_rate_limit` / "rate limit"), the message is also misleading ("Bir şeyler ters gitti" ("Something went wrong")).
- **Recommendation:** Before launch, raise the anonymous sign-in limit (e.g. a few thousand per hour) and consider Cloudflare Turnstile CAPTCHA against abuse (`signInAnonymously({ options: { captchaToken } })`). Add `rate_limit: "Şu an çok yoğunuz, birkaç dakika sonra tekrar dene."` to `ERRORS` and match it with `/rate limit|429/i`. Fix K1.

#### Y6. The AASA file may get caught by Vercel's `trailingSlash` redirect (universal links) · ✅ fixed (must be verified once live)
- **Status (2026-11-04, third round):** ✅ fixed. `web/vercel.json` now has `"trailingSlash": false` (the extensionless AASA path is not redirected; `cleanUrls` affects only `.html`); explicit `Content-Type: application/json` (+ 1 hour cache) for `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json`. **Remaining (human):** once the domain is connected, `curl -sI https://maziturkiye.com/.well-known/apple-app-site-association` → 200 + `application/json`; the `APPLE_TEAM_ID` placeholder in the AASA.
- **File:** `web/vercel.json:3` (`"trailingSlash": true`), `web/.well-known/apple-app-site-association`
- **Problem:** With `trailingSlash: true`, Vercel redirects extensionless paths to `/…/` with a 308; `apple-app-site-association` has no extension. Apple's CDN does not follow redirects → challenge (`/m/`) and admin Telegram (`/d/`) links do not open the app, breaking Plan 7.3's "challenge link" item and the admin flow. (`assetlinks.json` is not affected because it has an extension.)
- **Recommendation:** After launch, `curl -sI https://maziturkiye.com/.well-known/apple-app-site-association` → must be 200. If it returns 308, remove `trailingSlash` (page links are already in the `/gizlilik/` form) or test with an explicit `rewrites`/`headers` rule for `.well-known`. Apple's copy: `https://app-site-association.cdn-apple.com/a/v1/maziturkiye.com`. Also, the `APPLE_TEAM_ID` placeholder must be filled in.

### Medium

#### O1. "Tekrar dene" does not work on four screens (error state is not reset) · ✅ fixed
- **Status (2026-11-04):** ✅ fixed. On the four screens, `load` clears the error first; on the leaderboard, switching tabs reloads and a late response from the previous tab is ignored; the challenge error screen also has "Ana sayfa" ("Home"). In Playwright with Supabase blocked, 9 screens showed "Bağlantı kurulamadı" + "Tekrar dene".
- **File:** `app/src/app/leaderboard.tsx:20` and `:34`, `app/src/app/stats.tsx:18-20`, `app/src/app/sources.tsx:17-19`, `app/src/app/challenge/[code].tsx:16-19`
- **Problem:** Even when `load` succeeds, `err` is never set to `null`; since render does `if (err) return <ErrorState/>`, the screen stays in the error state even after the internet comes back. Switching tabs on the leaderboard does not recover it either. Plan 7.3's "clear message" requirement is met, but there is no recovery.
- **Recommendation:** `setErr(null)` at the start of every `load` (and on tab change on the leaderboard). Example: `const load = () => { setErr(null); setData(null); api.leaderboard(tab).then(setData).catch((e) => setErr(errorText(e))); };`

#### O2. Errors are not shown to the user during a 1v1 match · ✅ fixed
- **Status (2026-11-04):** ✅ fixed. During the match, an `ErrorBanner` below the top bar: on a connection error "Bağlantı koptu, yeniden bağlanılıyor…" ("Connection lost, reconnecting…") (removed once polling succeeds), on guess rejection (e.g. `round_closed`) the error text (cleared on the new round); on an initial load error a "Ana sayfa" button.
- **File:** `app/src/app/duel/[id].tsx:44` (`fetchState` error), `:77` (`send` error), `:80` (error is shown only when `!s`)
- **Problem:** If the connection drops after the match has started, or a guess is rejected with `round_closed`, `err` is set but is not shown anywhere: the timer runs down to zero, "Tahmin et" ("Guess") shows a loading state and nothing happens.
- **Recommendation:** When `err && s`, a thin strip below the top bar: `<Card><T color={c.bad}>{err}</T></Card>` ("Bağlantı koptu, yeniden bağlanılıyor…"). `fetchState` already does `setErr(null)` on success.

#### O3. `router.back()` does nothing when there is no back stack (deep link on cold start) · ✅ fixed
- **Status (2026-11-04):** ✅ fixed. `app/src/lib/nav.ts` → `goBack()` (`router.replace("/")` if not `router.canGoBack()`): game ✕, 1v1 "Vazgeç" ("Cancel"), Pro "Kapat" ("Close"), and the automatic close after purchase.
- **File:** `app/src/app/play.tsx:153` (✕), `app/src/app/duel/index.tsx:84` (Vazgeç), `app/src/app/pro.tsx:47` and `:66` (Kapat)
- **Problem:** When the app is opened via a challenge link while closed, the stack is `challenge → (replace) play`; pressing ✕ has no screen to go to (Expo Router warns "GO_BACK was not handled"), and the user stays in the game.
- **Recommendation:** `export const unstable_settings = { initialRouteName: "index" };` in `_layout.tsx` (puts the home screen beneath deep links) and/or a shared helper: `const close = () => (router.canGoBack() ? router.back() : router.replace("/"));`

#### O4. Google sign-in may crash on iOS without a URL scheme · ✅ fixed
- **Status (2026-11-04):** ✅ fixed. `googleConfigured()`: Web client ID on Android; on iOS, additionally the iOS client ID and `extra.googleIosUrlScheme` (true if `GOOGLE_IOS_URL_SCHEME` is defined). If any is missing, the button is hidden; `signInWithGoogle` does the same check.
- **File:** `app/src/lib/auth.ts:30-40` and `:46` (`googleConfigured`), `app/src/app/settings.tsx:102`, `app/app.config.ts:9` and `:70`
- **Problem:** The button appears only if `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set; the URL scheme is added only if `GOOGLE_IOS_URL_SCHEME` is set. If one is entered and the other forgotten, the Google Sign-In iOS SDK closes the app with a "missing URL scheme" exception. (Because the native module is in the package list, it links even without the plugin.)
- **Recommendation:** `app.config.ts` → `extra.googleIos: !!googleIosScheme && !!env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`; `googleConfigured = () => !!GOOGLE_WEB_CLIENT_ID && (Platform.OS !== "ios" || extra.googleIos)`.

#### O5. Photo zoom may not work on Android (no GestureHandlerRootView inside the Modal) · ✅ fixed (must be verified on an Android device)
- **Status (2026-11-04):** ✅ fixed (must be verified on an Android device). The `PhotoZoom` Modal content is wrapped in `GestureHandlerRootView`.
- **File:** `app/src/components/Photo.tsx:58-64`
- **Problem:** On Android, React Native `Modal` opens outside the main root view; in this case react-native-gesture-handler requires the content to be wrapped separately in `GestureHandlerRootView`. Otherwise pinch, pan, and double tap do not respond (Plan 2.1: "zoomable").
- **Recommendation:** `<Modal …><GestureHandlerRootView style={{ flex: 1 }}> … </GestureHandlerRootView></Modal>`. Verify on an Android device.

#### O6. No FCM configuration for server notifications on Android · 🟡 partially fixed
- **Status (2026-11-04):** 🟡 partially fixed. `app.config.ts`: if `GOOGLE_SERVICES_JSON` (EAS file variable) is defined, `android.googleServicesFile` is added; the command is in the README. **Open:** Firebase project, `google-services.json`, and the FCM V1 key (human work).
- **File:** `app/app.config.ts:42-58` (no `android.googleServicesFile`), `app/src/lib/notifications.ts:66-78` (error is swallowed with `catch {}`)
- **Problem:** On Android the Expo push token requires Firebase (FCM V1). Without `google-services.json`, `getExpoPushTokenAsync` fails, the token is not saved, and the "streak in danger" notification (Plan 2.7) never reaches Android. The local reminder keeps working.
- **Recommendation:** Firebase project → Android app `com.maziturkiye.app` → `google-services.json` to EAS as a file variable (`npx eas-cli@latest env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --environment production --visibility secret`), `android.googleServicesFile: process.env.GOOGLE_SERVICES_JSON`; the FCM V1 service account key to EAS with `npx eas-cli@latest credentials`.

#### O7. No content moderation for nicknames (App Store 1.2, Play UGC); contradicts `age-rating.md` · ✅ fixed
- **Status (2026-11-04, third round):** ✅ fixed. Migration `20261104000800_nickname_filter.sql`: `private.is_offensive_nickname` (same list and normalization as the client's `nickname.ts`; 0 differences in a 5,476-entry comparison), `update_profile` rejects offensive names with `bad_nickname_word` (the client shows "Bu takma ad kullanılamıyor…" ("This nickname can't be used…")). Test: the "nickname filter" scenario (15 blocked, 17 passing names: "Işık", "Nigar", "Amina", "fukara", "Gotham"…). The `store/age-rating.md` sentence was corrected. There is no "Takma adı bildir" ("Report nickname") flow in 1.0 (leaderboard rows carry no identity; decision in `DECISIONS.md`); reports go through the support email.
- **Status (2026-11-04, second round):** 🟡 partially fixed (client only). `app/src/lib/nickname.ts`: Turkish/English profanity and slur list, normalization (ı→i, ş→s, 0→o, 1→i, stretched letters), short roots only as whole words ("Işık", "Nigar", "Amina", "fukara" pass); Settings checks before saving ("Bu takma ad kullanılamıyor"). **Open:** the same check should be added to `update_profile` on the server (the client can be bypassed), there is no "report nickname" flow; the `age-rating.md` sentence should be corrected accordingly.
- **File:** `supabase/migrations/20261104000200_game.sql` (`update_profile`, character set check only), `app/src/app/leaderboard.tsx:47-55`, `app/src/app/settings.tsx:75-79`, `store/age-rating.md` ("kaba takma adlar filtrelenir")
- **Problem:** Nicknames are visible to everyone on the leaderboard and in challenges; there is no profanity filter, reporting, or blocking. `age-rating.md` is written as if a filter exists. For apps with user content, Apple requires filter + report + block + contact.
- **Recommendation:** A Turkish/English banned word list in `update_profile` (normalized, with `ı/i`, `0/o` etc. mapped) → `bad_nickname`. Long-press on a leaderboard row for "Takma adı bildir" (`report_nickname` RPC; at 3 reports the name is set to "Oyuncu" ("Player") and the admin is notified on Telegram). Until this is done, correct the `age-rating.md` sentence.

#### O8. The "Apple ile giriş yap" ("Sign in with Apple") button is not Apple's standard button · ✅ fixed
- **Status (2026-11-04):** ✅ fixed. On iOS, `AppleAuthentication.AppleAuthenticationButton` (SIGN_IN; BLACK in light theme, WHITE in dark; corner 27, height 54).
- **File:** `app/src/app/settings.tsx:101`
- **Problem:** A generic button drawn in a custom font (Inter) with the `` (U+F8FF) logo. Apple HIG requires the official button (or a custom button that follows the rules exactly); review may reject this under 4.0/4.8.
- **Recommendation:** `<AppleAuthentication.AppleAuthenticationButton buttonType={SIGN_IN} buttonStyle={scheme === "dark" ? WHITE : BLACK} cornerRadius={27} style={{ height: 54 }} onPress={() => signIn(signInWithApple)} />`

#### O9. On a first launch without internet, RevenueCat and PostHog identity are never set up · ✅ fixed
- **Status (2026-11-04):** ✅ fixed. Every successful `refresh` and every session event calls `syncIdentity(uid)` (idempotent); when the internet comes back later, RevenueCat/PostHog get bound. The Pro screen requests the offer once the pending identity operation completes.
- **File:** `app/src/lib/appState.tsx:33-38`
- **Problem:** If `ensureSession` fails on the first attempt, `identify` and `configurePurchases` are never called again; the user plays once the internet comes back, but until the app is restarted the Pro screen says "Mağaza bağlantısı kurulamadı" ("Could not connect to the store") and events go out without identity.
- **Recommendation:** The `onAuthStateChange` + `syncIdentity` solution in K1/K2 also closes this; alternatively, when `refresh` succeeds, `if (!purchasesReady()) configurePurchases(m.id)`.

#### O10. Notification permission and push token are only requested/saved in a narrow window · ✅ fixed
- **Status (2026-11-04):** ✅ fixed. Permission is asked when `days_completed >= 1` (once, via `notifAsked`); if permission is granted, the push token is re-registered on every identity change and at launch (`syncPushToken`). `addPushTokenListener` was not added (registration at launch is enough).
- **File:** `app/src/app/summary.tsx:43` (`m.days_completed === 1`), `app/src/lib/notifications.ts:58-78`
- **Problem:** Permission is asked only when the number of completed days is exactly 1: a user who signs in on another device (day count >1) or finishes the first round via a challenge may never be asked. The push token is saved only at the moment of permission; if the token is renewed, permission is granted later from Settings, or the user signs in and the identity changes, the token on the server goes stale.
- **Recommendation:** `if (m && m.days_completed >= 1 && !(await prefs.notifAsked()))`. Call `registerPushToken()` every time the app opens if permission is granted (cheap, idempotent); catch renewals with `Notifications.addPushTokenListener`.

#### O11. Text contrast below WCAG AA (Plan 5.2) · ✅ fixed
- **Status (2026-11-04):** ✅ fixed. `inkFaint` light `#756751` (bg 4.60:1, surface 5.15:1), dark `#988B76` (≥ 4.66:1 on all surfaces); new `accentOnSoft` (light `#963520` 5.38:1, dark `#F0907A` 5.46:1) for the Pro badge, the active hint/time chip, archive cells, your own row on the leaderboard, and the welcome numbers.
- **File:** `app/src/lib/theme.ts:9` (`inkFaint #9C8E79` on light background **2.68:1**), `:33` (in dark `#7D705E` 3.90:1), `accentSoft` on `accent` 3.92:1 (Pro badge, active hint chip)
- **Problem:** `faint` texts (footers, notes under the countdown, map year labels, placeholders) are below 4.5:1 at small font sizes.
- **Recommendation:** Light `inkFaint: "#756751"` (4.60:1), dark `inkFaint: "#908370"` (5.08:1). For text on an `accentSoft` background, `#963520` in light (5.38:1) or `ink`.

#### O12. The map cannot be used with a screen reader · ✅ fixed
- **Status (2026-11-04, third round):** ✅ fixed. `components/ProvincePicker.tsx`: when a screen reader is on (`AccessibilityInfo.isScreenReaderEnabled` + `screenReaderChanged`), in the daily game and 1v1 an "İl seç" button → alphabetical list of the 81 provinces (52 pt rows) → pin at the center of the chosen province (`data/provinceCenters.ts`: city center for large cities, otherwise the provincial center from `private.provinces`). The game map's screen reader label is "İğne bırakmak için aşağıdaki İl seç düğmesini kullan." ("Use the Choose province button below to drop a pin."). Must be tried on a device with VoiceOver/TalkBack.
- **Status (2026-11-04, second round):** 🟡 partial. `accessibilityLabel` added to the game, reveal, and welcome maps; the map, hint chips, leaderboard rows, archive cells, chart, and time chips are labeled. **Open:** the "İl seç" list for screen readers.
- **File:** `app/src/components/TurkeyMap.tsx:167-195`, `app/src/app/play.tsx` (map area)
- **Problem:** Dropping a pin is only possible with a touch gesture; a VoiceOver/TalkBack user cannot make a guess, and "Tahmin et" always stays disabled.
- **Recommendation:** If `AccessibilityInfo.isScreenReaderEnabled()` is true, an "İl seç" button below the map: a list of the 81 provinces (`MAP.provinces` + provincial center coordinate) → pin at the center of the chosen province. On the map, `accessibilityLabel="Türkiye haritası. İğne bırakmak için il seç düğmesini kullan."`

#### O13. The Pro screen shows "6 $" before the store price arrives · ✅ fixed
- **Status (2026-11-04):** ✅ fixed. Until the offer arrives, a disabled "Fiyat yükleniyor…" ("Loading price…"); if it never arrives, "Mağaza bağlantısı kurulamadı" + "Tekrar dene"; the fixed "6 $" appears only in the demo build (`PRO_PRICE_DEMO`, IAP review screenshot). Also top safe-area spacing on Android/web (not present on the iOS sheet card).
- **File:** `app/src/app/pro.tsx:37`, `:40`, `:91`; `app/src/lib/config.ts:20`
- **Problem:** Before offers load, the button says "Pro'yu aç · 6 $"; in Türkiye the real price is in TL and is different. If the offer never arrives (product not "Ready to Submit", no network), the review team cannot purchase and only sees "Mağaza bağlantısı kurulamadı".
- **Recommendation:** When there is no `pkg`, show the button disabled with "Fiyat yükleniyor…"; on error, "Tekrar dene" should call `proPackage()` again. Remove the fixed price text.

### Low

| # | File:line | Problem | Recommendation | Status |
| --- | --- | --- | --- | --- |
| D1 | `app/src/app/play.tsx:254-257` | The "Bu bilgi yanlış mı?" ("Is this information wrong?") report says "Bildirimin bize ulaştı" ("Your report reached us") even when it fails | Show "Gönderilemedi, tekrar dene" ("Could not send, try again") in `catch`; `setSent(true)` only on success | ✅ fixed: "Teşekkürler" ("Thanks") only on success; error text + loading state on the button |
| D2 | `app/src/app/summary.tsx:57` | "Tekrar dene" on the error screen drops the `challenge` parameter; the challenge comparison is lost | `params: { day: dayParam ?? "", challenge: challenge ?? "" }` | ✅ fixed: "Tekrar dene" calls the same `load`, `challenge` is kept |
| D3 | `app/src/app/summary.tsx:31-52` | If any of the leaderboard/challenge/stats requests fails, the whole summary screen goes to error | Only `api.day` is required; wrap the others in a separate `try` | ✅ fixed: only `api.day` is required; leaderboard, challenge, stats are separate and silent; share error on its own line |
| D4 | `app/src/app/index.tsx:48-54` | The "Meydan oku" ("Challenge") error on the home screen is swallowed with `catch {}`; the user sees nothing | `Alert.alert("Meydan okuma", errorText(e))` | ✅ fixed: `Alert.alert("Meydan okuma", errorText(e))` |
| D5 | `app/src/app/index.tsx:36-38` | If `refresh` fails after the day rollover (no internet), it retries every second | Keep the last attempt time in a `useRef`, retry at most once every 15 s | ✅ fixed: at most once every 15 s |
| D6 | `app/src/app/settings.tsx:82`, `:42-46`, `:114` | Errors from the "Sıralamada görün" ("Show on leaderboard") toggle, time selection, and `mailto` are not caught (silent failure) | `try/catch` + `setErr`; if `mailto` cannot open, `WebBrowser.openBrowserAsync(LINKS.support)` | ✅ fixed: toggle and time errors are caught; if `mailto` cannot open, the support page (`openMail`); all links via `openLink` |
| D7 | `app/src/app/settings.tsx:51-61`, `app/src/lib/api.ts:40-45` | No loading state on account deletion (double tap), the old `me` stays on screen; the Edge Function error message falls back to "Bir şeyler ters gitti"; RevenueCat/PostHog records are not deleted | `loading` on the button; clear `me` after deletion; in the function, RevenueCat `DELETE /v1/subscribers/{id}` and PostHog person deletion (consistent with the privacy policy) | ✅ fixed: loading on the button, `me` cleared after deletion, the function's `{ error }` text is read, RevenueCat `logOut` + PostHog `reset`; after deleting the user, `delete-account` deletes the RevenueCat subscriber (`DELETE /v1/subscribers/{id}`) and the PostHog person with their events (`persons/bulk_delete`, EU), skipping if a key is missing (secrets: `REVENUECAT_SECRET_KEY`, `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`) |
| D8 | `app/src/app/_layout.tsx:31-39`, `app/src/lib/notifications.ts:51`, `supabase/functions/push-notify/index.ts:29` | Notification data is sent with the `url` key, the listener reads `path`; a notification tapped while the app is closed is not caught (`notification_opened` is undercounted); `router.push` may be called before fonts load | One key (`url`) + `Linking.openURL`/`router.push`; use `Notifications.useLastNotificationResponse()` | ✅ fixed: `url` (and the old `path`) are read, cold start via `getLastNotificationResponseAsync`, navigation is queued until fonts load |
| D9 | `app/src/lib/notifications.ts:40-45` | For a user playing between 00:00–04:00 (game day is still yesterday), today's reminder is skipped; device clock abroad differs from Türkiye time | Compute the target time from the server's `me.next_rollover`: if played, first reminder after `next_rollover`; if not played, the first suitable time before `next_rollover` | ✅ fixed: `reminderAt(saat, oynandı, next_rollover)` as recommended; `appState` and Settings pass `me.next_rollover`; old rule if there is no server value |
| D10 | `app/src/app/play.tsx:130`, `app/src/app/duel/index.tsx:70`, `app/src/app/duel/[id].tsx:134`, `app/src/app/pro.tsx:33` | `paywall_viewed` is sent twice (both on the triggering screen and on the Pro screen); inflates the Pro conversion funnel | Send only in `pro.tsx` (`from` is already carried) | ✅ fixed: only in `pro.tsx` |
| D11 | `app/src/app/duel/index.tsx:25` | The `duel_matched` event lacks the opponent type (player/admin/bot) required by Plan 10.2 | To avoid exposing bot info to the client, send the event from the server (PostHog capture API) | ✅ fixed: migration `20261104000900_duel_events.sql` (`duels` insert trigger → pg_net → new `track-event` function → PostHog `/batch/`, `POSTHOG_KEY`; skipped if missing); properties `opponent_type`, `wait_s`; client event removed; test scenario exists |
| D12 | `app/src/app/challenge/[code].tsx:16` | `challenge_opened` is also sent with `source: "link"` for your own challenge and for manually entered codes | Take the `source` parameter from the route (`m/[code]` → link, `code` → manual), do not send when `is_mine` | ✅ fixed: not sent for your own challenge; source from the route (`/m/<KOD>` → `link`, code screen → `manual`, welcome → `deferred`; the separate event in welcome was removed, the event is sent if the code is valid) |
| D13 | `app/src/app/index.tsx:28-33`, `app/src/lib/prefs.ts:7` | `pendingChallenge` is never written anywhere (dead code) | Remove it or use it for a "later" option in welcome | ✅ fixed: `pendingChallenge` (index + prefs) removed |
| D14 | `app/src/components/YearSlider.tsx:14`, `:20` | The `last` ref is not synced with the incoming `value`; when the year resets on a new photo and the user drags to the previous year, `onChange` does not fire | `last.current = value` on every render (or `useEffect`) | ✅ fixed: `last.current = value` on every render |
| D15 | `app/src/lib/share.ts:26` | On iOS both `message` (with the link inside) and `url` are passed; some targets drop the text and share only the link, or show the link twice | `Share.share({ message })` (the link is already in the message) | ✅ fixed: `Share.share({ message })` |
| D16 | `app/src/components/ui.tsx:119` | The `ErrorState` title is "Bağlantı kurulamadı" for every error (e.g. wrong for "Bugünün fotoğrafları hazırlanıyor" ("Today's photos are being prepared")) | A `title` prop; "Bir sorun oluştu" ("A problem occurred") if not a network error | ✅ fixed: title depends on the error ("Bağlantı kurulamadı" / "Bir sorun oluştu"), `title` prop |
| D17 | `app/src/components/Photo.tsx:26`, `app/src/app/summary.tsx:103`, `app/src/app/archive.tsx:31`, `app/src/app/duel/index.tsx:43-49` | Without internet: the photo stays a black box (no error/retry); the archive loads forever if there is no `me`; polling errors in 1v1 search are silent, and the queue is not cancelled when the app goes to the background | `Image onError` → "Fotoğraf yüklenemedi · Tekrar dene" ("Photo could not be loaded · Try again"); `ErrorState` in the archive; on the search screen, a warning after 3 consecutive errors, `duelCancel` on `AppState` "background" | ✅ fixed: if the photo fails to load, "Fotoğraf yüklenemedi · Tekrar dene"; `ErrorState` in the archive; in 1v1 search, "Bağlantı zayıf" ("Weak connection") after 3 consecutive errors and "Tekrar dene" for the first error. When going to the background (`AppState` "background") the queue is cancelled, and on return "Arama durduruldu · Aramaya devam et" ("Search stopped · Continue searching") (decision in `DECISIONS.md`) |
| D18 | Accessibility: `app/src/app/settings.tsx:153` (chip 36 pt, no hitSlop), `app/src/app/leaderboard.tsx:65` (tab 40 pt), `app/src/components/Reveal.tsx:66` and `:79-86` (12 pt inline links, ~40 pt), `app/src/app/play.tsx:288` (hint chip 36+4), `app/src/app/_layout.tsx:21-28` (font error ignored), `app/src/app/duel/[id].tsx` (no exit in duels; Android back button exits without confirmation) | Plan 5.2: at least 44 pt. Stuck on splash on font load error. At large text sizes (`allowFontScaling`) the game panel may overflow | `minHeight: 44` or `hitSlop`; `const [loaded, fontErr] = useFonts(…); if (!loaded && !fontErr) return null;`; a confirmed "Maçtan çık" ("Leave match") in duels + `BackHandler`; `maxFontSizeMultiplier={1.3}` for large text | ✅ fixed: no longer stuck on splash on font error; time and hint chips 44 pt with `hitSlop`, leaderboard tab 44 pt; in duels ✕ "Maçtan çık" + confirmation dialog, the Android back button shows the same confirmation while a match is in progress (`BackHandler`); source/license links in the attribution and "Bu bilgi yanlış mı?" have separate 44 pt touch areas; `maxFontSizeMultiplier` 1.3 (`GAME_FONT_SCALE`) on the game panel and 1v1 score bar |

---

## 4. Store policy matrix

| Rule | Status | Note |
| --- | --- | --- |
| Apple 5.1.1(v) account deletion | ✅ / ⚠️ | In-app deletion exists (Settings → Hesabı sil ("Delete account")), web request exists. For an Apple-linked account, a fresh `authorizationCode` is obtained before deletion and sent to `delete-account` (Y2 ✅ client); **revocation will not work until the Apple secrets are entered in Supabase.** RevenueCat `logOut` after deletion (K2 ✅). |
| Apple 3.1.1 IAP + restore | ✅ / ⚠️ | RevenueCat, non-consumable `pro_lifetime`, "Satın alımı geri yükle" on the Pro screen. Identity issues fixed (K1, K2 ✅); Pro unlocks immediately on the client via the store entitlement, and on the server within seconds via `sync-pro` (Y1 ✅, `REVENUECAT_SECRET_KEY` must be entered). The price is not shown before it arrives from the store (O13 ✅). The IAP must be added to the version page (checklist A9). |
| Apple 4.8 Sign in with Apple | ✅ | When Google is offered, Apple is also offered on iOS; the button is Apple's official `AppleAuthenticationButton` (O8 ✅). |
| Apple 2.1 completeness | ⚠️ | The schedule must be filled on review days (checklist 0); if offers fail to load, purchase does not work (O13). Demo mode (`EXPO_PUBLIC_DEMO`) must not get into production. |
| Apple 1.2 user-generated content | ✅ / ⚠️ | Nicknames: profanity filter on the client and the server (O7 ✅); no in-app "report/block", abuse goes through the support email (no messaging). |
| Apple 5.1.2 / privacy, ATT | ✅ | No tracking, ATT not required, privacy manifest exists. There is no in-app "turn off" option for analytics; from a KVKK (Turkish data protection law) standpoint, a "Anonim kullanım verisi gönder" ("Send anonymous usage data") toggle (`ph.optOut()`) in Settings is recommended. The Crash Data declaration is now real (Y3 ✅; `EXPO_PUBLIC_POSTHOG_KEY` must be defined). |
| Apple 4.2/4.3 | ✅ | Original content and design, review note is clear. |
| Encryption (ITSAppUsesNonExemptEncryption) | ✅ | `false` |
| Play Data safety | ✅ / ⚠️ | Form is consistent; "Kilitlenme günlükleri" ("Crash logs") is correct with Y3 ✅. AD_ID must be verified in the manifest. |
| Play account deletion | ✅ | In-app + `/hesap-silme/` |
| Play UGC | ✅ / ⚠️ | O7 ✅ (client + server filter); no in-app report |
| Play target API, permissions | ✅ | SDK 58 current target API; microphone, media, location permissions blocked |
| Play store listing text | ⚠️ | The long description says "Google ile giriş" ("Sign in with Google"); if Google sign-in is not enabled in the production build, it must be removed from the text |

## 5. Plan 7.3 status table (based on code review; device testing pending)

| Item | Code status | Blocking finding |
| --- | --- | --- |
| Daily game, 04:00 day rollover, and notification on a real device | Ready | D9 ✅, O6 (Android push) |
| 1v1: real player, admin (60 s), bot (120 s) | Ready | O2 ✅, Y6 (admin link depends on AASA) |
| Challenge link with the app installed / not installed | Ready | Y6; O3 ✅ |
| Pro purchase and restore (sandbox) | Ready (must be tried on a device) | K1 ✅, K2 ✅, O13 ✅, Y1 ✅ (`sync-pro`; secret must be entered) |
| Account deletion | Ready (waiting on Apple, RevenueCat, PostHog secrets) | Y2 ✅ client, K2 ✅, D7 ✅ |
| Attribution for every photo | ✅ | Author + source link + license link in the reveal, the 1v1 reveal, and the Sources screen |
| Privacy, terms, support URLs | ✅ | Links are in the `/gizlilik` form (no trailing `/`); Vercel adds a redirect, it works |
| No crash without internet, clear message | Ready | Error + working "Tekrar dene" on every screen (O1 ✅, O2 ✅, D1 ✅, D17 ✅); 9 screens without internet verified in Playwright |
| Crash and analytics events to PostHog | Ready | Events ✅; JS errors + `ErrorBoundary` ✅ (Y3); native crash plugin optional |

## 6. Consistency with the plan

| Plan item | Status |
| --- | --- |
| 2.1 Full-screen, zoomable photo; reopening after the guess | ✅ (verify O5 on Android) |
| 2.1 Year range from the oldest year in the pool to this year | ✅ from the server in the daily game (`min_year`, `max_year`); fixed 1880–this year in 1v1 |
| 2.2 Scoring 500+500, exact-hit bonus | ✅ on the server; the copy in `geo.ts` is only for demo |
| 2.3 Streak large on the home screen, Wordle-style sharing, daily leaderboard | ✅ |
| 2.4 Challenge link and deferred deep link (6-digit code + clipboard) | ✅ |
| 2.5 1v1: 45 s, "Tahmini bekleme: 1–2 dk" ("Estimated wait: 1–2 min"), bot disclosure | ✅ |
| 2.6 Pro only at natural moments; no paywall mid-game | ✅ (hint chip, archive, 3rd match; passive link in Settings and Stats) |
| 2.7 Reminder time is the median of the last 7 days, 09:00–24:00, otherwise 20:00; permission at the end of the first round | ✅ (D9, O10) |
| 2.7 Server notifications: "meydan okuma geldi" ("challenge received"), "arkadaşın skorunu geçti" ("your friend beat your score") | ❌ Only "seri tehlikede" ("streak in danger") exists (`push-notify`); can move to 1.1, should be written in `DECISIONS.md` |
| 2.8 Anonymous play, Apple + Google sign-in, in-app deletion | ✅ (K1, K2, Y2) |
| 5.2 Touch target ≥44 pt, WCAG AA, dark mode | ✅ (O11, O12, D18); dark mode ✅ |
| 5.3 Screen list | ✅ All screens exist. Welcome plays the first photo after 3 steps |
| 6 Analytics does not identify the person | ✅ No personal data in event properties; the identity is a random Supabase UUID |
| 7.3 Crashes to PostHog | ✅ Y3 fixed |
| 8.4 Rating prompt: day 3 + above own average, no rating gate | ✅ |
| 10.2 Event list | ✅ (D10, D11, D12) |
| 13 "Bu bilgi yanlış mı?" button | ✅ (D1) |

## 7. Recommended fix order

1. K1 + K2 + O9 together: `ensureSession` deduplication + identity sync with `onAuthStateChange` (RevenueCat `logIn`, PostHog `identify`).
2. Y1 `sync-pro` Edge Function.
3. Y3 PostHog error tracking + `ErrorBoundary`.
4. Y4 pin `projectId`/`owner`; Y5 Supabase rate limit (dashboard setting) + `rate_limit` message.
5. Y2 Apple token revocation.
6. Y6 AASA verification (once the domain is connected).
7. O1, O2, O3 (small, quick fixes), O4, O5, O13.
8. O6 FCM, O7 nickname moderation, O8 Apple button, O10, O11, O12.
9. Low findings in 1.0.x.
