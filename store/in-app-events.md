# Store events: Apple In-App Events and Google Play promotional content (November 2026 – November 2027)

> **Basis:** Plan 8.5 and 9.2.5. Themed days are marked in the game with `days.theme`; the 5 photos of that day fit the theme and are **free for everyone.**
> After the event ends, these days can be played in the Pro archive like any other past day.
> For social media texts see `../marketing/social/captions.md` §5; for the day-by-day plan see `../marketing/content-calendar.md`.

## 1. Rules

1. **An event is real game content.** The theme is each day's 5-photo set itself. An event is not a "download our app" announcement; Apple does not accept that.
2. **No gamified events on remembrance days.** The store card is not visible on that day either; the publication date is chosen accordingly. Remembrance days:
   - 10 November
   - 6 February (2023 earthquakes)
   - 18 March (Çanakkale)
   - 15 July
   - 17 August (1999 earthquake)
   - declared days of national mourning
3. **If national mourning is declared:** The event live at that time is stopped immediately in App Store Connect and Play Console. Scheduled social media posts are also stopped.
4. **Store image rules:**
   - The event's own photos are not used; that would be a spoiler.
   - No AI images.
   - Allowed: the brand design system (`marketing/social/src/`, typography and map) or a photo from the bonus pool, preferably public domain (with a small attribution line in the image).
   - Apple writes the name and short description on top of the card itself. The image has no text or very little; the bottom third is left empty.
5. **License:** The rule in Plan 3.1 applies: public domain, CC0, CC BY, CC BY-SA. For photos from the early years of the Republic, the author's year of death is checked (FSEK: 70 years after death).
6. **No promises without enough photos.** The event is shortened or 3 of the 5 daily photos are themed. The number of days in the texts is corrected accordingly.
7. **Link:** The event deep link is `maziturkiye://play` (the day's round). Tested on a real device before publication.

## 2. Apple In-App Events: limits

Source: developer.apple.com/app-store/in-app-events, checked on 4 November 2026.

| Field | Limit |
| --- | --- |
| Event name | 30 characters, Title Case |
| Short description | 50 characters, sentence case (visible on the card) |
| Long description | 120 characters, sentence case (visible on the detail page) |
| Badges | Challenge, Competition, Live Event, Major Update, New Season, Premiere, Special Event |
| Duration | At most 31 days |
| Promotion | Starts appearing in the store at most 14 days before the start |
| Card image | 16:9, at least 1920×1080 (at most 3840×2160); jpg or png (can also be video) |
| Detail page image | 9:16, at least 1080×1920 |
| Count | At most 15 approved and 10 published events at the same time |
| Submission | Can be submitted for review independently of an app version |

In App Store Connect the following fields are also filled in: reference name (internal use), purpose (e.g. "Appropriate for all users"), priority (Normal/High), countries (Türkiye) and deep link.

## 3. Calendar

All game days **start at 04:00 Türkiye time and end at 03:59 the next day.**

| # | Event (name) | Game days | Visible in store | Submission (Apple + Play) | Badge | Themed photos |
| --- | --- | --- | --- | --- | --- | --- |
| E1 | Öğretmenler Günü: Mektepler | **Tue 24 Nov 2026** (launch day) | Right after approval, 11 Nov at the earliest | When the first version is approved (Apple only) | Special Event | 5 |
| E2 | Yeni Yıl: Kar Altında Türkiye | Thu 31 Dec 2026 – Sun 3 Jan 2027 | 17 Dec | 10 Dec | Special Event | 20 |
| E3 | Eski İstanbul Haftası | Mon 15 – Sun 21 Feb 2027 | **7 Feb** (so the card is not visible on 6 February) | 1 Feb | Challenge | 35 |
| E4 | Bayramda Memleket | Tue 9 – Thu 11 Mar 2027 | 23 Feb | 16 Feb | Special Event | 15 |
| E5 | 23 Nisan: Çocuklar ve Meclis | Fri 23 – Sun 25 Apr 2027 | 9 Apr | 2 Apr | Special Event | 15 |
| E6 | 19 Mayıs: Gençlik ve Spor | Wed 19 – Fri 21 May 2027 | 5 May | 28 Apr | Special Event | 15 |
| E7 | Kıyıdan Kıyıya: Vapurlar | Thu 1 – Wed 7 Jul 2027 | 17 Jun | 10 Jun | Special Event | 35 |
| E8 | Fotoğrafçıların İzinde | Thu 19 – Wed 25 Aug 2027 | **18 Aug** (so the card is not visible on 17 August) | 10 Aug | Special Event | 35 |
| E9 | Raylarda Mazi | Mon 13 – Sun 19 Sep 2027 | 30 Aug | 23 Aug | Challenge | 35 |
| E10 | Cumhuriyet'in İlk Yılları | Wed 27 – Sun 31 Oct 2027 | 13 Oct | 6 Oct | Special Event | 25 |
| E11 | Mazi 1 Yaşında: Mektepler | Wed 24 Nov 2027 | **11 Nov** (so the card is not visible on 10 November) | 3 Nov | Special Event | 5 |

In total **~235 themed photos** are needed. This is a work list separate from the daily pool: a search with a theme tag is added to the photo pipeline. Photos are approved and scheduled at least 21 days before the event.

**Religious holiday dates** follow Diyanet's 2027 calendar (as reported in the news; verify once more against the official calendar):

- Ramadan Feast: 9–11 March (eve 8 March)
- Feast of the Sacrifice: 16–19 May (eve 15 May)

## 4. Event details (Apple texts)

Character counts checked.

### E1 · Öğretmenler Günü: Mektepler (launch day)

- **Name** (27/30): `Öğretmenler Günü: Mektepler`
- **Short** (45/50): `Eski okul fotoğraflarıyla 24 Kasım'a özel tur`
- **Long** (108/120): `Osmanlı mekteplerinden Cumhuriyet okullarına 5 fotoğraf. Bu sınıf nerede, hangi yıl? Öğretmenine meydan oku.`
- **Badge:** Special Event · **Priority:** High
- **Photo theme:**
  - School photos from the Abdülhamid II albums: idadis (secondary schools), vocational schools, girls' schools, student groups.
  - Anatolian village schools and teacher training schools from 1930–1960 on Commons (with license check).
  - 5 different provinces if possible.
- **Feasibility:**
  - The event can only be submitted if the app's first version is approved before 24 November. Recommendation: get approval on 18–20 November with manual release.
  - If approval does not come, the event stays only as an in-game themed day.
  - Android is not live on this date, so there is no Play equivalent.

### E2 · Yeni Yıl: Kar Altında Türkiye

- **Name** (29/30): `Yeni Yıl: Kar Altında Türkiye`
- **Short** (43/50): `Yeni yılın ilk günlerinde karlı fotoğraflar`
- **Long** (95/120): `31 Aralık–3 Ocak arası her gün 5 karlı fotoğraf. Erzurum'dan İstanbul'a kış: nerede, hangi yıl?`
- **Badge:** Special Event · **Priority:** High (the first event on Play)
- **Photo theme:**
  - Snow and winter: Eastern Anatolian cities, Black Sea highland pastures, snowy streets and the Bosphorus in Istanbul, Ankara winter.
  - Distribution: at least 3 different regions every day, so snow alone does not give away the location.
- **Note:** The event does not use celebratory language; it runs on the winter theme. No notification is sent on New Year's Eve.

### E3 · Eski İstanbul Haftası

- **Name** (21/30): `Eski İstanbul Haftası`
- **Short** (42/50): `7 gün boyunca sadece İstanbul fotoğrafları`
- **Long** (90/120): `Bu hafta konum kolay, yıl zor: 7 gün, her gün 5 İstanbul fotoğrafı. Hangi semt, hangi yıl?`
- **Badge:** Challenge
- **Photo theme:**
  - Historic Peninsula, Galata and Karaköy, Bosphorus villages, Kadıköy and Üsküdar, the Princes' Islands.
  - From the 1870s to the 1990s.
  - A different mix of neighborhood group and period every day.
- **Why not 29 May:** See §6.

### E4 · Bayramda Memleket

- **Name** (17/30): `Bayramda Memleket`
- **Short** (45/50): `Bayram boyunca Anadolu kasabalarından kareler`
- **Long** (102/120): `Ramazan Bayramı'na özel: istasyonlar, çarşılar, meydanlar. Memleketini fotoğrafta tanıyabilecek misin?`
- **Badge:** Special Event
- **Photo theme:**
  - Anatolian town squares, train stations, bus terminals, bazaars and old houses; in other words, the feeling of "going back home".
  - Moments of worship are not used. Mosques may appear only as part of the urban fabric.
- **Note:** The event ends on 11 March; more than a week before 18 March.

### E5 · 23 Nisan: Çocuklar ve Meclis

- **Name** (28/30): `23 Nisan: Çocuklar ve Meclis`
- **Short** (39/50): `Çocuk Bayramı'na özel 5 fotoğraflık tur`
- **Long** (99/120): `İlk Meclis binasından eski okul bahçelerine 23 Nisan fotoğrafları. Bu turu çocuğunla birlikte oyna.`
- **Badge:** Special Event
- **Photo theme:**
  - The first TBMM (Grand National Assembly) building in Ankara (1920s), the Ulus area.
  - School yards, Children's Day celebrations, playgrounds (1920–1970).
  - Recognizable children's faces are used only in old, public domain photos.

### E6 · 19 Mayıs: Gençlik ve Spor

- **Name** (25/30): `19 Mayıs: Gençlik ve Spor`
- **Short** (42/50): `Eski stadyumlar, spor bayramları ve Samsun`
- **Long** (97/120): `19 Mayıs'a özel: stadyumlar, spor bayramları ve Samsun. Bu fotoğraflar nerede, hangi yıl çekildi?`
- **Badge:** Special Event
- **Photo theme:** The Samsun coast and city center, old stadiums, school sports festivals, gymnastics displays, rowing and sailing races.
- **Note:** 19 May 2027 falls on the last day of the Feast of the Sacrifice. No separate Feast of the Sacrifice event is held; no sacrifice imagery is used.

### E7 · Kıyıdan Kıyıya: Vapurlar

- **Name** (24/30): `Kıyıdan Kıyıya: Vapurlar`
- **Short** (37/50): `Kabotaj Bayramı'na özel deniz haftası`
- **Long** (89/120): `1 Temmuz'dan itibaren 7 gün: iskeleler, vapurlar, deniz fenerleri. Hangi kıyı, hangi yıl?`
- **Badge:** Special Event
- **Photo theme:**
  - Coasts of the four seas: piers, ferries, harbors, lighthouses, beaches (1880–2000).
  - At least 3 different seas every day.
- **Note:** Ends on 7 July; far from 15 July.

### E8 · Fotoğrafçıların İzinde (World Photography Day)

- **Name** (22/30): `Fotoğrafçıların İzinde`
- **Short** (37/50): `Dünya Fotoğraf Günü: her gün bir usta`
- **Long** (110/120): `19 Ağustos'tan itibaren her gün bir fotoğrafçı: Abdullah Biraderler, Sébah & Joaillier, Berggren ve diğerleri.`
- **Badge:** Special Event
- **Photo theme:**
  - Every day, 5 shots by a single photographer.
  - Masters whose work is in the public domain: Abdullah Frères, Sébah & Joaillier, Guillaume Berggren, Pascal Sébah, Phébus and others.
  - Each photo's story includes a sentence about the photographer, as written in the source.
- **Note:** The card appears on 18 August, so it does not clash with the 17 August remembrance day.

### E9 · Raylarda Mazi

- **Name** (13/30): `Raylarda Mazi`
- **Short** (43/50): `Bir hafta boyunca garlar, köprüler, trenler`
- **Long** (104/120): `Okullar açılırken 7 günlük demiryolu turu: garlar, köprüler, buharlı trenler. Hangi istasyon, hangi yıl?`
- **Badge:** Challenge
- **Photo theme:** Haydarpaşa and Sirkeci, Anatolian and Baghdad railway stations, viaducts, steam locomotives, station squares (1890–1980).
- **Note:** 13 September 2027 was assumed as the school opening date; checked when the MEB (Ministry of Education) calendar is announced. The event is not tied to school; only its timing falls on that week.

### E10 · Cumhuriyet'in İlk Yılları

- **Name** (25/30): `Cumhuriyet'in İlk Yılları`
- **Short** (38/50): `29 Ekim'e özel: 1923–1938 fotoğrafları`
- **Long** (104/120): `Yeni başkent Ankara, ilk demiryolları, okullar ve meydanlar. Bu fotoğraflar nerede, hangi yıl çekildi?`
- **Badge:** Special Event · **Priority:** High
- **Photo theme:** The building of Ankara, new stations and railways, schools, city squares and factories, 1923–1938.
- **Note:** License checks are especially important for this period; for photos with a known author, the year of death is checked. The event ends on 31 October, 10 days before 10 November.

### E11 · Mazi 1 Yaşında: Mektepler (right after the first 12 months)

- **Name** (25/30): `Mazi 1 Yaşında: Mektepler`
- **Short** (36/50): `Birinci yılımız Öğretmenler Günü'nde`
- **Long** (101/120): `Bir yıl önce bugün ilk 5 fotoğraf eski mekteplerdendi. Yıl dönümünde yine okullar: nerede, hangi yıl?`
- **Badge:** Special Event
- **Note:** The card appears on 11 November; no promotion of any kind is done on 10 November. The first sentence of the long description depends on E1 actually having happened. If it did not, the text changes.

## 5. Google Play promotional content (formerly LiveOps)

**Where:** Play Console → Grow users → Store presence → Promotional content. If the menu is not visible, the app is not eligible yet. In that case the event is announced only in the game, via notification and on social media.

**Type:** "Event". Since no Pro discount is planned, the "Offer" type is not used.

**Limits:**

| Field | Limit | Status |
| --- | --- | --- |
| Tagline | 80 characters | Verified from the official source |
| Description | 500 characters | Could not be verified from the container; check in Play Console |
| Image | 1920×1080 (16:9) | Could not be verified from the container; check in Play Console |

The image, tagline and description must be consistent with each other and specific to that event.

**Submission:** **At least 7 days before** the start (recommended). Google reviews it and the approved card appears on the publication date. Dates are the same as the submission column in §3.

**The first Play event is E2.** Android goes live around 3 December; E1 has no Play equivalent.

Common closing sentence for the descriptions (Ö): `Fotoğrafa bak, Türkiye haritasına iğneni bırak, yılı tahmin et. Etkinlik tüm oyunculara ücretsiz; fotoğraflar kamu malı ya da açık lisanslı arşivlerden.`

| # | Name | Tagline (≤80) | Description |
| --- | --- | --- | --- |
| E2 | Yeni Yıl: Kar Altında Türkiye | Yeni yıla karlı kareler: 4 gün boyunca her gün 5 karlı fotoğraf | 31 Aralık – 3 Ocak arasında günün 5 fotoğrafı kıştan: Erzurum'dan İstanbul'a karlı sokaklar, yaylalar ve meydanlar. + Ö |
| E3 | Eski İstanbul Haftası | Bu hafta konum kolay, yıl zor: 7 gün boyunca sadece İstanbul fotoğrafları | 15–21 Şubat'ta her gün 5 İstanbul fotoğrafı: Tarihi Yarımada, Galata, Boğaz köyleri, Adalar. Semti bulmak kolay, yılı bulmak zor. + Ö |
| E4 | Bayramda Memleket | Ramazan Bayramı'na özel: istasyonlar, çarşılar ve memleket meydanları | 9–11 Mart'ta günün 5 fotoğrafı Anadolu kasabalarından: istasyonlar, çarşılar, meydanlar. Memleketini fotoğrafta tanıyabilecek misin? + Ö |
| E5 | 23 Nisan: Çocuklar ve Meclis | 23 Nisan'a özel: çocuklar, okul bahçeleri ve ilk Meclis | 23–25 Nisan'da günün fotoğraflarında ilk Meclis binası, okul bahçeleri ve çocuk bayramları var. Turu çocuğunla birlikte oyna. + Ö |
| E6 | 19 Mayıs: Gençlik ve Spor | 19 Mayıs'a özel: eski stadyumlar, spor bayramları ve Samsun | 19–21 Mayıs'ta günün 5 fotoğrafı spordan ve gençlikten: stadyumlar, spor bayramları, Samsun. + Ö |
| E7 | Kıyıdan Kıyıya: Vapurlar | Kabotaj Bayramı haftası: iskeleler, vapurlar ve deniz fenerleri | 1–7 Temmuz'da her gün dört denizin kıyılarından 5 fotoğraf: iskeleler, vapurlar, limanlar, fenerler. + Ö |
| E8 | Fotoğrafçıların İzinde | Dünya Fotoğraf Günü: 7 gün boyunca her gün bir usta fotoğrafçı | 19–25 Ağustos'ta her gün tek bir fotoğrafçının 5 karesi: Abdullah Biraderler, Sébah & Joaillier, Berggren ve diğerleri. + Ö |
| E9 | Raylarda Mazi | 7 gün boyunca garlar, köprüler ve trenler: hangi istasyon, hangi yıl? | 13–19 Eylül'de günün 5 fotoğrafı demiryolundan: Haydarpaşa'dan Anadolu istasyonlarına garlar, viyadükler, buharlı trenler. + Ö |
| E10 | Cumhuriyet'in İlk Yılları | 29 Ekim haftası: Cumhuriyet'in ilk yıllarından fotoğraflar (1923–1938) | 27–31 Ekim'de günün 5 fotoğrafı 1923–1938 arasından: yeni başkent Ankara, ilk demiryolları, okullar ve meydanlar. + Ö |
| E11 | Mazi 1 Yaşında: Mektepler | Mazi Türkiye 1 yaşında: yıl dönümünde yine eski mektepler | 24 Kasım'da, Öğretmenler Günü'nde, günün 5 fotoğrafı eski okullardan. + Ö |

## 6. Things deliberately not done, and why

| Day | Decision | Reason |
| --- | --- | --- |
| 10 November, 18 March, 15 July | No event, card not visible | Official remembrance days (Plan 8.5). |
| 6 February, 17 August | No event, card not visible | Anniversaries of major earthquakes. Photos from the affected provinces may still be in the game that day, but no promotion is done. |
| **29 May (Conquest of Istanbul)** | **No event.** Instead, "Eski İstanbul Haftası" (E3, February), which has no political connotation | 1. **No content:** There are no photos of 1453; the theme would be forced (tying "photos of the walled city" to 29 May changes their meaning). 2. **Divisive framing:** The current language of the celebration is open to political and identity debates; it conflicts with the game's neutral, open-to-everyone tone; it could backfire with foreign and non-Muslim players and in communities like r/Turkey. 3. **Calendar:** In 2027 it is too close to the two events on 16–21 May. |
| 30 August (Victory Day) | No gamified event; a simple celebration post is fine | The theme would be war photos; images of loss and the front line are not suitable for a scored game. |
| Feast of the Sacrifice (16–19 May 2027) | No separate event | Clashes with 19 May; no sacrifice imagery is used. |
| Kandil nights and religious nights | No event | To avoid gamifying religious content. |
| 8 March, 14 February | No store event; social content is possible | On 8 March, women photographers who contributed to photographic history, or a sourced story, can be shared. There is no themed set big enough for a store card. |

## 7. Task list for each event

| Time | Task |
| --- | --- |
| T−28 | A tagged search for the theme is run in the photo pipeline and a candidate list is produced. |
| T−21 | Photos are approved, scheduled for the relevant days and `days.theme` is written. Story texts are checked against the source. |
| T−18 | Images are prepared: Apple card (1920×1080), detail page (1080×1920), Play image. Source files follow the `marketing/social/src/` pattern; HTML to PNG. |
| T−15 / T−14 | Submitted to Apple and Play (dates in §3). The publication date is set in Apple. |
| T−14…T−1 | The card is visible in the store. At most one announcement on social media (captions.md §5). |
| T0 04:00 | The theme opens. That day's reminder notification mentions the theme (e.g. "Bugün Eski İstanbul Haftası başladı" — "Eski İstanbul Haftası started today"). |
| T+1 (the day after it ends) | Measurement: App Store Connect → Analytics → In-App Events (impressions, opens, downloads, redownloads) and the Play promotional content report. One line is written in the weekly report, and what was learned is added to DECISIONS.md. |
