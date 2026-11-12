# Status — handover note

_Last updated: 2026-11-04 (local session 1)_

> **Starting order for a new session:** this file → `HUMAN_TODO.md` → `DECISIONS.md` → "Next steps" below.
> Plan: `Plan.md`. User-facing texts (app, web, store) are in Turkish; internal docs are in English. Branch: `main` (repo: github.com/Yigityakut/mazi-turkiye, public).

## ✅ Done

| Area | What exists | Where |
| --- | --- | --- |
| Name and brand | **Mazi Türkiye**; icon, adaptive icon, splash, notification icon, OG and cover images | `store/brand/`, `app/assets/`, `marketing/social/`, `web/assets/og.png` |
| App | Expo SDK 58; all screens in Plan 5.3; embedded SVG Türkiye map; demo mode (`EXPO_PUBLIC_DEMO=1`, for screenshots). `npx tsc --noEmit` clean, web export works | `app/` (setup: `app/README.md`) |
| Backend (**live**) | Supabase `timeguessr` (Frankfurt): migrations 0100–0650 applied; 7 edge functions deployed; pg_cron jobs set up; internal call chain tested (DB → pg_net → function) | `supabase/` |
| SQL tests | 60/60 scenario tests with PGlite | `cd supabase/tests && npm install && npm test` |
| Photo pipeline | Candidate collection in GitHub Actions (runs when `pipeline/jobs/*.json` is pushed), review sheets, approval/import scripts | `pipeline/`, `.github/workflows/pipeline.yml`, `pipeline/REVIEW_GUIDE.md` |
| Photos (**live**) | 104 photos approved; 84 uploaded to Storage (40 daily, 36 1v1, 8 bonus); 5 days scheduled (14–18 November) | `pipeline/selection/pool-a.json`, `pool-bc.json` |
| Web | Landing (waitlist), privacy TR/EN, KVKK, terms, sources, support/FAQ, account deletion, challenge `/m/KOD`, admin `/d/token`, press kit, `.well-known`, `vercel.json` | `web/` |
| Store | TR/EN texts (limits checked), keywords, review note, App Privacy and Data safety answers, age questionnaire, IAP, in-app events, step-by-step release checklist, QA report | `store/` |
| Screenshots | Pipeline ready: demo mode, render script, CI. The current PNGs are **DRAFTS** (with placeholder photos) | `store/screenshots/`, `.github/workflows/screenshots.yml` |
| Marketing | Content calendar, caption templates, emails, profiles, tester kit, press release, Reddit, micro-account message, SALT permission email, HyperFrames "Bil bakalım" template (render tested) | `marketing/` |

## 📱 iOS / TestFlight (2026-11-12)

- App Store Connect: "Mazi Türkiye: Tarih Tahmini" (App ID 6833869544, team 8D5577P5QU, bundle `com.maziturkiye.app`).
- iOS build 21 (1.0.0) is on TestFlight; internal group "Team (Expo)", the project owner was invited.
- Identity: ASC API key `52FW696LZF` (issuer `fcbaa887-…`), `.p8` only locally: `~/.appstoreconnect/private_keys/` (thaledox Mac account). `eas.json` submit uses this path.
- Next iOS build: `cd app && EAS_NO_VCS=1 EXPO_NO_CAPABILITY_SYNC=1 EXPO_ASC_API_KEY_PATH=… EXPO_ASC_KEY_ID=52FW696LZF EXPO_ASC_ISSUER_ID=… EXPO_APPLE_TEAM_ID=8D5577P5QU eas build -p ios --profile production --non-interactive`, then `eas submit -p ios --profile production --id <build>`.
- Notes: EAS capability sync fails on "Sign in with Apple" because of an Apple API change (capabilities were enabled by hand; `EXPO_NO_CAPABILITY_SYNC=1`). Code name is ASCII (`Mazi Turkiye`), display name "Mazi Türkiye". On this Mac account git push cannot reach the Yigityakut repo (no gh login).

## ⏳ Unfinished (2026-11-07)

1. **Live backend complete:** migrations 0700–0900 and `sync-pro`, `track-event`, `delete-account` deployed; anonymous sign-in and manual linking enabled (verified live).
2. **EAS:** `@rubygamestudios/mazi-turkiye`; production/preview/development envs entered (Supabase URL/key, domain, support email, PostHog). Android production build #1 finished (versionCode 2, AAB `~/Downloads/mazi-turkiye-2.aab`); first upload to Play is manual (the Chrome tool is limited to 10 MB, and creating a service account key was blocked by a permission check). The iOS build stopped because there were no Apple credentials.
3. **PostHog:** EU project 338708 (it was an empty project and was reused). Token in EAS; `track-event` uses this public token by default. No `POSTHOG_PERSONAL_API_KEY`: the PostHog person is not deleted on account deletion (writing to the secret store is closed to the agent).
4. **Play Console:** app created (app id 4974085984465631793), internal test release page ready; the AAB is to be dragged and dropped.
5. **Photos:** 104 live + 35 approved (pool-c2); 72 selections in the repo, not imported (postponed).

**Put live in this session (2026-11-07):** Play internal test release 1.0.0 (2) is out; Play `pro_lifetime` ($5.99, 174 countries) active; RevenueCat project a0ea7bc5: Play app, `pro` entitlement, `default` offering ($rc_lifetime → pro_lifetime), Android SDK key in EAS. Web is on Vercel (`maziturkiye.vercel.app`) but *.vercel.app cannot be reached from Türkiye; the web is live on GitHub Pages: https://yigityakut.github.io/maziturkiye/ (repo `Yigityakut/maziturkiye`, to update: `node web/pages.mjs` → push the contents of `dist-pages/` to that repo). `public_web_url` and EAS `EXPO_PUBLIC_WEB_URL` are this address.

**User gates:** for purchase verification, RevenueCat secret key → Supabase `REVENUECAT_SECRET_KEY` and Play service account JSON → RevenueCat (writing secrets is closed to the agent). The domain will not be bought (user's decision).

## Done in this session

- Dependencies installed; `tsc` clean, SQL tests **62/62**.
- All code items in the QA report ✅ (`store/qa-report.md`); Y4, Y5, O6 are human tasks.
- Store screenshots with 6 real live photos (`store/screenshots/out/`); credits in `captions.md`. The credit for the CC BY-SA photo in the feature graphic must be added to the Play description.
- First 3 "Bil bakalım" videos: `marketing/videos/` (credits and sharing texts in the README). The end card contains the pre-24 November text.

## Next steps (in priority order)

1. Item 1 above: put the migrations and functions live.
2. Human gates (`HUMAN_TODO.md`): Apple (Play account exists, no 12-tester rule), `eas init`, environment variables.
3. Build: `npx eas-cli build -p all --profile production`; TestFlight and Play closed testing; on-device QA (`store/release-checklist.md`).
4. Deploy `web/` to Vercel; domain; write the Apple Team ID and Play SHA-256 into the `web/.well-known/` files; verify AASA with `curl`.
5. Feature graphic photo credit in the Play description.
6. (Postponed) Fill the photo pool up to 200: import the 72 ready selections; open periods 1920–1979.

## Blockers

- The network was restricted in the cloud container: Wikimedia, the Supabase API and store sites could not be reached. That is why some work was done through GitHub Actions and the Supabase MCP. Locally this restriction does not exist; `pipeline/harvest.mjs` can be run directly: `node pipeline/harvest.mjs pipeline/jobs/<iş>.json`, after `npm install --prefix pipeline`.
- Accounts (Apple, Google Play, Expo, RevenueCat, PostHog, Telegram, domain, social media) → `HUMAN_TODO.md`.

## Useful commands

```bash
cd app && npm install && npx expo start                  # app
cd app && npx tsc --noEmit                               # type check
cd supabase/tests && npm install && npm test             # SQL tests (62 scenarios)
python3 store/check_lengths.py                           # store text character limits
node marketing/templates/make-video.mjs <spec.json>      # generate video project, then: npx hyperframes@0.9.10 render
```
