# Photo review guide (Plan Section 3)

Each reviewer examines the sheets (`pipeline/review/<set>/sheet-NN.jpg`, 20 frames, label: `kimlik · yıl · il`) **by viewing them with the Read tool**,
reads the metadata of the ones they select with `node pipeline/show.mjs <set> <kimlik>…` and writes it to the `pipeline/selection/<set>.json` file.

## Acceptance criteria
- **Quality:** sharp, bright enough, clear subject. Blurry, very dark, irrelevant (only sky, a single leaf, document scan, map, drawing, engraving, mostly text on a postcard) → reject.
- **Must be a photograph:** painting, drawing, map, model/miniature (e.g. **Miniatürk**), a single object inside a museum → reject.
- **Is it in Türkiye?** The location must be inside Türkiye's borders and determinable to ≤5 km precision.
- **Year:** exact year (±1). Digital photos from Panoramio whose year shows as exactly **2000** (may be the camera clock default) → reject, if the description does not confirm the year.
- **Content:** violence, death, war, terrorism, coups, political tension, scenes focused on soldiers/police → reject. Portraits whose main subject is a recognizable **private individual** → reject (crowds, streets, people at a distance are fine). Portraits of famous people are also rejected (the game is about place and time).
- **Must not give away the answer:** If the frame is filled with a banner/sign/caption that directly states the answer, such as "İzmir 1985", reject. A general sign can stay as a clue.
- **Duplicates:** an almost identical frame of the same place → take the best one.
- **License** was already filtered (public domain, CC0, CC BY, CC BY-SA). Still, if you see NC/ND in the metadata, reject.

## Candidates without coordinates (`*-needgeo`)
If a **known place** can be identified from the title/description/category (Galata Bridge, Hagia Sophia, Clock Tower İzmir, Sümela Monastery…), write that place's coordinates as `lat`/`lng` (4 decimals). If you are not sure, or it is only vague like "Anatolia", "a village", **reject**. The coordinates of the place in the photo, not the camera position, are enough (≤5 km).

## What to write for each selection
```json
{ "key": "1-12@pool-c", "pool": "daily", "difficulty": "orta",
  "location_name": "Ulu Cami ve Heykel Meydanı, Bursa",
  "title_tr": "Bursa Ulu Camii önü",
  "story_tr": "2–3 cümle, SADECE kaynak başlık/açıklama/kategorilerde yazan bilgiye dayanır. Uydurma tarih, isim, olay yok. Genel bilinen gerçekler (ör. Ulu Cami'nin 20 kubbeli olduğu) yazılabilir ama emin değilsen yazma.",
  "lat": 41.0, "lng": 29.0, "year": 1965 }
```
- `key`: `<pano kimliği>@<set adı>` (e.g. `3-7@pool-a-needgeo`).
- `lat`/`lng`/`year`: only if manual placement or a correction is needed.
- `location_name`: "Yer, İl" (Place, Province) format, in Turkish with correct spelling (İstanbul, İzmir, Çanakkale…).
- `difficulty`: **kolay** (easy) = a famous, instantly recognized place or an obvious year; **orta** (medium) = the region can be guessed; **zor** (hard) = an ordinary street/village, few clues. Target mix ≈ 30% easy, 50% medium, 20% hard.
- `pool`: roughly half `daily`, half `duel`. Make the 10–15 most beautiful and most "bil bakalım"-worthy frames `bonus` (for social media videos; they do not appear in the daily game).
- The story is in Turkish, warm but not exaggerated, 2–3 sentences; the photo's year and place may appear in the story (it is shown at the reveal).

## Distribution target (launch, 200+ in total)
| Period | Count |
| --- | --- |
| 1880–1919 | 25 (Abdülhamid II collection at most 15) |
| 1920–1949 | 30 |
| 1950–1979 | 40 |
| 1980–1999 | 40 |
| 2000–2026 | 65 |
≥10 from each of the 7 regions; İstanbul must not exceed 30% of the total.

File format: `{ "set": "<set>", "reviewed_sheets": ["sheet-01", …], "items": [ … ], "rejected_notes": "kısa not" }`.
Validation: `node pipeline/approve.mjs pipeline/selection/<set>.json > /dev/null` must run without errors.
