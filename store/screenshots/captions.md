# Store screenshot captions

This table is read by `render.mjs`: change the caption here and rerun `render.mjs` (or CI), that is all.
`*kelime*` → emphasis (terracotta color, italic). The column separator `|` is not used inside text.

| # | file | screen (demo route) | headline | subline |
| --- | --- | --- | --- | --- |
| 01 | nerede | /play?demo_state=guess | Bu fotoğraf *nerede*, hangi yıl? | Haritaya iğneni bırak, yılı seç |
| 02 | yakindin | /play?demo_state=reveal | Ne kadar *yakındın*? | Mesafe, yıl farkı ve puan anında |
| 03 | canli-1v1 | /duel/demo?phase=reveal | Canlı 1v1: *aynı anda* yarış | Aynı fotoğraf, 45 saniye |
| 04 | her-gun | /?demo_state=done | Her gün *5 yeni* fotoğraf | Her sabah yeni tur, serini bozma |
| 05 | meydan-oku | /summary?demo_state=done&challenge=MZ7K2Q | Arkadaşına *meydan oku* | Aynı 5 fotoğraf, skorlar yan yana |
| 06 | istatistik | /stats | Hangi *dönemde* iyisin? | Dönem ve bölge istatistiği Pro'da |

## Rules (Plan.md, Section 8)

- The headline is a 3–5 word benefit sentence. The first 3 images decide conversion: (1) photo + map, (2) reveal moment, (3) live 1v1.
- No fake user counts, made-up reviews or "thousands of players". The total player count is not shown in the demo data either
  (the "N oyuncu arasında" (among N players) line in the day summary is turned off in the demo).
- If a Pro feature is shown, it is stated in the subline (Apple 2.3.2): the period/region statistics in 06 are Pro.
- In 1v1 the opponent name ("Çağla") and the challenging friend ("Ayşe") are fictional; the scores are computed with the game's real scoring formula.

## Sizes

| Output | Size | Note |
| --- | --- | --- |
| `out/ios-6.9/NN-*.png` | 1320 × 2868 | App Store, 6.9" iPhone (required size; Apple scales for smaller iPhones) |
| `out/android-phone/NN-*.png` | 1080 × 1920 | Google Play phone (9:16) |
| `out/feature-graphic.png` | 1024 × 500 | Google Play feature graphic |
| `out/iap-review.png` | 1320 × 2868 | App Store Connect → Pro (pro_lifetime) → review screenshot |

## Regenerating

```bash
node store/screenshots/prepare.mjs --download # downloads the real photos from Commons (scaled down to 2000 px) + credits → app/public/demo/
(cd app && EXPO_PUBLIC_DEMO=1 npx expo export --platform web --output-dir ../store/screenshots/.build)
node store/screenshots/render.mjs store/screenshots/.build          # → store/screenshots/out/
node store/screenshots/render.mjs store/screenshots/.build --dark   # optional dark set → out/*-dark/
# options: --only=01,03  --platforms=ios  --no-extras (no IAP + feature graphic)  --keep-work (intermediate HTML/PNGs)
```

Without Playwright: `cd store/screenshots && npm ci && npx playwright install --with-deps chromium`.
To browse the demo screens in a browser, open the build with any single-page server and type
`/play?demo_state=reveal`, `/duel/demo?phase=guessing` etc. in the address bar (full list: top of `app/src/lib/demo.ts`).
If `demo_scroll=<metin>` is added to the screen route, render.mjs scrolls the card containing that text to the top of the screen.

If every photo in `fixtures.json` has `commons_url` filled in, CI (`.github/workflows/screenshots.yml`) downloads the real photos,
generates the images and commits `store/screenshots/out/` to the same branch. If any photo has an empty `commons_url`
(placeholder), local outputs get a "TASLAK" (draft) label along the bottom edge; these are not uploaded to the store.

## Demo photos (fixtures.json)

All six are live, reviewed photos in the game (`pipeline/selection/*.json`, daily/duel pool); the `pipeline_key` field
shows the source. Photo 3 is used on screens 01/02 and in the feature graphic, photo 6 on the 1v1 screen.

| # | Year | Place | Photographer · license |
| --- | --- | --- | --- |
| 1 | 1893 | Foot of Kadifekale, İzmir | André Salles · Public domain |
| 2 | 1929 | Second TBMM Building (Ulus), Ankara | Unknown photographer · Public domain |
| 3 | 1965 | Eminönü Pier, İstanbul | Fortepan / Krasznai Gyula · CC BY-SA 3.0 |
| 4 | 1992 | Old Halfeti, Şanlıurfa | Volker Höhfeld · CC BY-SA 4.0 |
| 5 | 2018 | Safranbolu, Karabük | Ray Swi-hymn · CC BY-SA 2.0 |
| 6 | 1976 | Mount Ararat, Iğdır | Gerd Eichmann · CC BY-SA 4.0 |

The feature graphic (feature-graphic.png) has no credit area: the credit for photo 3 must be written in the
"Fotoğraf künyeleri" (photo credits) line at the end of the Google Play description (CC BY-SA 3.0 requires attribution).
