# "Bil bakalım" videos

16 s, 1080×1920, H.264, 30 fps, silent (music can be added from the platform's own library). All come from the `bonus` pool: it is not used in the daily schedule or in 1v1, so the in-game surprise is not spoiled. The CTA on the last card is the pre-launch text (11–23 November): "24 Kasım'da App Store'da. / Haber almak için: maziturkiye.com". If a video is posted after 24 November, change the `cta` field per `../content-calendar.md` §1.1 and re-render.

| File | Place, year | Region | Size | Schedule |
| --- | --- | --- | --- | --- |
| `bb-001.mp4` | Rumeli Hisarı, İstanbul · 1913 | Marmara | 7,0 MB | 11 November |
| `bb-002.mp4` | Artemis Tapınağı, Selçuk (İzmir) · 2011 | Ege | 7,1 MB | 12 November |
| `bb-003.mp4` | Aspendos Antik Tiyatrosu, Antalya · 2005 | Akdeniz | 6,4 MB | 13 November (the calendar said Black Sea; the bonus pool has no Black Sea photo) |

## Regenerating

```bash
node marketing/templates/make-video.mjs marketing/videos/specs/bb-001.json      # → marketing/videos/bb-001/ (git'e girmez)
cd marketing/videos/bb-001 && npx -y hyperframes@0.9.10 check
npx -y hyperframes@0.9.10 render --crf 24 --max-bitrate 5M --output ../bb-001.mp4
```

`--max-bitrate 5M` keeps files at ~7 MB (CRF 24 alone produced 15–17 MB on finely detailed photos). `photos/` holds the 1920 px thumbnails downloaded from Commons.

## Attribution and licence

| Video | Author | Licence | Commons page | Pool key |
| --- | --- | --- | --- | --- |
| bb-001 | Auguste Léon (Albert-Kahn Museum, "Archives of the Planet"), 9 June 1913 | CC0 1.0 | https://commons.wikimedia.org/wiki/File:Le_ch%C3%A2teau_-_A2314.jpg | `5-16@pool-a-needgeo` |
| bb-002 | Roy Egloff, 4 October 2011 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:TR.IZ.Selcuk_Ephesus_2011-10-04_Temple-of-Artemis_07_3x2-R_5K.jpg | `3-13@pool-c` |
| bb-003 | Dennis G. Jarvis, 14 October 2005 | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:Turkey-2299_(2217028820)_(2).jpg | `1-17@pool-c` |

Author and licence were re-checked on 4 November 2026 via the Commons API (extmetadata). The attribution line is on every frame of the video; it is also written in the caption.
**BY-SA note:** in bb-002 and bb-003 the photo is cropped and zoomed, so the video may count as an adaptation. Add the line `Video: Mazi Türkiye, CC BY-SA 4.0` to the caption of these two videos (BY-SA 2.0 also allows adaptations to be licensed under a later version); give the licence link (https://creativecommons.org/licenses/by-sa/4.0/) in the YouTube description. bb-001 is CC0, no extra obligation.

---

## bb-001 · Rumeli Hisarı, 1913

> English summary: hook "Everyone knows this place. But the year?", standard pause-and-comment CTA, pre-launch CTA, attribution, hashtags.

**Instagram / Reels**
```
Burayı herkes bilir. Peki ya yılı?

Geri sayım bitmeden videoyu durdur, tahminini yorumlara yaz: şehir + yıl. Cevap videonun sonunda 👀

24 Kasım'da App Store'da. Haber almak için link profilde.

Fotoğraf: Auguste Léon, Wikimedia Commons, kamu malı (CC0)
#maziturkiye #eskifotoğraflar #nostalji #eskitürkiye #tarih
```
**TikTok:** on-screen text "Bu kule nerede, hangi yıl?" · hashtags: `#maziturkiye #bilbakalım #tahminoyunu #tarih`
**Shorts title:** `Bu fotoğraf nerede, hangi yıl? Bil bakalım #001` · in the description, the source page and the UTM link (`utm_source=youtube&utm_medium=post&utm_campaign=prelaunch-2026&utm_content=bb-001`) · `#shorts #tarih #nostalji`

> English summary: autochrome taken by Auguste Léon in spring 1913 for Albert Kahn's "Archives of the Planet"; colours are original, not hand-painted.

**Source info for story/carousel (after the answer):** Albert Kahn'ın "Gezegenin Arşivleri" için Auguste Léon'un 1913 baharında çektiği otokrom. Renkler sonradan boyanmadı; otokrom dönemin renkli cam plak tekniği.

## bb-002 · Selçuk, 2011

> English summary: hook "An ancient site in the Aegean. But which one, and what year?", standard CTA, attribution, hashtags.

**Instagram / Reels**
```
Ege'de bir antik alan. Ama hangisi, ve hangi yıl?

Geri sayım bitmeden videoyu durdur, tahminini yorumlara yaz: şehir + yıl. Cevap videonun sonunda 👀

24 Kasım'da App Store'da. Haber almak için link profilde.

Fotoğraf: Roy Egloff, Wikimedia Commons, CC BY-SA 4.0
#maziturkiye #bilbakalım #tahminoyunu #coğrafya
```
**TikTok:** on-screen text "Tek sütun kalmış. Burası neresi?" · `#maziturkiye #bilbakalım #tahminoyunu #tarih`
**Shorts title:** `Bu fotoğraf nerede, hangi yıl? Bil bakalım #002` · `utm_content=bb-002` · `#shorts #tarih #nostalji`

> English summary: the October 2011 shot in Selçuk combines three eras: the surviving column of the Temple of Artemis, the İsa Bey Mosque (1375), and Ayasuluk Castle behind.

**Source info:** Ekim 2011'de Selçuk'ta çekilen kare üç dönemi bir araya getiriyor: önde Artemis Tapınağı'nın ayakta kalan sütunu, ortada 1375'te yapılan İsa Bey Camii, en arkada Ayasuluk Kalesi.

## bb-003 · Aspendos, 2005

> English summary: hook "A stage on the Mediterranean. Can you drop a pin within 50 km?", standard CTA, attribution, hashtags.

**Instagram / Reels**
```
Akdeniz'de bir sahne. Haritada 50 km içine iğne bırakabilir misin?

Geri sayım bitmeden videoyu durdur, tahminini yorumlara yaz: şehir + yıl. Cevap videonun sonunda 👀

24 Kasım'da App Store'da. Haber almak için link profilde.

Fotoğraf: Dennis G. Jarvis, Wikimedia Commons, CC BY-SA 2.0
#maziturkiye #eskitürkiye #tarih #bilbakalım
```
**TikTok:** on-screen text "Bu tiyatro nerede, hangi yıl?" · `#maziturkiye #bilbakalım #tahminoyunu #coğrafya`
**Shorts title:** `Bu fotoğraf nerede, hangi yıl? Bil bakalım #003` · `utm_content=bb-003` · `#shorts #tarih #nostalji`

> English summary: the Roman theatre at Aspendos in 2005, with a stage set up for an event.

**Source info:** 2005'te Aspendos'taki Roma tiyatrosu; sahnede bir etkinlik için kurulmuş düzen görülüyor.

**Pinned comment (for all three, `../social/captions.md` §1B):**
```
Kural basit: şehir + yıl yaz. 50 km ve 5 yıl içindeysen ustasın 😄 Cevabı gördükten sonra "bildim" ya da "hiç yaklaşamadım" yaz.
```
