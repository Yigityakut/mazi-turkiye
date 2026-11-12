# What you need to do (human gates)

The agent prepared these; they need to go through your hands because they require identity, payment, phone verification or legal approval.
Order matters. The Play account was opened in 2019: the 12 testers × 14 days rule does not apply (2026-11-04). The critical path is now the Apple account + EAS build.

Status markers: `[ ]` waiting · `[x]` done. Just tick the item you finished and commit it; the next agent reads from here.

---

## ⚡ One-time access (2026-11-04) — after this the agent does everything with these by itself

1. Supabase access token (supabase.com/dashboard/account/tokens) → `SUPABASE_ACCESS_TOKEN` in `~/.config/mazi/env`.
2. PostHog personal API key (All access) → `POSTHOG_PERSONAL_API_KEY` in the same file.
3. App Store Connect API key (Admin): the `.p8` file under `~/.config/mazi/`, Key ID and Issuer ID in the same env file (`ASC_KEY_ID`, `ASC_ISSUER_ID`).
4. `.claude/settings.local.json` permission rules (Supabase MCP, supabase/eas CLI, api.supabase.com and PostHog curl).
5. Signed-in sessions in Chrome: App Store Connect, Play Console, Google Cloud, Vercel, RevenueCat, PostHog.

Once this is done, the Supabase, Expo, PostHog, RevenueCat and Play items below belong to the agent; the user is not asked again.

## 🔴 Today (the ones that cause the most delay)

### 1. [ ] Supabase: run a single SQL file (1 min)
All migrations are live; only the **monthly cleanup job** is left (because it contains a delete statement, the Supabase MCP asks you for approval, and the dialog went unanswered).
Dashboard → `timeguessr` → SQL Editor → paste the contents of `supabase/migrations/20261104000700_cleanup.sql` → Run. Not required before launch.

### 2. [ ] Supabase settings (5 min)
Dashboard → `timeguessr` project:
- Authentication → Sign In / Providers → **Allow anonymous sign-ins: On**
- Authentication → Providers → **Apple**: On (Services ID and key once the Apple account is open, item 5)
- Authentication → Providers → **Google**: On (Web client ID + secret, item 7)
- Authentication → **Manual linking**: On
- Edge Functions → Secrets: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `REVENUECAT_WEBHOOK_AUTH` (a long random value); once RevenueCat and PostHog are open, `REVENUECAT_SECRET_KEY` (item 8), `POSTHOG_KEY`, `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID` (item 11). The internal call key was generated automatically in the database; you do not need to do anything.

### 3. [x] Google Play developer account (existing, 2019)
https://play.google.com/console/signup — **Recommendation: Personal account.** An organization account is exempt from the 12-tester rule but requires a D-U-N-S number (2–4 weeks).
If you have an old account (opened before November 2023), use it; the 12-tester rule does not apply.

### 4. [x] 12 closed testers — not needed (account opened before November 2023)
The invitation text and instructions are ready: `marketing/testers.md`. Friends, family, Turkish developer communities (e.g. Teknoseyir; not r/KGBTR — rules). Collect each tester's **Gmail address** and add it to the list in `marketing/testers.md` (if you do not want to write the addresses to the repo, write only the count).
Testers must stay in the test **for 14 days**: they must not uninstall the app.

---

## 🟠 This week

### 5. [ ] Apple Developer Program ($99/year)
https://developer.apple.com/programs/enroll/ — Individual enrollment (Apple ID + two-factor authentication + ID). Then:
- App Store Connect → Business → **Paid Apps agreement**, bank account, tax form (**W-8BEN**; there is no Türkiye–US tax treaty, the 30% withholding line is empty/automatic).
- App Store Connect → Apps → **+ New App**: Platform iOS · Name `Mazi Türkiye: Tarih Tahmini` · Primary language **Turkish** · Bundle ID `com.maziturkiye.app` · SKU `mazi-turkiye-ios`.
- Write the Team ID in place of `APPLE_TEAM_ID` in `web/.well-known/apple-app-site-association` (or tell the agent).
- For Sign in with Apple: Certificates, Identifiers & Profiles → create a Services ID + Key → enter them in the Supabase Apple provider.
- Also enter the same Sign in with Apple key (p8) in Supabase Edge Functions → Secrets for Apple token revocation on account deletion: `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` (contents of the p8 file), `APPLE_CLIENT_ID` = `com.maziturkiye.app`.

### 6. [x] Expo account and EAS (done by the agent: @rubygamestudios/mazi-turkiye, projectId in app.config.ts)
https://expo.dev → account (the free plan is enough). In the terminal (or give the agent access):
```bash
cd app && npx eas-cli@latest init
```
Enter the resulting **projectId** as the EAS environment variable `EAS_PROJECT_ID`. Other environment variables: `app/README.md`.
Once the App Store Connect API key and the Google service account JSON are defined in the Expo connection (MCP), the agent uploads with `build_run` / `build_submit`.

### 7. [ ] Google Cloud (Sign in with Google)
console.cloud.google.com → new project "Mazi Türkiye" → OAuth consent screen (External, app name, support email, privacy URL) → Credentials:
Web client (for Supabase), iOS client (bundle ID), Android client (package name + Play signing SHA-1). Client IDs go into the `EXPO_PUBLIC_GOOGLE_*` variables.

### 8. [ ] RevenueCat
https://app.revenuecat.com → project "Mazi Türkiye" → connect the App Store and Play apps → Entitlement `pro`, product `pro_lifetime` (details: `store/iap.md`) → enter the public SDK keys as `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY` → Webhook URL and Authorization header (`store/iap.md`).
- RevenueCat → Project settings → API keys → **Secret API key (v1)** → Supabase Edge Functions → Secrets: `REVENUECAT_SECRET_KEY`. It is used by the `sync-pro` function, which enables Pro on the server right after a purchase/restore, and by `delete-account`, which deletes the RevenueCat subscriber on account deletion (without it, Pro is enabled only through the webhook and the RevenueCat step is skipped on deletion).

### 9. [ ] Domain + project email
- Check whether `maziturkiye.com` is available and buy it (the agent could not check from the container). If it cannot be bought: `mazituerkiye.com`, `maziturkiye.app`, `mazi.com.tr` (.com.tr requires documents).
- The `destek@maziturkiye.com` address (e.g. Zoho Mail free, forwarding to Gmail with Cloudflare Email Routing, or Google Workspace).
- Connect the `web/` folder to Vercel (Root Directory: `web`, framework: Other) → add the domain.

### 10. [x] Telegram bot — CANCELLED (user's decision; the code silently skips when there is no token)
@BotFather → `/newbot` → Name: **Mazi Türkiye Admin** · Suggested username: `maziturkiye_admin_bot` → put the token in the Supabase secret `TELEGRAM_BOT_TOKEN`.
Send the bot a message, then get the `chat.id` from `https://api.telegram.org/bot<TOKEN>/getUpdates` and write it to `TELEGRAM_ADMIN_CHAT_ID`.
Your admin account: sign in to the app with Apple and give the agent the ID shown at the bottom of Settings (the agent sets `is_admin = true`).

### 11. [ ] PostHog
Open a project in the EU region (for KVKK) → Project API key into `EXPO_PUBLIC_POSTHOG_KEY`.
Supabase Edge Functions → Secrets (if not entered, the related step is silently skipped):
- `POSTHOG_KEY` = the same Project API key (phc_…): the `duel_matched` event is sent from the server with the opponent type (`track-event`).
- `POSTHOG_PERSONAL_API_KEY` (PostHog → Settings → Personal API keys, scope **person:write**) and `POSTHOG_PROJECT_ID` (the number in the project settings): when an account is deleted, the PostHog person and events are deleted (`delete-account`).
- If the project is in the US region, also `POSTHOG_HOST=https://us.i.posthog.com` and `POSTHOG_API_HOST=https://us.posthog.com`. If your existing project is in the US, update the region line in the privacy text.

### 12. [ ] Social media accounts
Handles, bio and profile image are ready: `marketing/social/profiles.md`. `@maziturkiye` on Instagram, TikTok, X and YouTube (otherwise `@mazi.turkiye`, `@maziturkiyeapp`). Phone/email verification is on you.

---

## 🟢 Before launch

### 13. [ ] Legal text approval
`web/gizlilik`, `web/kvkk`, `web/kosullar`: fill in the placeholders marked in yellow (data controller's name/title, address, PostHog region). **Showing them to a lawyer is recommended.**
KVKK: for transfers abroad, a **standard contract** must be signed with the providers (Supabase, PostHog, RevenueCat, Expo) and reported to the Board within 5 business days. VERBİS registration: you are exempt if the annual number of employees is under 50 and the balance sheet is under 100 million TL (no special category data is processed).

### 14. [ ] Trademark search
https://www.turkpatent.gov.tr → Trademark search → "MAZİ TÜRKİYE" and "MAZİ", class **9** (software) and **41** (entertainment/games). Write the result in `DECISIONS.md`. Filing for registration is optional (paid).

### 15. [ ] ASO verification (15 min, Chrome)
In App Store and Google Play (Türkiye), type `tarih`, `eski fotoğraf`, `harita oyunu`, `bilgi yarışması` into the search box and add the autocomplete suggestions to `store/keywords.md`.

### 16. [ ] Real device testing
On TestFlight and the Play internal track: `store/release-checklist.md` → "Gönderim öncesi kontrol listesi" (pre-submission checklist).

### 17. [ ] SALT Research permission (optional)
Draft email: `marketing/outreach/salt-izin.md`. If you send it, write the reply in `DECISIONS.md`.
