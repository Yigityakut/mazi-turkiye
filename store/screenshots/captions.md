# Mağaza ekran görüntüsü başlıkları

Bu tablo `render.mjs` tarafından okunur: başlığı burada değiştirip `render.mjs`'i (veya CI'ı) yeniden çalıştırmak yeterli.
`*kelime*` → vurgu (kiremit renk, italik). Sütun ayırıcı `|` metin içinde kullanılmaz.

| # | dosya | ekran (demo adresi) | başlık | alt satır |
| --- | --- | --- | --- | --- |
| 01 | nerede | /play?demo_state=guess | Bu fotoğraf *nerede*, hangi yıl? | Haritaya iğneni bırak, yılı seç |
| 02 | yakindin | /play?demo_state=reveal | Ne kadar *yakındın*? | Mesafe, yıl farkı ve puan anında |
| 03 | canli-1v1 | /duel/demo?phase=reveal | Canlı 1v1: *aynı anda* yarış | Aynı fotoğraf, 45 saniye |
| 04 | her-gun | /?demo_state=done | Her gün *5 yeni* fotoğraf | Her sabah yeni tur, serini bozma |
| 05 | meydan-oku | /summary?demo_state=done&challenge=MZ7K2Q | Arkadaşına *meydan oku* | Aynı 5 fotoğraf, skorlar yan yana |
| 06 | istatistik | /stats | Hangi *dönemde* iyisin? | Dönem ve bölge istatistiği Pro'da |

## Kurallar (Plan.md, Bölüm 8)

- Başlık 3–5 kelimelik bir fayda cümlesi. İlk 3 görsel dönüşümü belirler: (1) fotoğraf + harita, (2) açılım anı, (3) canlı 1v1.
- Sahte kullanıcı sayısı, uydurma yorum, "binlerce oyuncu" yok. Demo verisinde de toplam oyuncu sayısı gösterilmez
  (gün özetindeki "N oyuncu arasında" satırı demo'da kapalı).
- Pro'ya ait özellik gösteriliyorsa alt satırda belirtilir (Apple 2.3.2): 06'daki dönem/bölge istatistiği Pro.
- 1v1'de rakip adı ("Çağla") ve meydan okuyan arkadaş ("Ayşe") kurgusal; skorlar oyunun gerçek puan formülüyle hesaplanır.

## Boyutlar

| Çıktı | Boyut | Not |
| --- | --- | --- |
| `out/ios-6.9/NN-*.png` | 1320 × 2868 | App Store, 6,9" iPhone (zorunlu boyut; küçük iPhone'lara Apple ölçekler) |
| `out/android-phone/NN-*.png` | 1080 × 1920 | Google Play telefon (9:16) |
| `out/feature-graphic.png` | 1024 × 500 | Google Play öne çıkan görsel |
| `out/iap-review.png` | 1320 × 2868 | App Store Connect → Pro (pro_lifetime) → inceleme ekran görüntüsü |

## Yeniden üretme

```bash
node store/screenshots/prepare.mjs            # künyeler + (yoksa) yer tutucu fotoğraflar → app/public/demo/
(cd app && EXPO_PUBLIC_DEMO=1 npx expo export --platform web --output-dir ../store/screenshots/.build)
node store/screenshots/render.mjs store/screenshots/.build          # → store/screenshots/out/
node store/screenshots/render.mjs store/screenshots/.build --dark   # isteğe bağlı karanlık set → out/*-dark/
# seçenekler: --only=01,03  --platforms=ios  --no-extras (IAP + öne çıkan görsel yok)  --keep-work (ara HTML/PNG'ler)
```

Playwright yoksa: `cd store/screenshots && npm ci && npx playwright install --with-deps chromium`.
Demo ekranlarını tarayıcıda gezmek için derlemeyi herhangi bir tek sayfa sunucusuyla açıp adres satırına
`/play?demo_state=reveal`, `/duel/demo?phase=guessing` vb. yaz (tam liste: `app/src/lib/demo.ts` başı).
Ekran adresine `demo_scroll=<metin>` eklenirse render.mjs o metni içeren kartı ekranın üstüne kaydırır.

`fixtures.json`'daki fotoğrafların hepsinde `commons_url` doluysa CI (`.github/workflows/screenshots.yml`) gerçek fotoğrafları
indirir, görselleri üretir ve `store/screenshots/out/`'u aynı dala commit'ler. Yer tutucu fotoğraflı yerel taslaklarda
alt kenarda "TASLAK" etiketi çıkar; bunlar mağazaya yüklenmez.
