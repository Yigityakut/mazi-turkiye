# Release checklist · Mazi Türkiye 1.0

Order matters: items are done from top to bottom. `[ ]` pending · `[x]` done. Items marked 👤 are **human gates** (identity, payment, contracts, phone verification); the agent prepares, a human completes (`HUMAN_TODO.md`).

Related files: `store/listing.tr.md` (copy) · `store/iap.md` (product) · `store/privacy-forms.md` (data forms) · `store/age-rating.md` (age) · `store/review-notes.md` (review note) · `store/qa-report.md` (open bugs) · `app/README.md` (build, environment variables, links) · `marketing/testers.md` (closed testing).

## Timeline

| Date (2026) | Event |
| --- | --- |
| 4–14 November | Fix Critical/High findings from the QA report, TestFlight and Play internal testing |
| **17 November (Tuesday)** | Google Play: the 12-tester rule does not apply (account from 2019), can go straight from internal testing to production. iOS 1.0 is submitted to App Review (17–18 November) |
| 23 November (Monday) | iOS must be approved and in "Pending Developer Release" status |
| **24 November (Tuesday)** | **iOS launch** |
| 1 December (Tuesday) | 14-day closed test ends → apply for production access (Google review usually ≤7 days) |
| **3 December (Thursday)** | **Android launch** (if production access is approved in time; if delayed, the date slips and is recorded in `DECISIONS.md`) |

---

## 0. Prerequisites (shared by both stores)

- [ ] **Critical** and **High** findings in `store/qa-report.md` are closed or deferred with a reason in `DECISIONS.md`.
- [ ] 👤 Legal texts approved and live: `/gizlilik/`, `/kvkk/`, `/kosullar/`, `/kaynaklar/`, `/destek/`, `/hesap-silme/` (yellow placeholders filled; HUMAN_TODO 13). The terms include the clause "Rakip bulunamadığında yapay zekâ rakip atanabilir." (An AI opponent may be assigned when no opponent is found.)
- [ ] 👤 Domain (`maziturkiye.com`) connected to Vercel, HTTPS works; `destek@maziturkiye.com` receives email (HUMAN_TODO 9).
- [ ] `web/.well-known/apple-app-site-association` → `APPLE_TEAM_ID` replaced with the real Team ID; `curl -sI https://maziturkiye.com/.well-known/apple-app-site-association` → **200**, `application/json`, no redirect.
- [ ] `web/.well-known/assetlinks.json` → Play App Signing SHA-256 (and EAS upload key SHA-256) entered (after Android step B3).
- [ ] Supabase: all migrations applied; Edge Functions deployed (root `README.md`); secrets entered (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `REVENUECAT_WEBHOOK_AUTH`, `INTERNAL_SECRET`).
- [ ] Supabase Auth: **Allow anonymous sign-ins on**; Apple and Google providers on (`com.maziturkiye.app` in Apple Client IDs); **Rate Limits → anonymous sign-in limit raised for launch** (default is 30 per hour per IP, not enough because of CGNAT).
- [ ] Photo schedule: **5 daily photos for each of the next 14 days** scheduled; at least 100 approved photos in the 1v1 pool; `daily-ops` sends no alerts.
- [ ] Telegram admin bot works (test message received); admin account has `is_admin = true`.
- [ ] RevenueCat: project, entitlement `pro`, offering `default` → `$rc_lifetime` → `pro_lifetime`; webhook URL and Authorization header set (`store/iap.md`); a test purchase sets `profiles.is_pro` to true.
- [ ] PostHog (EU) project open; production key in EAS; dashboard ready for the Plan 10.1 metrics.
- [ ] EAS `production` environment variables complete (`npx eas-cli@latest env:list --environment production`, list: `app/README.md` §2). **`EXPO_PUBLIC_DEMO` is not defined in any environment.**
- [ ] With `EAS_PROJECT_ID`, the output of `npx expo config --type public` has `updates.url` and `extra.eas.projectId` filled (for OTA and push).
- [ ] Screenshots generated (`store/screenshots/render.mjs`, captions in `store/screenshots/captions.md`): `store/screenshots/out/ios-6.9/` (1320×2868, 6 images) and `store/screenshots/out/android-phone/` (1080×1920; Play requires an aspect ratio of **at most 2:1**, and the iOS images are 2.17:1 so they cannot be used on Play). The Android set is completed to the same 6 screens as iOS.
- [ ] `python3 store/check_lengths.py` runs without errors.

---

## A. App Store Connect (iOS)

### A1. Account and agreements
- [ ] 👤 Apple Developer Program membership active (HUMAN_TODO 5).
- [ ] 👤 App Store Connect → Business → **Paid Apps Agreement: Active**; bank account and tax form (W-8BEN) done. Without this, in-app purchases cannot be tested even in sandbox.
- [ ] Team ID (Membership details) noted → AASA file (Section 0).

### A2. Identifiers and keys
- [ ] App ID `com.maziturkiye.app` (created by the first EAS build) capabilities: **Sign in with Apple**, **Associated Domains**, **Push Notifications**, In-App Purchase.
- [ ] 👤 Services ID + key for Sign in with Apple created and entered in the Supabase Apple provider.
- [ ] APNs key added to EAS: `npx eas-cli@latest credentials` → iOS → Push Notifications.
- [ ] App Store Connect API key (role: App Manager) created; given to EAS Submit and RevenueCat. For RevenueCat, an **In-App Purchase Key** (.p8) is also uploaded.

### A3. App record
- [ ] 👤 Apps → **+ New App**: Platform **iOS** · Name **Mazi Türkiye: Tarih Tahmini** (Mazi Türkiye: History Guess) · Primary Language **Turkish** · Bundle ID **com.maziturkiye.app** · SKU **mazi-turkiye-ios** · User Access: Full Access.
- [ ] App Information → General → **Apple ID** (10 digits) → `app/eas.json` → `submit.production.ios.ascAppId` (replacing `SET_AFTER_APP_STORE_CONNECT_RECORD`).

### A4. App Information
- [ ] Name: `Mazi Türkiye: Tarih Tahmini` (27/30) · Subtitle: `Eski fotoğraf, harita ve yıl` (Old photo, map and year) (28/30).
- [ ] Category: Primary **Games**, subcategories **Trivia** and **Puzzle** (Plan 7.1: Trivia, secondary Puzzle).
- [ ] Content Rights: "Contains third-party content" → **Yes, I have the rights** (public domain / CC0 / CC BY / CC BY-SA; attribution in the app and on `/kaynaklar/`).
- [ ] Age Rating: questionnaire answered honestly as in `store/age-rating.md` → expected **4+**.
- [ ] License Agreement: Apple Standard EULA (terms linked in the description).
- [ ] Optional: English (U.S.) metadata localization `store/listing.en.md` (the description must say the app is in Turkish).

### A5. Pricing and Availability
- [ ] Price: **Free**.
- [ ] Availability: all countries (Turks abroad are a secondary audience) or at least Türkiye.
- [ ] "iPhone and iPad Apps on Apple Silicon Macs" and Apple Vision Pro distribution **off** (not tested; `supportsTablet: false`).

### A6. In-app purchase: `pro_lifetime` (`store/iap.md`)
- [ ] Monetization → In-App Purchases → **+** → Type **Non-Consumable** · Reference Name `Mazi Türkiye Pro (ömür boyu)` (lifetime) · Product ID **`pro_lifetime`** (cannot be changed later).
- [ ] Price Schedule: base **5.99 USD**; other countries via Apple's automatic equalization. The Türkiye price is reviewed based on the first month's data (`DECISIONS.md`).
- [ ] Localization (Turkish): Display Name `Mazi Türkiye Pro` · Description `İpuçları, arşiv, sınırsız 1v1, tam istatistik` (Hints, archive, unlimited 1v1, full stats) (≤45).
- [ ] Family Sharing: **off** (cannot be turned off once on; decide after the first month's data).
- [ ] Review Information: screenshot `store/screenshots/iap-review.png` (Pro screen, 1290×2796) + note: "Home → Arşiv · Pro → Pro'yu aç, or tap 'Dönem ipucu' during a round." (Arşiv = Archive, Pro'yu aç = Unlock Pro, Dönem ipucu = Era hint).
- [ ] Status **Ready to Submit**.
- [ ] 👤 Users and Access → Sandbox → Testers: at least one sandbox Apple account.
- [ ] In RevenueCat, the App Store app is connected, `pro_lifetime` is imported and attached to the `pro` entitlement; offering `default` → Lifetime package.

### A7. App Privacy (`store/privacy-forms.md`)
- [ ] Privacy Policy URL: `https://maziturkiye.com/gizlilik/`
- [ ] Data Collection: "Yes"; categories: Contact Info → Email (Apple/Google sign-in only), User Content → Other, Identifiers → User ID, Usage Data → Product Interaction, Purchases → Purchase History, Diagnostics → Crash/Performance, Other Data → Gameplay. All **Linked to You**, none **Tracking**. Location: **not collected**.
- [ ] **Published** (a review cannot be submitted until it is published).

### A8. Build and TestFlight internal testing
- [ ] `app/app.config.ts` → `version: "1.0.0"`; production environment variables complete (Section 0).
- [ ] `cd app && npx eas-cli@latest build -p ios --profile production`
- [ ] `npx eas-cli@latest submit -p ios --profile production --latest` → App Store Connect → TestFlight "Processing" → "Ready to Test" (10–30 min). No encryption question appears (`ITSAppUsesNonExemptEncryption: false`).
- [ ] TestFlight → Internal Testing → group "Ekip" (Team) → internal testers added (App Store Connect users, at most 100); Test Information: description and feedback email `destek@maziturkiye.com`.
- [ ] The agent and the user ran **Section C** (Pre-submission checklist) end to end on their own phones with the TestFlight build.
- [ ] TestFlight → Crashes and Feedback empty (`testflight_crashes`, `testflight_feedback` in the Expo connection).

### A9. Version page (iOS App → 1.0 Prepare for Submission)
- [ ] Version number matches the build: **1.0.0** (fix it if the default is "1.0"; otherwise the build cannot be selected).
- [ ] **Screenshots → iPhone 6.9" Display:** `store/screenshots/out/ios-6.9/` (`01-nerede` … `06-istatistik`, 1320×2868, portrait; Apple accepts 3–10). Order (Plan 8.3): 1) photo + map of Türkiye + "Bu fotoğraf nerede, hangi yıl?" (Where is this photo, what year?), 2) reveal moment and score, 3) 1v1, then streak, challenge, stats. No fake user counts or made-up reviews. No iPad screenshots needed.
- [ ] App Preview (optional): only a real screen recording of the app; HyperFrames only for the frame/text.
- [ ] Promotional Text (≤170), Description, Keywords (`nostalji,bilgi,yarışması,…` 94/100), Support URL `https://maziturkiye.com/destek/`, Marketing URL `https://maziturkiye.com`: copied verbatim from `store/listing.tr.md`.
- [ ] Copyright: `© 2026 ‹VERİ SORUMLUSU ADI›` (data controller name) (placeholder filled in).
- [ ] Build: the latest production build in TestFlight selected.
- [ ] `pro_lifetime` added to the **In-App Purchases and Subscriptions** section (the first IAP is reviewed together with the binary; if not added, the review team cannot purchase → 2.1 rejection).
- [ ] Game Center: off.
- [ ] App Review Information: **Sign-in required: off** (no demo account, anonymous session) · contact name, phone, email · **Notes:** the English block in `store/review-notes.md` verbatim.
- [ ] Version Release: **Manually release this version** (launch by hand on 24 November).

### A10. Submitting for review
- [ ] Final check: Section C done; the daily photos are also ready on review days (schedule ≥14 days).
- [ ] **17–18 November:** Add for Review → Submit to App Review (review usually 24–48 hours; leaves room for one rejection).
- [ ] If rejected: read the reason in Resolution Center → fix → resubmit → record in `DECISIONS.md`. If it is a guideline question, write a clear reply in Resolution Center (bot explanation, account deletion path, sandbox steps are already in the note).
- [ ] Status after approval: **Pending Developer Release** (until 23 November).

### A11. Phased release
- [ ] Plan 7.1: phased release on. Apple's "Phased Release for Automatic Updates" option **only appears for updates** (1.0.1+); in 1.0, new downloads are open to everyone anyway. From 1.0.1 on it is turned on for every release (7 days: 1% → 2% → 5% → 10% → 20% → 50% → 100%; can be paused for up to 30 days). This note is recorded in `DECISIONS.md`.

---

## B. Google Play Console (Android)

### B1. Account
- [ ] 👤 Developer account (personal recommended; HUMAN_TODO 3), identity verification done, contact email/phone verified.
- [ ] 👤 **Payments profile** (merchant account) set up: required to create paid products.
- [ ] If the account was opened before November 2023 or is an organization account, B8–B9 (12 testers × 14 days) are skipped; the status is recorded in `DECISIONS.md`.

### B2. Create the app
- [ ] Home → **Create app**: App name **Mazi Türkiye: Tarih Tahmini** · Default language **Turkish – tr-TR** · App or game: **Game** · Free or paid: **Free** · Developer Program Policies and US export laws declarations checked.

### B3. First AAB (by hand) and app signing
- [ ] `cd app && npx eas-cli@latest build -p android --profile production` → download the `.aab` file.
- [ ] Test and release → Testing → **Internal testing** → Create new release → App signing: **Google-generated key** (Play App Signing, default) → upload `.aab` → release notes → Save → Review → **Start rollout to Internal testing**. (The Google API does not accept the first upload; later uploads use `npx eas-cli@latest submit -p android --profile production --latest`.)
- [ ] Internal testing → Testers: email list "Ekip" (Team) → set up and open with the opt-in link.
- [ ] Setup → **App integrity** → App signing key certificate: **SHA-256** → `web/.well-known/assetlinks.json`; **SHA-1** → Google Cloud Android OAuth client. The upload key (EAS) SHA-1/SHA-256 is also added in the same places.

### B4. In-app product: `pro_lifetime`
- [ ] Monetize with Play → Products → **One-time products** → Create: Product ID **`pro_lifetime`** · Name `Mazi Türkiye Pro` · Description `İpuçları, geçmiş günler, sınırsız 1v1 ve detaylı istatistik — tek seferlik` (Hints, past days, unlimited 1v1 and detailed stats — one-time) · purchase option: Buy · base price **5.99 USD**, other countries by automatic conversion · **Activate**. (The product cannot be created until an AAB with the BILLING permission is uploaded; B3 first.)
- [ ] In RevenueCat, the Play app is connected (service account JSON: permissions for financial data and order management) · Real-time developer notifications (Pub/Sub) set up per the RevenueCat guide · product imported and attached to the `pro` entitlement.
- [ ] Setup → **License testing**: test Gmail accounts added (free test purchases).

### B5. App content (Policy and programs → App content), answers in `store/privacy-forms.md`
- [ ] **Privacy policy:** `https://maziturkiye.com/gizlilik/`
- [ ] **App access:** All functionality is available without any access restrictions (no sign-in needed).
- [ ] **Ads:** No, my app does not contain ads.
- [ ] **Content rating:** IARC questionnaire (email `destek@maziturkiye.com`, category Game; answers in `store/age-rating.md`) → expected PEGI 3 / ESRB Everyone (with "Users Interact", "In-App Purchases" labels).
- [ ] **Target audience and content:** 13–15, 16–17, 18+; not aimed at children; no Families program.
- [ ] **News app:** No. **Government app:** No. **Financial features:** none. **Health:** not a health app.
- [ ] **Data safety:** table in `store/privacy-forms.md` → encryption in transit Yes, deletion request Yes, account deletion URL `https://maziturkiye.com/hesap-silme/`.
- [ ] **Advertising ID:** not used (after the build, verify that `com.google.android.gms.permission.AD_ID` is not in the merged manifest).
- [ ] If the console asks for other permission declarations (photo/video, exact alarm, foreground service, full-screen intent): not used.

### B6. Store settings
- [ ] App category: **Game → Trivia** · Tags (at most 5): Bilgi yarışması, Bulmaca, Tek oyunculu, Çok oyunculu, Çevrimiçi (Trivia, Puzzle, Single player, Multiplayer, Online).
- [ ] Store listing contact details: email `destek@maziturkiye.com`, website `https://maziturkiye.com`.

### B7. Main store listing (`store/listing.tr.md`)
- [ ] App name (27/30), Short description (80/80), Full description (≤4,000).
- [ ] App icon: 512×512 PNG, 32-bit, ≤1 MB (scaled down from `store/brand/icon-1024.png`).
- [ ] **Feature graphic: 1024×500** JPG or 24-bit PNG (required; not in the repo yet, must be produced).
- [ ] Phone screenshots: `store/screenshots/out/android-phone/` (1080×1920). 2–8 images, aspect ratio ≤2:1, at least 4 images and short side ≥1080 px to be eligible for promotion. Same order as iOS (Plan 8.3).
- [ ] Optional: promo video (YouTube URL), English translation (`store/listing.en.md`).
- [ ] Note: The full description says "Google ile giriş yapıp skorlarını koru" (Sign in with Google and keep your scores); if Google sign-in is not enabled in the production build, the sentence is removed.

### B8. Closed testing: 12 testers × 14 days (`marketing/testers.md`)
- [ ] Testing → **Closed testing** → track (default "Alpha") → Countries/regions: Türkiye (+ countries where testers are).
- [ ] Testers: email list "Kapalı test" (Closed test) → **at least 12, target 15–16** Gmail addresses (addresses are not written to the repo) → Save → copy the **opt-in link** → put it in place of `<PLAY_TEST_OPT_IN_LINK>` in the invitation text and send.
- [ ] Create release → **Add from library** (the AAB in internal) → Turkish release notes → Review → **Start rollout to Closed testing**. (The closed test release goes through Google review; hours to a few days.)
- [ ] **By 17 November at the latest:** 12+ testers opted in and installed the app from Play. The 14-day counter only advances while 12 testers are enrolled at the same time; watch the counter on the Dashboard.
- [ ] Tester tracking in the `marketing/testers.md` table; a backup is invited to replace a tester who drops out.
- [ ] During the test, bugs are fixed with new closed test releases (the counter does not reset). Feedback and the changes made are noted (asked in the production application).

### B9. Production access application
- [ ] When the 14 days are up (**1 December** with a 17 November start) Dashboard → **Apply for production** → questions answered with the draft in `marketing/testers.md` (how we found testers, how they used it, feedback and changes, is it ready) → submit.
- [ ] Until approval arrives (usually ≤7 days), the production release is prepared but not published.

### B10. Production release and staged rollout
- [ ] Publishing overview → **Managed publishing on** (an approved change does not go live until you click "Publish"; you decide the launch time).
- [ ] Production → Countries/regions: same countries as iOS.
- [ ] Production → Create new release → Add from library (latest AAB in closed testing) → release notes (`listing.tr.md` → "Bu sürümde (1.0)" (In this release (1.0))) → **Staged rollout: 20%** → Review → Start rollout to Production.
- [ ] **First release note:** Since there is no previously published release, a 20% staged rollout also limits new installs to about 20% of users. It is raised to 100% before the launch announcements (morning of 3 December); the 20% stage is started 1–2 days early as soon as approval arrives, and Android vitals are watched.
- [ ] Android vitals: user-perceived crash rate <1.09%, ANR <0.47% (Google's bad behavior thresholds). If there are no issues, 20% → 50% → 100%. On a sudden spike, **Halt rollout**, fix, new release.

---

## C. Pre-submission checklist

Plan 7.3 (verbatim):

- [ ] Daily game, the 04:00 day rollover and notifications tried on a real device
- [ ] 1v1: real player, admin notification (60th second) and bot (120th second) scenarios tried
- [ ] Challenge link tried with the app installed and not installed
- [ ] Pro purchase and restore tried in sandbox
- [ ] Account deletion works
- [ ] Every photo's attribution is visible
- [ ] Privacy, terms, support URLs open
- [ ] Without internet the app does not crash and shows a clear message
- [ ] Crash and analytics events reach PostHog

### C.1 How to test (iOS TestFlight + Android internal/closed, on both)

- **Daily game and day rollover:** Clean install → onboarding (3 steps) → 5 photos → reveal (line, year counter, score, story, attribution, "Fotoğrafı tekrar aç" (Open the photo again), "Bu bilgi yanlış mı?" (Is this info wrong?)) → day summary → share. Tapping the photo opens full-screen zoom (pinch, double tap), which works **on Android too**. With the app open between 03:58 and 04:02, the countdown resets and the new day loads; the streak increases correctly.
- **Notifications:** Permission is asked at the end of the first round (not at launch). The next day, a reminder arrives before finishing the round; after finishing, that day's notification does not arrive. Picking a fixed time in Settings works. Tapping the notification opens the app. On Android, the "streak in danger" push notification arrives (FCM configuration).
- **1v1:** (a) two real devices match, 45 s timer, reveal, result, rating change; (b) wait with a single device → at the 60th second a Telegram message to the admin → tapping the link joins the admin account to the match; (c) at the 120th second the bot joins, the bot name is from the fixed list, the screen says "Rakip bulunamazsa yapay zekâ rakip atanabilir." (If no opponent is found, an AI opponent may be assigned.); (d) a free user sees the Pro screen after 3 matches.
- **Challenge:** Day summary → "Arkadaşına meydan oku" (Challenge a friend) → WhatsApp. (a) On a device with the app installed, the link opens the challenge directly (iOS universal link, Android App Links "verified"); (b) on a device without it, the web page shows and copies the 6-digit code → install from the store → in onboarding "Meydan okuma kodun var mı?" (Do you have a challenge code?) → "Panodan yapıştır" (Paste from clipboard) → the same 5 photos → comparison.
- **Pro:** With a sandbox (iOS) / license tester (Android) account: hint chip → Pro screen → store price is shown (not the fallback "6 $") → buy → hint works, archive unlocks, 1v1 limit is lifted, Pro stays after closing and reopening the app. Delete and reinstall the app → "Satın alımı geri yükle" (Restore purchase) → Pro comes back. Purchase and restore are also tried **after signing in with Apple/Google** (QA finding).
- **Account deletion:** Settings → Delete account → confirm → data is gone, the app opens with a new anonymous session; also tried with an account signed in with Apple. Web: the `/hesap-silme/` request page opens.
- **Attribution:** On every reveal and 1v1 reveal, the author, source (link) and license (link) are visible; Settings → Sources and licenses is filled.
- **URLs:** Settings → Privacy, KVKK, Terms of use open in the in-app browser; the Support email opens; the privacy/support/marketing URLs on the store pages return 200.
- **No internet:** In airplane mode: first install (onboarding → game "Bağlantı kurulamadı" (Could not connect) + Tekrar dene (Try again)), guessing mid-game, leaderboard, stats, sources, Pro screen, 1v1 search and 1v1 match. None of them crash; every screen has a clear message; when the internet comes back, the "Tekrar dene" screen really recovers.
- **PostHog:** Live events show `app_opened`, `onboarding_completed`, `photo_guessed`, `day_completed`, `share_tapped`, `challenge_sent`, `challenge_opened`, `duel_search_started`, `duel_matched`, `duel_finished`, `paywall_viewed`, `pro_purchased`, `pro_restored`, `notification_opened`, `account_deleted`; no email/name in the events. When a test error is thrown (preview build only), an `$exception` event arrives.

### C.2 Extra checks
- [ ] Dark mode and large text size (Settings → Accessibility → Larger Text) do not break screens.
- [ ] The main flow can be navigated with VoiceOver / TalkBack (button labels in Turkish).
- [ ] On small screens (iPhone SE / 5.5" Android) and large screens, the map, year slider and "Tahmin et" (Guess) are visible on the game screen.
- [ ] Sign in with Apple and Google sign-in; moving anonymous scores to the account; sync between two devices.
- [ ] Version info at the bottom of Settings is correct (1.0.0 and build number).
- [ ] OTA: send a small text change to the preview channel (`npx eas-cli@latest update --channel preview --environment preview`); the app receives the update within two launches.

---

## D. Launch day flow

Times are in Türkiye time (TRT). The day opens on its own at 04:00.

### D.0 The week before launch (17–23 November)
- [ ] Social accounts open, profiles filled per `marketing/social/profiles.md`; 10–15 "bil bakalım" (guess what) videos published in the last 14 days (Plan 9.5; `marketing/templates/` + `make-video.mjs`; **never the daily photos**).
- [ ] Press release (`marketing/outreach/press-release.md`): ‹Ad Soyad› (full name), founder quote, date filled in; press kit page (`maziturkiye.com/basin`: screenshots, icon, logo) live or the link removed from the release.
- [ ] Reddit posts (`marketing/outreach/reddit.md`) read one last time against each community's rules.
- [ ] List of 20 micro accounts (`marketing/outreach/creators.md`, filled in by hand) ready; message in `marketing/outreach/influencer-dm.md`.
- [ ] If there is a waitlist on the landing page (Resend), the announcement email draft is ready.
- [ ] Pro promo codes: offer/promo code for `pro_lifetime` in App Store Connect, promo code in Play Console (for collaborations).
- [ ] iOS status **Pending Developer Release**.

### D.1 iOS launch · 24 November 2026, Tuesday
- [ ] **04:15** On a real device, check that the new day (#N) has opened and can be played; no alerts in `daily-ops` or Telegram.
- [ ] **08:30** Final check: Supabase healthy (Dashboard → Reports, Edge Function logs), PostHog receiving events, web pages open, AASA returns 200.
- [ ] **09:00** App Store Connect → 1.0 → **Release This Version**. It can take a few hours (at most 24 hours) to appear in the store; do not announce until `https://apps.apple.com/tr/app/id<APPLE_ID>` opens.
- [ ] **10:00** Once the link opens, replace the placeholders: `marketing/outreach/reddit.md` (‹link›), `marketing/outreach/press-release.md` (App Store link, ‹tarih› (date)), the App Store badge on the web landing page, social bio links (`?utm_source=<kanal>&utm_medium=profile`).
- [ ] **10:30** Announcement email to the waitlist (if any).
- [ ] **11:00** Press emails: Webrazzi, Webtekno, ShiftDelete.Net, Log, Teknoblog (`press-release.md`; a personal opening sentence for each).
- [ ] **12:00** Social media: launch "bil bakalım" video on Reels + TikTok + Shorts, X post, Instagram story (attribution pattern and AI label rules in `profiles.md`).
- [ ] **13:00** Your own circle: play the day's round, send the WhatsApp challenge link from the day summary (Plan 9.5.2).
- [ ] **17:00** Reddit posts (`reddit.md`; for r/Turkey, a time that overlaps with the US morning). Reply to comments as the founder for the next 2–3 hours.
- [ ] **All day:** When a 1v1 waiting notification arrives on Telegram, join the match as admin (lowers the bot rate on launch day). PostHog: `app_opened`, `onboarding_completed`, `day_completed`, `challenge_sent`, `paywall_viewed`, `pro_purchased`. Supabase: error logs, anonymous sign-in 429s. Personal replies in Turkish to App Store reviews within 48 hours (Expo connection: `appstore_reviews`, `appstore_reply_review`).
- [ ] **22:00** The day's numbers and observations go to `STATUS.md`; decisions made go to `DECISIONS.md`.

**Emergency:**
- JS-only bug → fix → try with `npx eas-cli@latest update --channel preview --environment preview --message "…"` → `--channel production --environment production`.
- Native bug → `version` 1.0.1 → build → submit → request an **expedited review** from App Review.
- Backend bug → migration / Edge Function fix right away.
- Copyright complaint → the photo in question is taken down immediately (Plan 11).
- Store rejection, a sudden rise in 1-star reviews, crash rate >1% → the user is notified via Telegram.

**First week (25–30 November):** personal collaboration message to the 20 micro accounts (`influencer-dm.md`, no bulk sending) · 1 video + 2–3 stories every day · reply to reviews within 48 hours · Plan 10.3 weekly loop (weakest link → one change).

### D.2 Android launch · 3 December 2026, Thursday
- [ ] **1 December:** Closed test completed 14 days → production access application (B9).
- [ ] **When approved (by 2 December at the latest):** Production release started with a 20% staged rollout (B10), Android vitals and `platform = android` in PostHog are being watched.
- [ ] **3 December 04:15** On an Android device, check that the new day has opened.
- [ ] **09:00** Raise the staged rollout to **100%** ("Publish changes" if Managed publishing is on). `https://play.google.com/store/apps/details?id=com.maziturkiye.app` opens from Türkiye.
- [ ] **09:30** App Links verified on a device installed from Play: `adb shell pm get-app-links com.maziturkiye.app` → `verified`; the challenge link in WhatsApp opens the app.
- [ ] **10:00** Update links: Google Play badge on the web landing page, social bios, an "Android sürümü çıktı" (The Android version is out) comment on the Reddit posts, a short follow-up email to the press that covered the iOS news (`press-release.md` → Google Play ‹tarih›).
- [ ] **11:00** Social media: "Android'de de yayında" (Now on Android too) post + a new "bil bakalım" video.
- [ ] **11:30** Thank the closed testers on WhatsApp (`marketing/testers.md` list).
- [ ] **All day:** Android vitals, Play reviews (`playstore_reviews`, `playstore_reply_review`; reply within 48 hours), PostHog, Supabase. If crashes rise, Halt rollout.
- [ ] **22:00** `STATUS.md` and `DECISIONS.md` are updated.
- [ ] **If production access is not ready by 3 December:** no Android announcement is made, the date is moved and recorded in `DECISIONS.md`; the iOS flow is not affected.
