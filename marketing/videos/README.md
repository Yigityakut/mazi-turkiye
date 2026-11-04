# "Bil bakalım" videoları

16 sn, 1080×1920, H.264, 30 fps, sessiz (müzik platformun kendi kütüphanesinden eklenebilir). Hepsi `bonus` havuzundan: günlük programa ve 1v1'e girmez, oyundaki sürprizi bozmaz. Son karttaki CTA lansman öncesi metni (11–23 Kasım): "24 Kasım'da App Store'da. / Haber almak için: maziturkiye.com". 24 Kasım'dan sonra paylaşılacaksa `cta` alanı `../content-calendar.md` §1.1'e göre değiştirilip yeniden render edilir.

| Dosya | Yer, yıl | Bölge | Boyut | Takvim |
| --- | --- | --- | --- | --- |
| `bb-001.mp4` | Rumeli Hisarı, İstanbul · 1913 | Marmara | 7,0 MB | 11 Kasım |
| `bb-002.mp4` | Artemis Tapınağı, Selçuk (İzmir) · 2011 | Ege | 7,1 MB | 12 Kasım |
| `bb-003.mp4` | Aspendos Antik Tiyatrosu, Antalya · 2005 | Akdeniz | 6,4 MB | 13 Kasım (takvimde Karadeniz yazıyordu; bonus havuzunda Karadeniz fotoğrafı yok) |

## Yeniden üretme

```bash
node marketing/templates/make-video.mjs marketing/videos/specs/bb-001.json      # → marketing/videos/bb-001/ (git'e girmez)
cd marketing/videos/bb-001 && npx -y hyperframes@0.9.10 check
npx -y hyperframes@0.9.10 render --crf 24 --max-bitrate 5M --output ../bb-001.mp4
```

`--max-bitrate 5M` dosyaları ~7 MB'ta tutar (CRF 24 tek başına ince ayrıntılı fotoğraflarda 15–17 MB çıkarıyordu). `photos/` Commons'tan indirilen 1920 px küçük boyutlardır.

## Atıf ve lisans

| Video | Eser sahibi | Lisans | Commons sayfası | Havuz anahtarı |
| --- | --- | --- | --- | --- |
| bb-001 | Auguste Léon (Albert-Kahn Müzesi, "Gezegenin Arşivleri"), 9 Haziran 1913 | CC0 1.0 | https://commons.wikimedia.org/wiki/File:Le_ch%C3%A2teau_-_A2314.jpg | `5-16@pool-a-needgeo` |
| bb-002 | Roy Egloff, 4 Ekim 2011 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:TR.IZ.Selcuk_Ephesus_2011-10-04_Temple-of-Artemis_07_3x2-R_5K.jpg | `3-13@pool-c` |
| bb-003 | Dennis G. Jarvis, 14 Ekim 2005 | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:Turkey-2299_(2217028820)_(2).jpg | `1-17@pool-c` |

Yazar ve lisans 4 Kasım 2026'da Commons API'sinden (extmetadata) tekrar kontrol edildi. Atıf satırı videoda her karede var; açıklamaya da yazılır.
**BY-SA notu:** bb-002 ve bb-003'te fotoğraf kırpılıp yakınlaştırıldığı için video bir uyarlama sayılabilir. Bu iki videonun açıklamasına `Video: Mazi Türkiye, CC BY-SA 4.0` satırı eklenir (BY-SA 2.0 da uyarlamanın sonraki sürümle lisanslanmasına izin verir); lisans linki (https://creativecommons.org/licenses/by-sa/4.0/) YouTube açıklamasında verilir. bb-001 CC0, ek yükümlülük yok.

---

## bb-001 · Rumeli Hisarı, 1913

**Instagram / Reels**
```
Burayı herkes bilir. Peki ya yılı?

Geri sayım bitmeden videoyu durdur, tahminini yorumlara yaz: şehir + yıl. Cevap videonun sonunda 👀

24 Kasım'da App Store'da. Haber almak için link profilde.

Fotoğraf: Auguste Léon, Wikimedia Commons, kamu malı (CC0)
#maziturkiye #eskifotoğraflar #nostalji #eskitürkiye #tarih
```
**TikTok:** ekran üstü yazı "Bu kule nerede, hangi yıl?" · hashtag: `#maziturkiye #bilbakalım #tahminoyunu #tarih`
**Shorts başlığı:** `Bu fotoğraf nerede, hangi yıl? Bil bakalım #001` · açıklamaya kaynak sayfası ve UTM'li link (`utm_source=youtube&utm_medium=post&utm_campaign=prelaunch-2026&utm_content=bb-001`) · `#shorts #tarih #nostalji`
**Hikaye/karusel için kaynak bilgisi (cevaptan sonra):** Albert Kahn'ın "Gezegenin Arşivleri" için Auguste Léon'un 1913 baharında çektiği otokrom. Renkler sonradan boyanmadı; otokrom dönemin renkli cam plak tekniği.

## bb-002 · Selçuk, 2011

**Instagram / Reels**
```
Ege'de bir antik alan. Ama hangisi, ve hangi yıl?

Geri sayım bitmeden videoyu durdur, tahminini yorumlara yaz: şehir + yıl. Cevap videonun sonunda 👀

24 Kasım'da App Store'da. Haber almak için link profilde.

Fotoğraf: Roy Egloff, Wikimedia Commons, CC BY-SA 4.0
#maziturkiye #bilbakalım #tahminoyunu #coğrafya
```
**TikTok:** ekran üstü yazı "Tek sütun kalmış. Burası neresi?" · `#maziturkiye #bilbakalım #tahminoyunu #tarih`
**Shorts başlığı:** `Bu fotoğraf nerede, hangi yıl? Bil bakalım #002` · `utm_content=bb-002` · `#shorts #tarih #nostalji`
**Kaynak bilgisi:** Ekim 2011'de Selçuk'ta çekilen kare üç dönemi bir araya getiriyor: önde Artemis Tapınağı'nın ayakta kalan sütunu, ortada 1375'te yapılan İsa Bey Camii, en arkada Ayasuluk Kalesi.

## bb-003 · Aspendos, 2005

**Instagram / Reels**
```
Akdeniz'de bir sahne. Haritada 50 km içine iğne bırakabilir misin?

Geri sayım bitmeden videoyu durdur, tahminini yorumlara yaz: şehir + yıl. Cevap videonun sonunda 👀

24 Kasım'da App Store'da. Haber almak için link profilde.

Fotoğraf: Dennis G. Jarvis, Wikimedia Commons, CC BY-SA 2.0
#maziturkiye #eskitürkiye #tarih #bilbakalım
```
**TikTok:** ekran üstü yazı "Bu tiyatro nerede, hangi yıl?" · `#maziturkiye #bilbakalım #tahminoyunu #coğrafya`
**Shorts başlığı:** `Bu fotoğraf nerede, hangi yıl? Bil bakalım #003` · `utm_content=bb-003` · `#shorts #tarih #nostalji`
**Kaynak bilgisi:** 2005'te Aspendos'taki Roma tiyatrosu; sahnede bir etkinlik için kurulmuş düzen görülüyor.

**Sabit yorum (üçü için de, `../social/captions.md` §1B):**
```
Kural basit: şehir + yıl yaz. 50 km ve 5 yıl içindeysen ustasın 😄 Cevabı gördükten sonra "bildim" ya da "hiç yaklaşamadım" yaz.
```
