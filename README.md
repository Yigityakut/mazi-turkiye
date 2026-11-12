# Mazi Türkiye

A daily photo guessing game made for Türkiye. Every day the player sees 5 real photos taken in Türkiye, drops a pin on the Türkiye map and guesses the year the photo was taken. At most 1,000 points per photo (500 location + 500 year), 5,000 points per day. The day resets every morning at 04:00 (Türkiye time).

Around the game there are: a challenge link to send a friend over WhatsApp, live 1v1 (an AI opponent if no opponent is found), daily and weekly leaderboards, statistics and a one-time **Pro** ($5.99, `pro_lifetime`). No ads at launch.

- **Store name:** Mazi Türkiye: Tarih Tahmini
- **Bundle ID / package name:** `com.maziturkiye.app` · **URL scheme:** `maziturkiye://` · **Domain:** `maziturkiye.com`
- **Target dates:** iOS 24 November 2026 (Tuesday), Android 3 December 2026 (Thursday). Android's 14-day closed test must start by 17 November at the latest.

> All product decisions are in `Plan.md` (in Turkish). The decisions in Section 1 cannot be changed.

---

## Where to start?

This project moves forward across multiple agent sessions. A newcomer (human or agent) reads in this order:

| File | What it is for |
| --- | --- |
| [`STATUS.md`](STATUS.md) | Latest state: finished work, unfinished work, the next 5 steps, blockers. **Look here first.** |
| [`DECISIONS.md`](DECISIONS.md) | Decision log (`date · decision · reason`). Check here before reopening a question. |
| [`HUMAN_TODO.md`](HUMAN_TODO.md) | Tasks only a human can do (accounts, payments, identity verification, testers, legal approval). |
| [`Plan.md`](Plan.md) | End-to-end project plan: game design, architecture, legal, store, ASO, marketing, KPIs. |
| [`store/release-checklist.md`](store/release-checklist.md) | App Store and Google Play upload checklist and launch day flow. |
| [`store/qa-report.md`](store/qa-report.md) | Latest QA report: automated checks and findings in order of severity. |

**Working rules (Plan, Section 0):** Every decision is written to `DECISIONS.md` as a single row. `STATUS.md` is updated at the end of every session. Passwords, API keys and tokens are **never** written to the repo: use EAS environment variables, Supabase secrets or a local `.env` (`.env` and `.env.*` are in `.gitignore`).

---

## Repo layout

```
/app            Expo app (iOS + Android + web preview)
/supabase       Postgres migrations, Edge Functions, SQL tests
/pipeline       Photo collection and validation scripts (GitHub Actions)
/web            Static site: landing, legal pages, challenge and admin link pages
/marketing      HyperFrames video templates, social media and launch texts, tester invitation
/store          Store texts, ASO, IAP, data forms, age rating, review note, brand images
/.github        pipeline.yml (photo pipeline workflow)
STATUS.md  DECISIONS.md  HUMAN_TODO.md  Plan.md
```

### `/app` — mobile app

Expo SDK 58, Expo Router (every file under `app/src/app/` is a screen), TypeScript. Because the map is an SVG embedded in the app (Natural Earth, public domain), it works offline and does not depend on a third-party map service. All server logic lives in Supabase RPCs; the client never receives the correct answer before the guess.

| Folder | Contents |
| --- | --- |
| `app/src/app/` | Screens: `index` (home screen), `onboarding`, `play`, `summary`, `duel/`, `leaderboard`, `stats`, `archive`, `pro`, `settings`, `sources`, `challenge/[code]`, `code`, `m/[code]` (challenge universal link), `d/[token]` (admin Telegram link) |
| `app/src/components/` | `TurkeyMap` (SVG map, pinch-zoom), `YearSlider`, `Photo` (full-screen zoom), `Reveal` (reveal + attribution), `CountUp`, shared UI |
| `app/src/lib/` | `api.ts` (RPCs), `supabase.ts` (anonymous session), `auth.ts` (Apple/Google + account merge), `purchases.ts` (RevenueCat), `analytics.ts` (PostHog), `notifications.ts` (local reminder + push token), `config.ts`, `theme.ts`, `demo.ts` (store screenshot mode) |
| `app/app.config.ts` | Dynamic Expo configuration; keys come from environment variables |
| `app/eas.json` | EAS build/submit profiles: `development`, `preview`, `production` |

**Running, environment variables, builds, store submission, OTA and universal links:** [`app/README.md`](app/README.md).

In short:

```bash
cd app
npm install
npx expo start                 # development server
npx tsc --noEmit               # type check
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest submit -p ios --profile production --latest
npx eas-cli@latest update --channel production --environment production --message "…"
```

### `/supabase` — backend

Project: `timeguessr` (ref `ybhiddgwunzyquzrbzaf`, **eu-central-1 Frankfurt**, EU region for KVKK). Postgres + Auth (anonymous, Apple, Google) + Storage + Realtime + pg_cron + pg_net.

**Migrations** (`supabase/migrations/`, applied in order):

| File | Contents |
| --- | --- |
| `…0100_core.sql` | Tables, scoring functions, RLS |
| `…0150_fix_core.sql` | Fix to `core` (removing the `photos.scheduled_date` uniqueness constraint); a separate file because `core` is applied in production |
| `…0200_game.sql` | Daily game RPCs (`get_me`, `get_day`, `submit_guess`, `use_hint`, `leaderboard`, `create_challenge`, `update_profile`, merge ticket…) |
| `…0300_duel.sql` | 1v1 matchmaking, duel state, bot, admin notification, `duel-tick` and `daily-ops` cron jobs |
| `…0400_seed_geo_storage.sql` | Province/region data, Storage buckets |
| `…0500_pipeline.sql` | Photo pipeline tables, `private.call_function` that calls Edge Functions from SQL, weekly/daily cron jobs |
| `…0600_web.sql` | Public RPCs used by the web pages |
| `…0700_cleanup.sql` | Monthly cleanup job |

Ways to apply (either one is enough):

```bash
# With the Supabase CLI
npx supabase@latest login
npx supabase@latest link --project-ref ybhiddgwunzyquzrbzaf
npx supabase@latest db push            # unapplied files under supabase/migrations
```

or run the files in order in Dashboard → SQL Editor (see `HUMAN_TODO.md` item 1).

**Edge Functions** (`supabase/functions/`, Deno):

| Function | Who calls it | What it does |
| --- | --- | --- |
| `delete-account` | The app (with the user's JWT) | Deletes the user and all linked rows |
| `revenuecat-webhook` | RevenueCat | `pro_lifetime` purchase/refund → `profiles.is_pro` |
| `notify-admin` | pg_net (`x-internal-secret`) | Telegram message to the admin at the 60th second in 1v1 |
| `push-notify` | pg_cron (`x-internal-secret`) | "Streak in danger" notification via Expo Push (23:00 Türkiye time) |
| `pipeline-harvest` | pg_cron (weekly) | Collecting candidate photos from Wikimedia Commons |
| `pipeline-ingest` | pg_cron (daily) | Uploading approved photos to Storage and scheduling them |
| `weekly-report` | pg_cron (Monday) | Weekly KPI report (Telegram) |

```bash
# Function called with the user's JWT: JWT verification stays on
npx supabase@latest functions deploy delete-account --project-ref ybhiddgwunzyquzrbzaf

# RevenueCat and pg_net do not send an Authorization header: JWT verification off, they do their own checks
for f in revenuecat-webhook notify-admin push-notify pipeline-harvest pipeline-ingest weekly-report; do
  npx supabase@latest functions deploy "$f" --no-verify-jwt --project-ref ybhiddgwunzyquzrbzaf
done

# Secrets (do not write the values to the repo)
npx supabase@latest secrets set --project-ref ybhiddgwunzyquzrbzaf \
  TELEGRAM_BOT_TOKEN=… TELEGRAM_ADMIN_CHAT_ID=… REVENUECAT_WEBHOOK_AUTH=… INTERNAL_SECRET=…
```

The `private.secrets` table must contain `functions_url` (`https://ybhiddgwunzyquzrbzaf.supabase.co/functions/v1`) and `internal_secret`; otherwise function calls from cron are silently skipped.

**Scheduled jobs (pg_cron, UTC):** `daily-ops` 01:00 (04:00 Türkiye time day rollover check and 14-day schedule warning) · `duel-tick` 5 s · `pipeline-ingest-daily` 00:30 · `pipeline-harvest-weekly` Monday 00:00 · `streak-danger` 20:00 (23:00 Türkiye time) · `weekly-report` Monday 06:00 · `monthly-cleanup` 1st of the month 02:00. The day boundary is computed in SQL (`(now() at time zone 'Europe/Istanbul' - 4 saat)::date`); cron only fills the schedule.

**Dashboard settings** (once): Authentication → **Allow anonymous sign-ins: on** (if off, the app cannot load any data), Apple and Google providers, Manual linking. Details: `HUMAN_TODO.md` item 2 and `app/README.md`.

**SQL tests:** `supabase/tests/` (local Postgres with PGlite; `cd supabase/tests && npm install && npm test`).

### `/pipeline` — photo pipeline

License rule (Plan, Section 3.1): only public domain, CC0, CC BY, CC BY-SA. No photo with an NC/ND license is taken; photos from competing games are not used.

- `pipeline/harvest.mjs`: candidate collection + automatic filtering (license, resolution, date, Türkiye border) + review sheets.
- `pipeline/jobs/*.json`: job files. When a new job file is pushed, `.github/workflows/pipeline.yml` runs and writes the results (`pipeline/data/*.candidates.jsonl`, `pipeline/review/<iş>/sheet-NN.jpg`) back to the same branch. Manually: Actions → photo-pipeline → Run workflow.
- Locally: `npm install --prefix pipeline && node pipeline/harvest.mjs pipeline/jobs/pool-a.json` (requires access to Wikimedia).
- `pipeline/geo/`: generation of the map data (Natural Earth 1:10m). Outputs are `app/src/data/turkeyMap.json` and `supabase/functions/_shared/geo.json`. Details: `pipeline/geo/README.md`.
- After launch the same rules run weekly on the server (`pipeline-harvest`, `pipeline-ingest`). Target: at least 50 new photos a week, with the schedule always 14 days ahead.

### `/web` — static site

Dependency-free HTML/CSS; no build step. Published on Vercel (Root Directory: `web`, Framework: Other). `maziturkiye.vercel.app` until a domain is bought.

| Path | Page |
| --- | --- |
| `/` | Landing (TR), `/en/` English |
| `/gizlilik/`, `/kvkk/`, `/kosullar/` | Privacy policy, KVKK information notice, terms of use (yellow placeholders await human approval) |
| `/kaynaklar/` | Photo attributions and licenses |
| `/destek/`, `/hesap-silme/` | Support and account deletion request (required by Google Play) |
| `/m/<KOD>` | Challenge link: opens via universal link if the app is installed, otherwise shows the 6-digit code |
| `/d/<token>` | The admin's Telegram link (joining a 1v1) |
| `/.well-known/apple-app-site-association`, `/.well-known/assetlinks.json` | Universal link / App Links verification (the `APPLE_TEAM_ID` and `PLAY_APP_SIGNING_SHA256_FINGERPRINT` placeholders must be filled in) |

Local preview: `npx serve web` (or `python3 -m http.server -d web 8080`). Publishing: push to the branch connected to Vercel. `web/vercel.json` defines rewrites and headers; after publishing, always check that the AASA file is returned without a redirect and with `application/json` (see `store/qa-report.md`).

### `/marketing` — marketing

| Path | Contents |
| --- | --- |
| `marketing/templates/bil-bakalim/` | HyperFrames "Bil bakalım" vertical video template (1080×1920) |
| `marketing/templates/make-video.mjs` | Generates a render-ready project from a photo record: `node marketing/templates/make-video.mjs <video.json>` → `npx hyperframes@0.9.10 check && npx hyperframes@0.9.10 render` (requires Node 22+ and FFmpeg) |
| `marketing/outreach/` | Press release, Reddit posts, micro-account collaboration message, SALT permission email |
| `marketing/social/profiles.md` | Social media handles, bios, attribution pattern |
| `marketing/testers.md` | Google Play closed test: invitation text and tracking table for 12 testers × 14 days |

Rules: The day's real photos are never shared. No "old" images are generated with AI. Every post includes photo attribution. No fake numbers, fake reviews or bought followers.

### `/store` — store

| File | Contents |
| --- | --- |
| `listing.tr.md`, `listing.en.md` | App Store and Google Play texts (character limits are checked with `python3 store/check_lengths.py`) |
| `keywords.md` | Keyword research (ASO) |
| `iap.md` | The `pro_lifetime` product and RevenueCat configuration |
| `privacy-forms.md` | Answers for Apple App Privacy and Google Data safety |
| `age-rating.md` | Answers for the Apple age rating and the IARC questionnaire |
| `review-notes.md` | App Review note (English) |
| `brand/` | Icon (`icon-1024.png`, `icon.svg`) and brand images |
| `screenshots/` | Store screenshots (generated with the app's demo mode; output in `store/screenshots/out/`) |
| `release-checklist.md` | Upload and launch checklist |
| `qa-report.md` | QA report |

---

## Third-party services

| Service | What for | Where the key is |
| --- | --- | --- |
| Supabase | Database, sign-in, storage, realtime, cron | App: publishable key (EAS env). Server: Supabase secrets |
| Expo / EAS | Builds, store submission, OTA, push | EAS environment variables and credentials |
| RevenueCat | `pro_lifetime` purchase and restore | Public SDK keys (EAS env), webhook authorization (Supabase secret) |
| PostHog (EU) | Analytics (Plan 10.2 event list) | Project API key (EAS env) |
| Google Cloud | Sign in with Google (OAuth clients) | Client IDs (EAS env), secret in the Supabase Google provider |
| Apple Developer | Sign in with Apple, App Store | Services ID + key in the Supabase Apple provider |
| Telegram Bot API | Admin notification and weekly report | Supabase secrets |
| Vercel | Website | Vercel account |
