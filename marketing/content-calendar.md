# Content calendar: pre-launch, launch week, December 2026

> **Scope:** 10 November – 31 December 2026 · iOS launch **Tuesday 24 November** · Android production **~3 December**
> **Basis:** Plan 8.5, 9 and 10.
> **Ready copy:** profiles `social/profiles.md` · caption patterns and X drafts `social/captions.md` · emails `email/waitlist-launch.md` · Reddit, press and collaborations `outreach/` · Android testers `testers.md` · store events `../store/in-app-events.md`
> **Images:** `social/profile-1080.png`, `social/cover-1500x500.png`, `social/youtube-banner-2560x1440.png`, `../web/assets/og.png` (HTML sources in `social/src/`)
> **Language:** quoted Turkish text (hooks, story text, CTAs, messages) is publishable copy for a Turkish audience and stays in Turkish.

---

## 0. 30-second check before every post

1. **The photo is not in today's set.** Only past days or the `bonus` pool. Since there are no past days before launch, **everything comes from the `bonus` pool until 24 November**.
2. **Attribution in the caption:** `Fotoğraf: <Eser sahibi>, <Kaynak>, <Lisans>`. In videos the attribution line is already on every frame; it is also written in the caption.
3. **Nothing made up:** No AI-generated "old" images, invented numbers, bought followers, likes or comments. If a number is needed it comes from a ‹gerçek veri› (real data) query. If there is no data, phrase the sentence without a number.
4. **Calendar:** No gamified posts on remembrance days (10 November, 6 February, 18 March, 15 July, 17 August) or on declared days of national mourning. Stop that day's scheduled posts.
5. **Links must have UTMs** (Section 5.1). If an AI voice-over was used, turn on the platform's "AI-generated" label.

---

## 1. Production and preparation (5–9 November)

### 1.1 Production tool: the "Bil bakalım" template

`marketing/templates/make-video.mjs` produces a 15–16 second, 1080×1920 HyperFrames video. The flow: intro card → photo and the question "Bu fotoğraf nerede? Hangi yıl?" → countdown from 5 → answer on the map, year counter, place name and CTA. The same MP4 is uploaded to Reels, TikTok and Shorts.

```bash
# spec: marketing/videos/specs/bb-001.json
#   { id, image (spec'e göre göreli yol), year, location, lat, lng, author, source, license, cta? {title, sub} }
node marketing/templates/make-video.mjs marketing/videos/specs/bb-001.json     # → marketing/videos/bb-001/
cd marketing/videos/bb-001
npx -y hyperframes@0.9.10 check
npx -y hyperframes@0.9.10 snapshot --at 1,4,11,14   # taşma, atıf, logo ve cevap karesini gözle kontrol et
npx -y hyperframes@0.9.10 render --output bb-001.mp4
```

The CTA on the video's last card changes **by period**. The template reads the optional `cta` field in the spec. If you leave it empty, the default text appears; that text is not correct before Android is released.

| Period | `cta.title` | `cta.sub` |
| --- | --- | --- |
| 11–23 November | 24 Kasım'da App Store'da. | Haber almak için: maziturkiye.com |
| 24 November – Android release | Her gün 5 fotoğraf. | Mazi Türkiye · App Store'da · Android yakında |
| After the Android release | (leave empty, default) | (leave empty: "Mazi Türkiye · App Store ve Google Play") |

Pre-launch (waitlist) spec example:

```json
{ "id": "bb-001", "image": "../photos/bb-001.jpg", "year": 1890, "location": "‹Yer›, ‹İl›", "lat": 41.0, "lng": 28.9,
  "author": "‹Eser sahibi›", "source": "Library of Congress", "license": "kamu malı",
  "cta": { "title": "24 Kasım'da App Store'da.", "sub": "Haber almak için: maziturkiye.com" } }
```

### 1.2 Marketing pool

- Pick **20 photos** for 14 videos (`status = 'onayli'`, `pool = 'bonus'`). The bonus pool goes into neither the daily schedule nor 1v1, so these photos don't spoil the in-game surprise.
- **Selection criteria:**
  - At least one photo from each of the 7 regions, with eras spread from the 1880s to the 2000s.
  - Sparks curiosity in the first second but doesn't give the answer away at a glance.
  - The important part stays centred in a vertical crop.
  - Avoid recent photos where ordinary people's faces are shown close up and recognisably.
- **Attribution and licence** are checked once more on the Commons or LOC page. For CC BY-SA, write the full licence version (e.g. `CC BY-SA 4.0`).
- **Production schedule:** bb-001…bb-007 rendered 5–9 November, bb-008…bb-014 on 16 November.

### 1.3 Posting times

These are starting assumptions; they change as we measure (Section 5).

| Channel | Time (TRT) |
| --- | --- |
| Reels / TikTok / Shorts | 20:30 |
| Instagram story | 08:30 · 13:00 · 21:30 |
| X | 09:00 (main post) · 18:00 (reply or quote) |

Scheduling is done with the platforms' own tools: Meta Business Suite, TikTok, YouTube Studio and X (Plan 9.4).

### 1.4 An opportunity to act on now: App Store featuring nomination

As soon as the app record is open, a launch nomination can be sent to Apple's editors via App Store Connect → app → **Featuring Nominations**. Apple recommends doing this weeks in advance, i.e. this week.

The short text covers: what the game is, who it's for, why it's different (openly licensed archive photos, no AI images, no ads) and the launch date (24 November). It needs the App Store Connect account, so this is a human gate.

---

## 2. 14 days before launch (10–23 November)

**Goal:** Warm up the accounts, test the format and grow the waitlist (maziturkiye.com/#bekleme).

**Every day:** 1 video (to 3 channels), 2–3 stories, 1–2 X posts.

**Two CTAs:**
- For engagement: "tahminini yorumlara yaz"
- For conversion: "24 Kasım'da haber almak için link profilde"

Hooks and caption patterns are in `social/captions.md`. Abbreviations such as `X-1` and `H1` refer to the patterns in that file.

### Tuesday 10 November: Atatürk Remembrance Day, no posts

- No game-related posts at all.
- Accounts are set up: profile image, cover and bio (`social/profiles.md`) are added, and the 11–13 November posts are scheduled.
- Optional: at 09:05, a plain remembrance story with no logo, no link and no game language ("Saygı ve özlemle.").

### Wednesday 11 November: Hello

- **Video bb-001:** An easy opener. A familiar Istanbul shoreline or bridge (1880–1900, Abdul Hamid II albums).
  - Hook: "Bu fotoğrafın nerede çekildiğini 5 saniyede bulabilir misin?"
- **Story:**
  1. "Merhaba! Biz Mazi Türkiye. Her gün eski bir fotoğraf, tek soru: nerede, hangi yıl?"
  2. Reshare of the video.
  3. Quiz sticker "Sence hangi yıl?" (H1).
- **X:** Introduction post (X-1), pinned.
- **CTA:** Tahminini yorumlara yaz. 24 Kasım'da App Store'da, link profilde.

### Thursday 12 November: Aegean and Android tester call

- **Video bb-002:** A coastal town in the Aegean (1900–1950).
  - Hook (without naming the city): "Ege'de bir liman. Ama hangisi, ve hangi yıl?"
- **Story:** Android tester call (`testers.md`): "Android'in var mı? Google Play'e çıkmak için 14 günlük testte birkaç kişiye daha ihtiyacımız var. DM'den yaz." With a question box below.
- **X:** Tester call (X-3).
- **Note:** Testers need to join **by 17 November**. Android making 3 December depends on this.

### Friday 13 November: Black Sea and the first story carousel

- **Video bb-003:** A shot from the Black Sea region.
  - Hook: "Karadenizliysen 3 saniyede bilirsin. Değilsen?"
- **Instagram carousel #1, "Fotoğrafın hikayesi" (the photo's story):** 5 slides with another bonus-pool photo (captions.md §2). The story uses only what the source says.
- **X:** "Fotoğraflar nereden geliyor?" (X-4).

### Saturday 14 November: Central Anatolia

- **Video bb-004:** A shot from Central Anatolia.
  - Hook: "Bozkırın ortasında bir şehir. ‹1920'ler› mi, ‹1950'ler› mi?"
- **Story:** Slider "Bu fotoğraf ne kadar eski?" (H3) and a tester reminder.
- **X:** Poll "Hangisini tahmin etmek daha zor: konum mu, yıl mı?" (X-6).

### Sunday 15 November: Family day

- **Video bb-005:** A city-life shot from 1950–1980 with broad appeal.
  - Hook: "Bunu annene göster. Bence ilk o bilir."
- **Story:** The week's answers (bb-001…bb-005) and question box "Hangi şehrin eski fotoğrafını görmek istersin?" (H5).
- **X:** The same question (X-7). Replies are added to the themed-day and pool lists.

### Monday 16 November: Production day

- 7 videos are rendered (bb-008…bb-014) and the week's posts are scheduled.
- **Video bb-006:** A shot from the Mediterranean.
  - Hook: "Akdeniz'de bir kıyı. Haritada 50 km içine iğne bırakabilir misin?"
- **Story:** Behind the scenes, "Fotoğrafları nasıl seçiyoruz?" (H8): licence, cropping, fact check. 3 slides.
- **X:** Founder's note (X-8). Written in the founder's own words.

### Tuesday 17 November: Eastern Anatolia and last day for testers

- **Video bb-007:** A shot from Eastern Anatolia.
  - Hook: "Doğu'dan bir kare. Şehri bulan çok olur, ya yılı?"
- **Story:** A thank-you if 12 testers were reached, a last call if not. The number is written only if it is real.
- **X:** "Puanlama nasıl?" (X-9).

### Wednesday 18 November: Southeast and story carousel #2

- **Video bb-008:** A shot from Southeastern Anatolia.
  - Hook: "Taş evler, dar sokaklar. Güneydoğu'da ama tam olarak nerede?"
- **Instagram carousel #2, "Fotoğrafın hikayesi".**
- **X:** Bil bakalım image, answer given at 18:00 as a quote (X-2 → X-10).

### Thursday 19 November: "How to play" (real screen recording)

- **Video:** 20–25 second real screen recording.
  - Flow: drop pin → slide the year → reveal → score.
  - Recorded with the TestFlight build and the bonus set; today's photos are not used.
  - One line on top: "Böyle oynanıyor."
  - No voice-over, or the founder's own voice.
- **Story:** A short cut of the recording and a link sticker (waitlist, `utm_content=ekran-001`).
- **X:** The same video (X-11).

### Friday 20 November: Hard mode

- **Video bb-009:** A little-known town (1900s).
  - Hook: "Bu haftanın en zoru. Bilen çıkarsa yorumuna kalp bırakıyorum."
- **Story:** Introducing the challenge feature: "24 Kasım'dan sonra arkadaşına link gönderip aynı 5 fotoğrafta yarışabileceksin."
- **X:** "Pro neden abonelik değil?" (X-12).

### Saturday 21 November: Marmara (outside Istanbul)

- **Video bb-010:** A shot from Bursa, Edirne, Çanakkale or İzmit.
  - Hook: "İstanbul değil. Ama çok yakın."
- **Story:** Poll "1v1'de kime karşı oynamak istersin? Arkadaşım / Rastgele biri" (H4).
- **X:** The same poll (X-13).

### Sunday 22 November: 2 days to go

- **Video bb-011:** A new shot from the region that got the most comments.
  - Hook: "2 gün sonra her sabah 5 tane böyle soru."
- **Story:** Instagram countdown sticker (H6): "Mazi Türkiye yayında", 24 November 04:00. People who tap "Remind me" get a notification.
- **X:** Countdown (X-14).

### Monday 23 November: Tomorrow

- **Production:**
  - Launch-week videos (bb-012…bb-016).
  - Launch screen recording: the real app, bonus set, HyperFrames only for frame and text.
- **Video bb-012.** Hook: "Yarın sabah 04:00'te ilk gün açılıyor. Isınma turu:"
- **Story:** Countdown and "Yarın ilk sen oyna".
- **X:** "Yarın" (X-15).
- **Evening check:**
  - [ ] Is the launch email scheduled in Resend for 24 November 09:30?
  - [ ] Are the 5 press emails in drafts, and is maziturkiye.com/basin live?
  - [ ] Have the Reddit texts been read one last time against subreddit rules? Have the r/KGBTR mods been messaged?
  - [ ] Is the approved App Store build on "manual release"? Suggestion: hit "Release" on 23 November at 21:00. It can take a few hours to appear in the store.
  - [ ] The first game day opens on 24 November at 04:00. Has the "first day at 04:00" state that overnight downloaders will see been tested?
  - [ ] Are the 5 photos for 24 November scheduled? Theme suggestion: `days.theme` for Teachers' Day.

---

## 3. Launch week (24–30 November)

**The WhatsApp challenge is at the centre.** Because everyone plays the same 5 photos, a "can you beat me?" invite comes naturally.

From 25 November, the previous day's photos count as past days and can be used in content. So the content pool grows by 5 photos every day.

### Tuesday 24 November: Launch and Teachers' Day

| Time | Task | Source |
| --- | --- | --- |
| 04:00 | The first day opens. Suggestion: first day's theme "Mektepler" (schools), school photos from the Abdul Hamid II albums. | `../store/in-app-events.md` E1 |
| 07:30 | Play the round yourself and note your score. You'll get the challenge link from this round. | |
| 08:30 | Story: "Bugün yayında" and App Store link sticker (`ct=instagram-launch-2026`). | captions.md H6 |
| 09:00–10:00 | Press emails sent one by one (Webrazzi, Webtekno, ShiftDelete.Net, Log, Teknoblog). Content: the release and maziturkiye.com/basin. No bulk CC. | `outreach/press-release.md` |
| 09:30 | Launch email to the waitlist (Resend). | `email/waitlist-launch.md` |
| 10:00 | Launch post on X (X-16), pinned. The founder shares the "why I built it" story on their personal accounts (X, LinkedIn, Instagram). | captions.md |
| 12:00 | WhatsApp: personal challenges to your own circle (text below). To testers: "2 arkadaşına meydan okur musun?" | |
| 13:00 | Story: Teachers' Day. A school photo from the bonus pool and "Bütün öğretmenlerimizin günü kutlu olsun." The day's game photos are not used. | captions.md §5 |
| 18:00 | Reddit r/Turkey (English). Stay on it for the first 2 hours and reply to every comment. | `outreach/reddit.md` |
| 20:30 | Reels/TikTok/Shorts: launch video. Real screen recording (bonus set) and "Bugün yayında". | captions.md §1 |
| 22:00 | Check Telegram alerts and crash reports, reply to comments. | |

**WhatsApp challenge text** (sent personally; no broadcast lists or groups of people you don't know):

> English summary: "I launched Mazi Türkiye today; 5 old photos a day, guess where and when. I scored ‹score› today, can you beat me? (iPhone for now, Android in early December.)"

> Bugün Mazi Türkiye'yi yayınladım 🎉 Her gün 5 eski fotoğraf geliyor, nerede ve hangi yıl çekildiğini tahmin ediyorsun. Bugünkü turda ‹skor› yaptım, beni geçebilir misin? ‹meydan okuma linki›
> (Şimdilik iPhone'da, Android Aralık başında geliyor.)

**For the family group:**

> English summary: "Family tournament: we all play the same 5 old photos; let's see who scores highest. I got ‹score›."

> Aile turnuvası 😄 Hepimiz aynı 5 eski fotoğrafı oynuyoruz, bakalım en yüksek skor kimde. Ben ‹skor› yaptım. ‹meydan okuma linki›

### Wednesday 25 November: First real data

- **Video: "Dünün en zor fotoğrafı" (yesterday's hardest photo).** Day 1's photo now counts as a past day. The video is produced with `make-video.mjs`; the answer is at the end of the video.
- **First community stat:** Shared only if n ≥ 100 (captions.md §3). Example: "Dünkü 3. fotoğrafı oyuncuların %‹gerçek veri›'i 5 yıl içinde bildi."
- **Collaboration messages begin:** 4 people a day for 5 days, 20 micro accounts in total (`outreach/influencer-dm.md`). Each message refers to a specific post by that person.
- **r/KGBTR:** Posted at 20:00 if the mods approved. Not posted without approval.

### Thursday 26 November

- **r/istanbul post:** An Istanbul photo from past days, with attribution.
- **One follow-up to the press:** Only to those who haven't replied, and with new information (e.g. the Android date). No second follow-up.
- **Video:** Bil bakalım (from a past day).
- **Story:** Yesterday's answer and a quiz.

### Friday 27 November: Weekend challenge

- **Reels and story:** "Bu hafta sonu aile turnuvası: linki aile grubuna at, pazar akşamı kim önde?" Show the challenge flow from the real app screen.
- **X:** Challenge call (X-17).
- **Product side:** Look at the share rate for the first 3 days (`share_tapped / day_completed`). If it's under 10%, change a single piece of text on the share screen (Plan 10.3: one change).

### Saturday 28 November

- **The photo's story:** One of the first day's school photos, with the story from its source. As a carousel if the 30–45 second template isn't ready.
- **Video:** Bil bakalım.

### Sunday 29 November

- **Story:** "İlk haftanın en çok şaşırtan fotoğrafı" (the first week's most surprising photo), i.e. the photo with the lowest average score (real data).
- **Evening:** Family tournament reminder.

### Monday 30 November: First weekly cycle

- **Weekly champions #1** (24–29 November; captions.md §4). Only the nicknames of players who separately agreed to be named on social media are written. Without permission, only scores are shared.
- **Weekly report** (Plan 10) and the content line (Section 5.5).
- 7 videos are rendered. There are now plenty of past days to choose from.
- **Decision:** Adjust hook and posting time based on pre-launch measurements. Written to DECISIONS.md.

---

## 4. First month: December 2026

### 4.1 Weekly rhythm

| Day | Reels / TikTok / Shorts | Instagram story | X |
| --- | --- | --- | --- |
| Monday | Weekly champions | Champions and the week's plan | The week's hardest photo |
| Tuesday | Bil bakalım (past day) | Quiz and yesterday's answer | Community stat |
| Wednesday | The photo's story | Question box | Fact note from the source |
| Thursday | Bil bakalım | Quiz and yesterday's answer | Yesterday's hardest photo |
| Friday | Community stat card (8 s) | Weekend challenge call | Challenge call |
| Saturday | Bil bakalım (family, nostalgia) | Slider | Poll |
| Sunday | Bil bakalım | Week recap | — |

With this rhythm every content type is published at least 4–5 times in December. That is enough for the comparison in Section 5.

### 4.2 December calendar

- **1–6 December: Android week**
  - **1 December:** If testers joined by 17 November, the 14-day closed test completes. Apply for production access in Play Console (draft answers in `testers.md`).
  - **~3 December:** Release on Google Play. Same day:
    - "Android geldi" email (`email/waitlist-launch.md` §2).
    - "Android'de de" on Reels, X (X-20) and story.
    - A comment on your own Reddit launch post. No new post.
    - A one-line thank-you and the Play link to reporters who covered it.
  - The video CTA returns to the default ("App Store ve Google Play").
  - The waitlist is deleted after the Android email. The promise was "launch announcement only".
- **7–13 December:**
  - The format comparison starts with the rhythm in 4.1.
  - Posts by collaborating accounts are reshared in stories, with permission.
  - App Store product page test (Product Page Optimization) begins: first screenshot, at least 7 days (Plan 8.5).
- **10 December:** The New Year event is submitted to App Store Connect and Play Console (`../store/in-app-events.md` E2).
- **14–20 December:**
  - On 17 December the event card starts appearing in the store.
  - A bil bakalım series with winter- and snow-themed bonus photos is published.
  - Mid-point review of the first month (5.4).
- **21–27 December:** "2026'nın en zor fotoğrafları" (2026's hardest photos) series. From past days, with real average scores.
- **31 December – 3 January:** "Yeni Yıl: Kar Altında Türkiye" themed days (captions.md §5).
  - No reminder notification on New Year's Eve; on 1 January it goes out at the normal time in the morning.
- **4 January 2027 (Monday):** First-month decision: the winning content type (5.4). Written to DECISIONS.md.

### 4.3 What we won't do

- **No paid ads.** An Apple Search Ads test happens only after organic conversion data arrives and the budget is approved (human gate).
- **No fake engagement:**
  - Opening a topic on Ekşi Sözlük or writing our own entries.
  - Buying followers, likes or comments.
  - Commenting from a second account.
  - Sending bulk WhatsApp messages.
- **No newsjacking.** Political or tragic news is not tied to content; trending hashtags are not used.

---

## 5. Measurement: which content drives downloads?

### 5.1 UTM rules

**Format:** `?utm_source=<kanal>&utm_medium=<yer>&utm_campaign=<kampanya>&utm_content=<içerik>`

All lowercase ASCII; no Turkish characters or spaces, hyphens as separators. Profile links follow the same pattern as `social/profiles.md`.

| Parameter | Values |
| --- | --- |
| `utm_source` | `instagram`, `tiktok`, `youtube`, `x`, `reddit`, `whatsapp`, `email`, `press-webrazzi`, `press-webtekno`, `press-shiftdelete`, `press-log`, `press-teknoblog`, `creator-<kisaad>` |
| `utm_medium` | `profile` (bio link), `story` (link sticker), `post` (post or caption), `comment`, `email`, `press`, `dm` |
| `utm_campaign` | `prelaunch-2026` (10–23 Nov), `launch-2026` (24–30 Nov), `android-2026` (1–6 Dec), `always-on`, `yeniyil-2027` and other event names |
| `utm_content` | Content ID: `bb-001` (bil bakalım), `hk-001` (story), `st-001` (stat), `sm-001` (champions), `tg-001` (themed day), `ekran-001` (screen recording), `email-btn1` |

**Examples:**

- Instagram bio: `https://maziturkiye.com/?utm_source=instagram&utm_medium=profile&utm_campaign=prelaunch-2026`
- Story link sticker: `https://maziturkiye.com/?utm_source=instagram&utm_medium=story&utm_campaign=prelaunch-2026&utm_content=bb-004`
- X launch post: `https://maziturkiye.com/?utm_source=x&utm_medium=post&utm_campaign=launch-2026&utm_content=x-16`

**Store links:**

- **App Store campaign link:** `https://apps.apple.com/tr/app/id‹APP_ID›?pt=‹PROVIDER_TOKEN›&ct=<kaynak>-<kampanya>&mt=8`
  - `ct` can be at most 40 characters (e.g. `ct=email-launch-2026`).
  - The `pt` value comes from App Store Connect's campaign link generator.
  - Results: App Store Connect → Analytics → Acquisition → Campaigns.
- **Google Play:** `https://play.google.com/store/apps/details?id=com.maziturkiye.app&referrer=utm_source%3Dx%26utm_medium%3Dpost%26utm_campaign%3Dandroid-2026`
  - Results: Play Console → user acquisition reports.
- **Apple Custom Product Pages** (Plan 10.2). Two are created after launch:
  - `sosyal`: bil bakalım on the first screen
  - `meydan-okuma`: WhatsApp duel on the first screen
  - Add the `ppid=` parameter to the link.

**Technical gap in measurement (the agent can do this, no approval needed).** The landing page currently doesn't measure visits and doesn't pass UTMs to either the store link or the waitlist. Three small tasks proposed:

1. Add a `source text` column to the `waitlist` table; `join_waitlist` stores the page's first UTM. Before launch the waitlist is the only conversion, so this is the most valuable measurement.
2. `MAZI.storeLink()` maps the page URL's `utm_source` and `utm_campaign` values to the `ct` parameter on the App Store and the `referrer` parameter on Google Play.
3. Page visits are measured with a cookieless counter (Vercel Web Analytics or PostHog cookieless mode). Whichever is chosen is added to the privacy text; that text needs human approval.

### 5.2 Numbers kept for each post

Taken from platform analytics 72 hours after posting and written to the weekly sheet (Google Sheets or `marketing/metrics.csv`):

- views
- average watch time and completion rate
- comments, shares (sends), saves
- profile visits, link clicks (if the platform provides them), new follows

All are converted **per 1,000 views**, so a single viral video doesn't skew the table.

### 5.3 Attributing to downloads

Downloads from organic social are hard to measure precisely, so three sources are read together:

1. UTM-tagged landing visits and waitlist signups (if the technical tasks in 5.1 are done).
2. App Store `ct` and Play `referrer` campaign downloads.
3. **Time matching:** The hourly download lift in the 24 hours after a video is published is compared with the same hours of the previous week (App Store Connect and Play Console).

Optional fourth source: add a single skippable question to onboarding: "Bizi nereden duydun?" (Where did you hear about us?) Options: Instagram / TikTok / YouTube / X / Arkadaşım / Mağaza araması / Diğer. The answer is recorded as a property on the `onboarding_completed` event; it contains no personal data.

### 5.4 How the winning content type is decided

- **Types compared:** bil bakalım, the photo's story, community stat, weekly champions, themed day, screen recording.
- **Minimum sample:** At least 5 posts of each type and 3 weeks of data. Use the **median**, not the mean.
- **Primary metric (download intent):** Profile visits and link clicks per 1,000 views. After launch, campaign downloads per 1,000 views if possible.
- **Secondary metric (spread):** Shares and saves per 1,000 views. If the difference between types on the primary metric is under 20%, this metric decides.
- **Tertiary metric (algorithm):** Comment rate and completion rate. Used only to tune hooks and video length.
- **Hook test:** To test the same video with two different first lines, Instagram's Trial Reels feature (shown to non-followers first) can be used.
- **Slot allocation:** The winning type gets 50% of weekly slots, the runner-up 30%. The remaining 20% is for experiments (new hook, new type, collaborations).
- **Decision days:**
  - 23 November: hook and posting time only.
  - 4 January 2027: the first month's winning type.
  - After that, the first Monday of each month.
  - Each decision is written to DECISIONS.md as "date · decision · rationale".
- **Weak channel rule:** If a channel's primary metric stays below half of the other channels' for 3 weeks, dedicated production for that channel stops and it gets reshares only.

### 5.5 Content line for the weekly report

One line is added to the end of the Telegram report from Plan 10:

`İçerik · En iyi gönderi: ‹id› (‹tür›, ‹birincil ölçü›) · Sosyal kaynaklı kayıt/indirme: ‹gerçek veri› · Bu haftaki tek değişiklik: ‹karar›`
