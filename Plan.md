# Türkiye Time-and-Place Guessing Game — End-to-End Project Plan

Nov 4, 2026 · @Yigit

## 0. Instructions for the executing AI

The AI carrying out this plan is the sole manager of the project: it makes every decision this document leaves open and does not ask the user questions. The settled decisions in Section 1 cannot be changed; everything else is at the manager's discretion.

**Working rules**

1. Every decision is written to `DECISIONS.md` as a single line: date, decision, rationale. The next agent does not reopen the same question.
2. At the end of every session, `STATUS.md` is updated: finished work, unfinished work, the next 5 steps, blockers. This project will not be finished in one session; the next agent picks up from here.
3. Code, content and documents are kept in a single private GitHub repo. Passwords, API keys and tokens are never written to the repo; `.env` and the relevant service's secret store are used.
4. The goal is shippable, not perfect. No more than 30 minutes are spent stuck on a step; an alternative path is chosen and written to the decision log.
5. Nothing is copied from competing apps (especially TimeGuessr): no name, logo, screen layout, text or images. Only the function and the genre are shared.

**Limits on Chrome access**

- No payments, subscriptions or billing details are entered on the user's behalf.
- Steps such as identity verification, phone verification, tax forms, bank details and agreement acceptance are left to the user (the human gates below).
- No irreversible actions such as deleting an account, deleting an app or taking an app off the store.
- No fake user accounts are created on social media, no fake reviews or ratings are produced, and no followers are bought.

**Human gates:** When the agent reaches these steps, it prepares the work, writes a clear instruction to `HUMAN_TODO.md` and moves on to other work. It does not lose time waiting.

| Gate | Why a human is needed | What the agent prepares |
| --- | --- | --- |
| Apple Developer account and Paid Apps agreement | Identity, payment, tax (W-8BEN), bank | Step-by-step instructions, list of fields to fill in |
| Google Play account (if none exists) | Identity and $25 payment | Recommendation on account type (individual or organization) |
| Finding 12 closed testers | Real people are needed | Invitation text, test link, instructions for testers |
| Opening social media accounts | Phone and email verification | Usernames, profile picture, bio texts |
| Telegram bot token | @BotFather from the user's account | Bot name and description |
| Final approval of legal texts | The user's responsibility | Ready-made texts |

## 1. Product summary and settled decisions

A daily guessing game specific to Türkiye: the player sees a photo taken in Türkiye, drops a pin on a map of Türkiye and guesses which year the photo was taken. The global example is TimeGuessr; our only differences are Türkiye-only photos, a Turkish-language experience and a much better design.

**Target audience:** Smartphone users aged 16–55 living in Türkiye who like nostalgia, history and Wordle-style daily games. Turks living abroad are a secondary audience.

**Unchangeable decisions**

| Topic | Decision |
| --- | --- |
| Scope | All photos will have been taken within Türkiye's borders. The player picks the location on a map of Türkiye. |
| Daily game | 5 photos every day. Refreshes every day at 04:00 (Türkiye time, UTC+3). |
| Reminder | A user who has not solved that day's game gets one notification between 09:00 and 24:00, based on the time they usually play. If they have solved it, none is sent. |
| Photo pool | 200 photos are enough for launch. The pool is grown later. |
| 1v1 | There is live 1v1 matchmaking. If no opponent is found, a bot opponent is assigned. |
| Bot rule | The terms of use include the clause "Rakip bulunamazsa yapay zekâ rakip atanabilir" ("If no opponent is found, an AI opponent may be assigned"). No fake numbers such as "thousands of active players" are used anywhere. |
| Admin notification | If matchmaking takes longer than 1 minute, a Telegram notification goes to the user (admin), who can join and play if they want. If there is still nobody by the 2nd minute, a bot joins. The screen shows "Tahmini bekleme: 1–2 dk" ("Estimated wait: 1–2 min"). |
| Challenge a friend | The user sends a link over WhatsApp; the friend plays the same 5 photos and the scores are compared. |
| Revenue | No ads at launch. One-time Pro: $6. Pro unlocks hints. |
| Copyright | Only licensed photos that allow commercial use, or photos whose copyright has expired, are used (Section 3). |

**Success measure (first 90 days):** The app is live in both stores, 40% of daily active users finish the day's 5 photos, the return rate within the first 7 days is above 20%, and the first Pro sales have come in.

## 2. Game design

The core of the game is the daily round of 5 photos. 1v1, the challenge link and Pro are built around this core. The numbers below are starting values; the managing agent may change them based on test results.

### 2.1 Flow of a single photo

1. The photo opens full screen; it can be zoomed.
2. The player drops a pin on the map of Türkiye and picks the year with the year slider (range: from the year of the oldest photo in the pool to the current year).
3. After "Tahmin et" ("Guess"), the correct location and year are shown along with the distance (km) and the year difference. The photo's short story and source (including license attribution) appear here.
4. The photo can be reopened after the guess (a gap TimeGuessr users complain about).

### 2.2 Scoring

At most 1,000 points per photo: 500 location + 500 year. Maximum daily score is 5,000.

```latex
\text{konum} = 500 \cdot e^{-d/150}, \quad \text{yıl} = 500 \cdot e^{-|\Delta y|/10}
```

Here (konum = location, yıl = year) d is the distance in kilometers and Δy is the year difference. A 50 km miss gives about 358 location points; a 5-year miss gives about 303 year points. Exact-hit bonus: under 1 km, or getting the year exactly right, rounds that part up to 500.

### 2.3 Daily game, streak and sharing

- A new day starts at 04:00; the day's 5 photos are the same for everyone.
- **Streak:** The number of consecutive days played is shown large on the home screen.
- **Share text:** Wordle-style, a summary that does not give the photos away. Example: `#42 · 3.870/5.000` followed by one row of colored squares each for location and year. Shared with one tap to WhatsApp, X and Instagram Stories.
- **Daily leaderboard:** All of Türkiye and among friends.

### 2.4 Challenge-a-friend link

- The player sends a link over WhatsApp for a day's round they have finished. The link carries the same 5 photos and the sender's score.
- If the app is installed, the link opens the challenge directly; if not, it redirects to the store page and the challenge is not lost after installation (deferred deep link).
- Version 1.1 goal: the person opening the link can play on the web without installing the app. This significantly increases viral spread.

### 2.5 Live 1v1

- A match is 5 photos; both players see the same photo at the same time, with 45 seconds per photo. The player with the higher total score wins.
- 1v1 photos come from a pool separate from the daily game's pool, and a player never gets the same photo twice (when the pool runs out, the oldest-seen photos come back).
- A simple rating (Elo) is kept; matches are made between players with close ratings.
- **Matchmaking timeline:** At second 0 the search starts and the screen shows "Tahmini bekleme: 1–2 dk" ("Estimated wait: 1–2 min") → at second 60 a Telegram notification goes to the admin ("Rakip bekliyor, girmek için dokun" ("An opponent is waiting, tap to join")) → at second 120, if there is no real player or admin, a bot joins.
- **Admin mode:** The admin account looks like a normal player. Tapping the link in Telegram connects the app directly to the waiting match.
- **Bot behavior:** The bot's skill level is set close to the opponent's average score. Its guesses are produced by adding a random offset to the correct answer (about ±12 years, about 200 km for location). On each photo it guesses after a random time between 8 and 35 seconds. The bot takes its name from a fixed list of Turkish nicknames.

### 2.6 Pro (one-time, $6)

| Feature | Free | Pro |
| --- | --- | --- |
| 5 daily photos | Yes | Yes |
| Hints: era ("1960'lar" ("the 1960s")) and region ("Ege" ("Aegean")) | No | Yes; the maximum score for the part where a hint is used drops by 30% and it is flagged on the leaderboard |
| 1v1 matches | 3 per day | Unlimited |
| Archive of past days | No | Yes |
| Detailed statistics (accuracy by decade and region) | Basic | Full |
| Streak protector (missing 1 day a month does not break the streak) | No | Yes |

Pro is offered to free users only at natural moments: after the 3rd 1v1 match of the day, when the archive is tapped, when the hint button is pressed. No paywall appears in the middle of the daily game.

### 2.7 Notifications

- **Daily reminder:** A local notification scheduled on the device itself. Time = the median of the user's game start times over the last 7 days, clamped to 09:00–24:00; 20:00 if there is no history. When the day's round is finished, that day's notification is cancelled.
- **Server notifications:** A challenge arrived, a friend beat your score, streak at risk (23:00).
- Notification permission is requested at the end of the first round, not as soon as the app opens.

### 2.8 Account

- The daily game can be played without creating an account (anonymous session).
- Sign in with Apple and Sign in with Google are offered for 1v1, a name on the leaderboard and cross-device sync. Apple requires Sign in with Apple in apps that offer Google sign-in.
- In-app account deletion is mandatory (Apple rule).

## 3. Photo database

Launch requires 200 approved photos: 100 go to the daily game and 100 to 1v1. Since the daily game uses up 35 photos a week, 100 photos last about 3 weeks. So the weekly collection pipeline must be running automatically before launch and must add at least 50 new photos a week.

### 3.1 Sources and the license rule

The app is a commercial product. Only photos that allow commercial use and resizing are taken. No photo with a "non-commercial" (NC) or "no derivatives" (ND) license is used.

| Source | What it offers | Rule |
| --- | --- | --- |
| [Wikimedia Commons](https://commons.wikimedia.org) | The largest pool; every period of Türkiye | Only public domain, CC0, CC BY, CC BY-SA. The license is read from each file's page. API requests use a User-Agent carrying the project name. |
| [Library of Congress, Abdul Hamid II collection](https://www.loc.gov/pictures/collection/ahii/about.html) | Ottoman photos from 1880–1893 | The library neither grants nor denies rights; because of the photos' age, their copyright has expired. Each record's "Rights" field is checked. At most 15 photos are taken from this period (all from the same 13 years). |
| [Europeana](https://www.europeana.eu) | Photos of Türkiye in European archives | Only records found with the "open reuse" filter. |
| Flickr (Creative Commons) | Very plentiful after 2000, geotagged | Only CC BY, CC BY-SA, CC0, Public Domain Mark and "no known copyright restrictions" (Flickr Commons). An API key requires a Flickr account; if there is none, this source is skipped. |
| [SALT Araştırma](https://archives.saltresearch.org) | One of Türkiye's richest archives | Licensed CC BY-NC-ND, so it **cannot be used without permission**. The agent drafts a collaboration or permission request email; it is not touched until permission arrives. |
| [TimeGuessr](https://timeguessr.com) and similar | — | Photos and descriptions from competing games are strictly not used. |

Attribution is shown under every photo and on the "Kaynaklar" ("Sources") screen: author, source, license name and license link. CC BY and CC BY-SA require this.

### 3.2 Selection criteria

- **Year:** An exact year or at most ±1 year of uncertainty. Photos dated "approximately" or by a decade range are not taken.
- **Location:** Must be determinable to within 5 km. If there is no geotag, coordinates are derived from a known place in the title (for example Galata Bridge).
- **Quality:** Long edge at least 1,200 pixels; blurry, very dark or irrelevant photos are discarded.
- **Content:** Photos showing violence, death, terrorism, coups or political tension are not taken. Portraits whose main subject is an identifiable private individual are not taken; crowd and street photos are fine.
- **Difficulty mix:** About 30% of the pool easy, 50% medium, 20% hard. Signs and text may remain as clues, but photos that state the answer directly (for example a banner reading "İzmir 1985") are not taken.

**Distribution target for the launch pool (200 photos)**

| Period | Count |
| --- | --- |
| 1880–1919 | 25 |
| 1920–1949 | 30 |
| 1950–1979 | 40 |
| 1980–1999 | 40 |
| 2000–2026 | 65 |

Region rule: at least 10 photos from each of the 7 geographic regions. Istanbul does not exceed 30% of the total. 1950–1990 is the hardest period for finding copyright-free photos; if the target is not met, the shortfall is shifted to post-2000 and written to the decision log.

### 3.3 Collection pipeline

1. **Candidate collection:** At least 3 times as many candidates (600+ for launch) are pulled from the sources, together with license and metadata.
2. **Automatic filtering:** Those whose license, resolution, date and location fields do not meet the rules are dropped.
3. **Visual review:** A model that can read images scores quality, inappropriate content, the "Is it in Türkiye?" question and text that gives away the answer.
4. **Duplicate filtering:** Identical or very similar photos are removed using perceptual hashing.
5. **Metadata verification:** Year and location are cross-checked against the title and description on the source page; if inconsistent, the photo is discarded.
6. **Difficulty estimate and story:** Each photo gets a difficulty label and a 2–3 sentence Turkish story based on the information on the source page. Information not in the source is not invented.
7. **Processing and storage:** The image is resized to 1,600 pixels and converted to WebP, uploaded to Supabase Storage and written to the table.
8. **Scheduling:** A schedule is made 14 days ahead from the daily pool. Each day's 5 photos come from different regions and periods; at least one is easy and at least one is hard.

### 3.4 Table schema (photos)

| Field | Description |
| --- | --- |
| id | Unique identifier |
| image\_path | WebP file in Storage |
| year, year\_uncertainty | Year and ± uncertainty (0 or 1) |
| lat, lng, location\_name, region | Coordinates, place name, one of the 7 regions |
| difficulty | kolay / orta / zor (easy / medium / hard) |
| story\_tr | 2–3 sentence story |
| source\_name, source\_url, author | Source and author |
| license\_code, license\_url | For example CC BY-SA 4.0 |
| pool | daily or duel |
| scheduled\_date | If in the daily pool, the day it will be shown |
| status | aday / onaylı / yayında / emekli (candidate / approved / live / retired) |
| phash | Perceptual hash for duplicate checks |

## 4. Technical architecture

iOS and Android from a single codebase: Expo (React Native, TypeScript) on the front end, Supabase on the back end. This choice was made because it is the stack coding agents know best and because Expo's cloud builds do not require a Mac.

| Layer | Choice | Note |
| --- | --- | --- |
| App | Expo SDK (current version), Expo Router, TypeScript | Builds, store submission and OTA updates through EAS. |
| Map | MapLibre React Native + [OpenFreeMap](https://openfreemap.org) | OpenFreeMap is free and needs no key, but offers no guarantee. Fallback: serving a PMTiles file covering Türkiye from our own storage. The game map should be plain: province borders and major city names, small place names hidden. |
| Database and sign-in | Supabase: Postgres, Auth (anonymous + Apple + Google), Storage | The user already has Supabase Pro credit. |
| Server logic | Supabase Edge Functions + pg\_cron | Day rollover via pg\_cron every day at 01:00 UTC (04:00 Türkiye). Scoring is computed on the server; the client never receives the correct answer before the guess. |
| 1v1 | Supabase Realtime | A matchmaking queue table, one channel per match, the timer kept by the server. Bot guesses are generated on the server and published when their time comes. |
| Purchases | RevenueCat | One-time, non-consumable product: `pro_lifetime`. A restore purchases button is mandatory. |
| Notifications | expo-notifications (local) + Expo Push Service (server) |  |
| Analytics | PostHog | The user already has the Scale plan. Event list in Section 10. |
| Admin notification | Telegram Bot API | An edge function sends the admin a message with a link at second 60. Because Telegram buttons only accept https links, a universal link is used. |
| Links | Expo Router deep links + universal links (iOS) / App Links (Android) | This requires a web domain. Until a domain is bought, a free subdomain (for example Vercel) is used. |
| Web pages | Landing, privacy, terms, support, challenge page | Framer (the user has Pro) or a static site on Vercel; the agent chooses. |
| Marketing video | [HyperFrames](https://github.com/heygen-com/hyperframes) | Produces MP4 from HTML; Section 9. |

**Deferred deep link:** A challenge link opened while the app is not installed must not be lost on first launch. Simplest solution: the web page shows a 6-digit challenge code, and on first launch the app asks "Meydan okuma kodun var mı?" ("Do you have a challenge code?"). If the agent finds a better way, it chooses that.

**Repo layout**

```
/app            Expo app
/supabase       migrations, edge functions, seed
/pipeline       photo collection and verification scripts
/web            landing, legal pages, challenge page
/marketing      HyperFrames projects, images, content calendar
/store          store copy, screenshots, ASO notes
STATUS.md  DECISIONS.md  HUMAN_TODO.md
```

**Skills to install:** [appllama-app-design-skill](https://github.com/Appllama/appllama-skills) (native feel and design quality), `replica-entrepreneur` and `replica-launch` from [replica-skill](https://github.com/Jakeschincariol/replica-skill) (competitor review analysis, store copy), [Supabase agent skills](https://supabase.com/docs/guides/getting-started/ai-skills.md), the HyperFrames skills, [instagram-agent-skill](https://github.com/Jakeschincariol/instagram-agent-skill) (Reels and captions). Reference: [Open Paywall Gallery](https://github.com/paywallpro/paywall-gallery) (for designing the Pro screen; its license allows reference use only).

## 5. Design and brand

Design goal: a game that does not look "made by AI" and stands out in the store through its screenshots. TimeGuessr's weak interface is our main opportunity; design quality is treated as a feature.

### 5.1 Name

The managing agent picks the name itself. Criteria:

- Turkish, short (at most 14 characters), easy to say and spell.
- No app with the same name on the App Store and Google Play; does not conflict with a registered trademark in Türkiye (a TürkPatent trademark search is done).
- A username on Instagram, TikTok and X, and a domain, are available.
- Does not contain the words "TimeGuessr" or "GeoGuessr".

Starting candidates: "Neredeydi" ("Where was it"), "Kaç Yılıydı" ("What year was it"), "Zaman Pusulası" ("Time Compass"), "Anı Avı" ("Memory Hunt"). The store title is built as name + keyword (Section 8).

### 5.2 Visual direction

- **Feeling:** The warmth of leafing through an old photo archive, with the speed of a modern game. Paper tones, a light film texture, one accent color. Dark mode is designed too.
- **Typography:** A font that renders Turkish characters (ğ, ş, ı, İ) correctly and whose license allows commercial use (Google Fonts). Numbers in Turkish format: 5.000.
- **The most important moment:** The reveal after the guess. The line drawn on the map from the guess to the correct location, the year counter rolling to the correct year, the score counting up and haptic feedback. This moment is the addictive part of the game; the most care is spent here.
- **Reference study:** The flows of NYT Games, Duolingo (streaks), GeoGuessr and popular trivia apps are studied on Mobbin. Only patterns are learned from competitors; screens are not copied.
- **Rules:** The rules of the appllama design skill are followed (native controls, meaningful animation, verification in the simulator). Touch targets at least 44 pt, contrast WCAG AA.
- **Icon:** Drafts are produced with Nano Banana or Higgsfield, and the best one is cleaned up into a vector. 1024 pixels, no transparency, must be readable at small sizes.

### 5.3 Screen list

| Screen | Content |
| --- | --- |
| Welcome | At most 3 steps; teaches by having the player play the first photo instead of explaining the game. |
| Home | Today's card, streak, 1v1 button, challenge a friend, countdown to the new day. |
| Game | Photo, map, year slider, hint button (Pro). |
| Reveal | Correct answer, distance, year difference, score, the photo's story and attribution. |
| Day summary | Total score, leaderboard position, share, challenge. |
| 1v1 matchmaking and match | Waiting screen ("Tahmini bekleme: 1–2 dk" ("Estimated wait: 1–2 min")), match, result, rating change. |
| Leaderboard | Today, week, friends. |
| Archive | Calendar of past days (Pro). |
| Statistics | Average score, accuracy by decade and region. |
| Pro | One-time $6, feature list, purchase and restore. |
| Settings | Notification time, account, account deletion, sources and licenses, privacy, terms, support. |

## 6. Legal texts and compliance

Before launch, four texts must be live (privacy policy, KVKK disclosure notice, terms of use, sources and licenses page) and the data forms of both stores must be filled in. The agent prepares the texts; final approval belongs to the user, and having a lawyer review them is recommended.

| Text / task | What it must include |
| --- | --- |
| Privacy policy (TR + EN) | Data collected (anonymous ID, game scores, email if signed in, analytics events, notification token), purposes, retention period, third parties (Supabase, PostHog, RevenueCat, Expo), transfer abroad, how to delete the account, contact address. The stores require this page's URL. |
| KVKK disclosure notice (KVKK: Türkiye's personal data protection law) | Data controller, processing purposes, legal grounds, transfers, rights (KVKK article 11). Because the servers are abroad, the rules on transfer abroad are checked. Frankfurt (EU) is chosen as the Supabase region. |
| Terms of use | Game rules, fair play, the multiplayer clause: **"Rakip bulunamadığında yapay zekâ rakip atanabilir."** ("When no opponent is found, an AI opponent may be assigned.") That Pro is one-time and refunds go through the stores, account deletion, limitation of liability. |
| Sources and licenses | Each photo's author, source, license and link. In the app and on the web. |
| Analytics consent | PostHog events are collected in a way that does not identify the person. Since there are no ads or tracking, Apple's tracking permission (ATT) prompt is not needed; if ads are added, this is reassessed. |
| Apple privacy labels | The "App Privacy" form in App Store Connect is filled in consistently with the privacy policy. |
| Google data safety form | The "Data safety" form in Play Console is filled in with the same information. |
| Age rating | Apple's questionnaire and Google's IARC questionnaire are answered honestly. The target audience is not children; Google's family program is not joined. |
| Account deletion | In the app from Settings, plus an account deletion request page on the web (Google requires this). |
| Trademark | The result of the TürkPatent search for the chosen name is written to the decision log. Filing for registration costs money, so it is a human gate and not required for now. |

**Contact address:** The stores and legal texts need an email address in the project's name. Opening a new address may require phone verification, so this is also a human gate; the agent adds it to `HUMAN_TODO.md`.

## 7. Store preparation and upload

iOS is released first; Android follows at least 14 days later because of Google's closed testing rule. Builds and submissions are done with EAS (`build_run` and `build_submit` via the Expo connection).

### 7.1 App Store

1. An app record is created in App Store Connect (bundle ID, primary language Turkish, category Games → Trivia, secondary Puzzle). Only iPhone is supported (to avoid the burden of iPad screenshots).
2. **Human gate:** In-app purchases cannot be tested until the Paid Apps agreement, bank and tax forms are completed.
3. In-app product: non-consumable `pro_lifetime`, the price point closest to $6. Country prices are left to Apple's automatic equalization; the Türkiye price is reviewed based on the first month's data.
4. Internal testing on TestFlight: the agent tries all flows, and the user also tries them on their own phone.
5. Store page: the texts from Section 8, 6.9-inch iPhone screenshots, an app preview video if desired.
6. Review note: that it can be played without signing in; that in 1v1 an AI opponent is assigned if no opponent is found and that this is stated in the terms of use; how to test Pro with a sandbox test account. A clear note lowers the chance of rejection.
7. Submitted with phased release on. If rejected, the agent reads the reason, fixes it, resubmits and writes it to the decision log.

### 7.2 Google Play

1. The app is created in Play Console. **Human gate:** The payments profile (merchant account) is opened by the user.
2. Required forms: app access (no sign-in needed), ads declaration (no ads), content rating, target audience, data safety, account deletion URL.
3. In-app product `pro_lifetime` is created at the same price.
4. **Closed testing:** For personal accounts opened after November 2023, at least 12 testers must stay in the test for 14 days before going to production ([Google](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-GB)). The agent prepares the tester invitation text and instructions; finding testers is a human gate (friends, family, Turkish developer communities). If the account is an organization account or older, this step is skipped.
5. When closed testing ends, production access is applied for; after approval, a staged rollout (starting at 20%) is opened.

### 7.3 Pre-submission checklist

- [ ] Daily game, 04:00 day rollover and notification tested on a real device
- [ ] 1v1: real player, admin notification (second 60) and bot (second 120) scenarios tested
- [ ] Challenge link tested with the app installed and not installed
- [ ] Pro purchase and restore tested in sandbox
- [ ] Account deletion works
- [ ] Every photo's attribution is visible
- [ ] Privacy, terms and support URLs open
- [ ] The app does not crash without internet and shows a clear message
- [ ] Crash and analytics events reach PostHog

## 8. ASO — app store optimization

Goal: reach the first page in Türkiye's stores for searches such as "tarih oyunu" ("history game"), "eski fotoğraflar" ("old photos") and "bilgi yarışması" ("trivia"), and raise the download rate of visitors to the page. ASO is not a one-off job; it is a monthly cycle.

### 8.1 Keyword research

- **Free sources:** Autocomplete suggestions in the App Store and Google Play search boxes (in the Türkiye store, via Chrome), Google Trends (Türkiye), competitors' titles and subtitles.
- **Starting pool:** tarih, eski fotoğraf, nostalji, bilgi yarışması, tahmin, harita, coğrafya, Türkiye, günlük bulmaca, quiz, zeka, Osmanlı, eski İstanbul, yıl, nerede (history, old photo, nostalgia, trivia, guess, map, geography, Türkiye, daily puzzle, quiz, intelligence, Ottoman, old Istanbul, year, where).
- For each keyword, the estimated search volume, competition and relevance score are kept in `store/keywords.md`.

### 8.2 Store fields

| Field | Limit | Rule |
| --- | --- | --- |
| Apple: name | 30 characters | Name + the strongest keyword (example pattern: "İsim: Tarih Tahmin Oyunu" ("Name: History Guessing Game")). |
| Apple: subtitle | 30 characters | Second keyword group; does not repeat what is in the name. |
| Apple: keywords | 100 characters | Comma-separated, no spaces, words in the name and subtitle are not repeated, the singular form is enough. |
| Apple: promotional text | 170 characters | Not indexed in search; updated for current events and campaigns. |
| Google: title | 30 characters | Same logic as the name on Apple. |
| Google: short description | 80 characters | The two most important keywords and one benefit sentence. |
| Google: long description | 4,000 characters | Google indexes this: main keywords appear 3–5 times in natural flow, no stuffing. |

### 8.3 Visuals

- **The first 3 screenshots are decisive.** Order: (1) a photo + map of Türkiye + "Bu fotoğraf nerede, hangi yıl?" ("Where is this photo, what year?"), (2) the reveal moment and score, (3) 1v1. After that: streak, challenge, statistics.
- A 3–5 word benefit headline above each screenshot. No fake user numbers or made-up reviews.
- A 15–30 second app preview video is produced with HyperFrames (Section 9).

### 8.4 Ratings and reviews

- The store's own rating prompt is shown when the user completes their 3rd day and gets a score above their own average. No rewards are given for ratings, and no rating gate ("5 yıldız verdiysen devam et" ("continue if you gave 5 stars")) is set up.
- Every review gets a personal reply in Turkish within 48 hours (with the review reading and reply tools in the Expo connection).
- Recurring complaints in negative reviews go into the next version's work list.

### 8.5 Experiments and events

- The icon and first screenshot are A/B tested with **Apple Product Page Optimization** and **Google Store Listing Experiments**. Each test runs for at least 7 days.
- **Apple In-App Events:** In-app events appear as separate cards in search. Used for themed days: a 5-photo set specific to the theme on days such as New Year's, 23 April, 19 May, 29 October. No gamified events are held on days of remembrance (such as 10 November).
- Every month: ranking and conversion data are reviewed, weak keywords are changed, and the change is written to the decision log.

## 9. Marketing and social media

The game produces its own content: every photo is a "bil bakalım" ("guess what") video. There is no ad budget at the start; growth comes from organic short videos, the share text and WhatsApp challenges.

### 9.1 Channels and frequency

| Channel | Content | Frequency |
| --- | --- | --- |
| Instagram Reels, TikTok, YouTube Shorts | The same vertical video to all three channels | 1 per day |
| Instagram Stories | Video shares, polls ("sence hangi yıl?" ("which year do you think?")), the day's score distribution | 2–3 per day |
| X | A real stat of the day, the hardest photo of the week, a fact note | 1–2 per day |
| Reddit (r/Turkey, r/KGBTR, r/istanbul) | A transparent "I made this game" post in the founder's voice | Once at launch, following each community's rules |
| Tech press (Webrazzi, Webtekno, ShiftDelete.Net, Log) | Press release and press kit | Launch week |

### 9.2 Content types

1. **Bil bakalım ("guess what", main format):** A photo from the archive, a 5-second countdown, "yorumlara tahminini yaz" ("write your guess in the comments"), and at the end the answer and year on the map. **The day's actual photos are never shared**; only photos from past days or the bonus pool are used.
2. **The photo's story:** A 30–45 second mini history piece; only with information written in the source.
3. **Community stat:** "Dünkü 3. fotoğrafı oyuncuların sadece %9'u 5 yıl içinde bildi." ("Only 9% of players got yesterday's 3rd photo within 5 years.") Real data only.
4. **Weekly champions:** Leaderboard winners, only with the nicknames of players who give permission.
5. **Themed days:** The same calendar as the events in Section 8.5.

### 9.3 Video production pipeline with HyperFrames

[HyperFrames](https://github.com/heygen-com/hyperframes) is an open-source tool that produces MP4 from HTML and animation (requires Node.js 22+ and FFmpeg). It has its own skills for Claude Code: `claude plugin marketplace add heygen-com/hyperframes` and `claude plugin install hyperframes@hyperframes`.

1. **Templates** (`/marketing/templates`): (a) Bil bakalım, 15 s, 1080×1920. (b) The photo's story, 30–45 s. (c) Stat card, 8 s. (d) Store preview video.
2. **Data:** Every video is fed from the photo table: image, year, location, story, attribution.
3. **Voiceover:** Turkish via ElevenLabs, always the same brand voice.
4. **Render and check:** MP4 via `npx hyperframes render`; the agent checks the first and last frames of the video for text overflow, attribution and logo.
5. **Weekly production:** Every Monday 7 videos are produced and scheduled. Rendering is done on the Oracle server or in the agent's environment.

**Rules:**

- No fake images or videos of the past are generated with AI (for example an image generated as "1950'lerde Taksim" ("Taksim in the 1950s")). This would destroy the credibility of a history game. Higgsfield, Runway and Veo are used only for brand intros and abstract transitions.
- Every post's caption includes the photo attribution (example: "Fotoğraf: Eser sahibi, Wikimedia Commons, CC BY-SA 4.0" ("Photo: Author, Wikimedia Commons, CC BY-SA 4.0")).
- Platforms' AI content labeling rules are followed (AI voiceover is marked if required).
- Under Apple's rules, the App Store preview video consists of real screen recordings of the app; HyperFrames is used only for the frame and text.
- No followers, likes or comments are bought; no engagement through fake accounts.

### 9.4 Posting automation

- **To start:** The platforms' own schedulers are used (Meta Business Suite, TikTok, YouTube Studio, X). The agent fills them weekly via Chrome.
- **Later:** Fully automatic posting through n8n with the Instagram Graph API (requires a business account and Meta app review) and the YouTube Data API.
- Opening accounts and verifying them by phone is a human gate; the agent prepares the username, profile image and bio.

### 9.5 Launch sequence

1. **14 days before launch:** Social accounts are opened, 10–15 "bil bakalım" ("guess what") videos are published, an email waiting list (Resend) is opened on the landing page.
2. **Launch day (between Tuesday and Thursday):** Email to the waiting list, Reddit posts, press emails, WhatsApp challenge links to the user's own circle.
3. **First week:** Collaboration offers with a Pro code (using the stores' promo code feature) to 20 micro accounts (10K–200K followers) that produce nostalgia and history content. Messages are written personally; no mass spam.
4. **First month:** Measure which content type brings downloads (Section 10); put more weight on the winning type.
5. **Paid ads (optional):** A small test with Apple Search Ads, but only after organic conversion data comes in and if the user provides a budget (human gate).

## 10. Analytics, KPIs and growth loop

A single report is produced each week and sent to the user over Telegram: five key numbers, the change from last week and the 3 decisions the agent made that week. No other report is requested.

### 10.1 Key metrics and initial targets

| Metric | Definition | 90-day target |
| --- | --- | --- |
| Daily completion | Share of people who opened the app that day who finished the 5 photos | 40%+ |
| D1 / D7 retention | Share of installers who play again on day 1 and day 7 | 35%+ / 20%+ |
| Share rate | Share of players finishing the round who tap the share or challenge button | 10%+ |
| Challenge conversion | Opened challenge links that turn into installs | 15%+ |
| Pro conversion | Share of active users who buy Pro | 2%+ |
| 1v1 bot rate | Share of matches that end against a bot (hidden internal metric) | Should fall over time |

### 10.2 PostHog events

`app_opened`, `onboarding_completed`, `photo_guessed` (distance, year difference, time, hint), `day_completed` (total score), `share_tapped` (channel), `challenge_sent`, `challenge_opened`, `challenge_completed`, `duel_search_started`, `duel_matched` (opponent type: player / admin / bot, wait time), `duel_finished`, `paywall_viewed` (triggering moment), `pro_purchased`, `pro_restored`, `notification_opened`, `account_deleted`.

No personal data is written to event properties. To separate downloads coming from social media, campaign parameters in profile links and Apple's custom product pages are used.

### 10.3 Weekly loop

1. Read the numbers and compare with last week.
2. Find the weakest link (for example a low completion rate → the photos may be too hard).
3. Pick a single change, apply it, write it to the decision log.
4. Measure its effect the following week.

## 11. Post-launch operations

After launch, most of the work is recurring tasks; these are hooked up to scheduled jobs (pg\_cron, n8n on the user's Oracle server) and only exceptions are reported to the user.

| Frequency | Task | Automation |
| --- | --- | --- |
| Every day 04:00 | Opening the new day; checking that the 14-day schedule is full | pg\_cron. Telegram alert if the schedule drops below 7 days. |
| Every day | Replies to store reviews, crash check, short replies to social media comments | Agent session or n8n flow. |
| Immediately | 1v1 waiting player → Telegram notification to the admin | Edge function. |
| Every week | At least 50 new photos (Section 3 pipeline), production and scheduling of 7 videos, KPI report | n8n + agent session. |
| Every month | ASO cycle, one version update, review of Pro price and conversion | Agent session. |

**Exceptions to report to the user (Telegram):** store rejection, a sudden rise in 1-star reviews, the crash rate exceeding 1%, the photo schedule about to run out, a copyright complaint (in such a complaint, the photo concerned is taken down immediately).

### 11.1 Roadmap (post-launch)

1. **Version 1.1:** Playing a challenge link on the web without installing the app. The feature that will contribute most to viral spread.
2. **Version 1.2:** Weekly leagues and friend groups.
3. **Version 1.3:** Letting users upload family photos with explicit permission ("1978, Kadıköy"). Requires moderation, a copyright declaration and consent from identifiable people in the photo. Fills the 1950–1990 gap.
4. **Later:** Ads, but only if Pro revenue and retention will not be hurt; permissioned collaboration with archives such as SALT; themed photo packs.

## 12. Timeline and scope of the first session

Target: iOS launch on 24 November 2026 (Tuesday), Android production release on 3 December 2026 (Thursday). The dates are targets; if the human gates are delayed, the managing agent shifts the schedule and writes it to the decision log. The most critical dependency is that Android's 14-day closed test starts on 17 November; for that, 12 testers must be ready by that date.

### 12.1 First session (by tomorrow)

Not everything gets done in one session. Work proceeds in the order below; if time runs out, stop at a clean point and update `STATUS.md`.

1. Repo, skill installation, `STATUS.md`, `DECISIONS.md`, `HUMAN_TODO.md`.
2. First version of `HUMAN_TODO.md`: accounts, testers, Telegram token, project email. Written at the very start so the user can handle these in parallel.
3. Name decision and checks (stores, trademark, social usernames).
4. Supabase project: schema, day rollover, scoring function.
5. Photo pipeline and the first 200 photos (if not possible in time, at least the first 3 weeks of the daily pool).
6. App: an end-to-end working version of the daily game (game, reveal, day summary, sharing, notification).
7. 1v1, bot and Telegram admin notification.
8. Web: landing, privacy, terms, KVKK, sources, account deletion.
9. First version of store copy and keywords.
10. HyperFrames "bil bakalım" ("guess what") template and 3 sample videos.

### 12.2 Until launch

&#91;embedded content: Launch timeline · 5 work items, 2 release dates\]

The critical path is having 12 testers ready by 17 November: if this date slips, the Android release slips by the same number of days.

## 13. Risks

The three biggest risks: photo copyright, the 200 photos running out quickly, and delays in Android's closed test. The fallback plan for each is below.

| Risk | Likelihood | Impact | Mitigation / fallback plan |
| --- | --- | --- | --- |
| Copyright complaint | Medium | High | Only the licenses in Section 3.1; each photo's license record in the table; on a complaint, the photo is removed immediately. |
| Photo pool running out | High | High | The weekly 50+ photo pipeline runs before launch; alert below 7 days; the 1v1 pool can be fed with past days of the daily pool. |
| Wrong year or location information | Medium | Medium | Cross-checking; a "Bu bilgi yanlış mı?" ("Is this information wrong?") report button in the app; a photo with 3 reports goes to review. |
| Google 12-tester rule | High | Medium | iOS ships first; the tester list is started on day one; if suitable, an older account or an organization account is used. |
| Apple 4.3 / similarity rejection | Low | Medium | Türkiye-specific content, original design, clear review note. |
| Bot being noticed and backlash | Medium | Low | Explicit clause in the terms of use; no fake player counts; no bot is assigned when a real player is available. |
| Low willingness to pay in Türkiye | High | Medium | Pro is one-time and cheap; the Türkiye price is adjusted based on the first month's data; ads as a later option. |
| OpenFreeMap outage | Low | High | Türkiye PMTiles fallback from our own storage. |
| Agent session ending midway | High | Low | Thanks to `STATUS.md` and `DECISIONS.md`, the next agent continues from where it left off. |

## Sources

- [TimeGuessr, App Store](https://apps.apple.com/app/id6745130802)
- [Google Play Console Help: testing requirements for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-GB)
- [SALT Araştırma, sample record and its license](https://archives.saltresearch.org/handle/123456789/108152)
- [Library of Congress, Abdul Hamid II collection rights page](https://www.loc.gov/collections/abdul-hamid-ii/about-this-collection/rights-and-access/)
- [HyperFrames (GitHub)](https://github.com/heygen-com/hyperframes)
- [OpenFreeMap](https://openfreemap.org)
- [Open Paywall Gallery](https://github.com/paywallpro/paywall-gallery)
