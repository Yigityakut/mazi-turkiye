# Fotoğraf inceleme rehberi (Plan Bölüm 3)

Her inceleyici panoları (`pipeline/review/<set>/sheet-NN.jpg`, 20 kare, etiket: `kimlik · yıl · il`) **Read aracıyla görerek** inceler,
seçtiklerinin meta verisini `node pipeline/show.mjs <set> <kimlik>…` ile okur ve `pipeline/selection/<set>.json` dosyasına yazar.

## Kabul kriterleri
- **Kalite:** net, yeterince aydınlık, konusu belli. Bulanık, çok karanlık, ilgisiz (sadece gökyüzü, tek bir yaprak, belge taraması, harita, çizim, gravür, kartpostal üzerindeki yazı ağırlıklı) → ele.
- **Fotoğraf olmalı:** resim, çizim, harita, model/maket (ör. **Miniatürk**), müze içi tek obje → ele.
- **Türkiye'de mi?** Konum Türkiye sınırları içinde, ≤5 km hassasiyetle belirlenebilir olmalı.
- **Yıl:** kesin yıl (±1). Panoramio'dan gelen ve yılı tam **2000** görünen dijital fotoğraflar (kamera saati varsayılanı olabilir) → ele, açıklama yılı doğrulamıyorsa.
- **İçerik:** şiddet, ölüm, savaş, terör, darbe, siyasi gerilim, asker/polis odaklı sahneler → ele. Ana konusu tanınabilir **özel kişi** olan portreler → ele (kalabalık, sokak, uzaktan insanlar serbest). Ünlü kişi portresi de ele (oyun mekân/zaman hakkında).
- **Cevabı ele vermesin:** Kareyi "İzmir 1985" gibi doğrudan cevabı yazan pankart/tabela/altyazı doluyorsa ele. Genel tabela ipucu olarak kalabilir.
- **Tekrar:** aynı yerin neredeyse aynı karesi → en iyisini al.
- **Lisans** zaten filtrelendi (kamu malı, CC0, CC BY, CC BY-SA). Yine de meta veride NC/ND görürsen ele.

## Koordinatsız adaylar (`*-needgeo`)
Başlık/açıklama/kategoriden **bilinen bir yer** çıkıyorsa (Galata Köprüsü, Ayasofya, Saat Kulesi İzmir, Sümela Manastırı…) o yerin koordinatını `lat`/`lng` olarak yaz (4 ondalık). Emin değilsen veya sadece "Anatolia", "a village" gibi belirsizse **ele**. Kamera konumu değil, fotoğraftaki yerin koordinatı yeterli (≤5 km).

## Her seçim için yazılacaklar
```json
{ "key": "1-12@pool-c", "pool": "daily", "difficulty": "orta",
  "location_name": "Ulu Cami ve Heykel Meydanı, Bursa",
  "title_tr": "Bursa Ulu Camii önü",
  "story_tr": "2–3 cümle, SADECE kaynak başlık/açıklama/kategorilerde yazan bilgiye dayanır. Uydurma tarih, isim, olay yok. Genel bilinen gerçekler (ör. Ulu Cami'nin 20 kubbeli olduğu) yazılabilir ama emin değilsen yazma.",
  "lat": 41.0, "lng": 29.0, "year": 1965 }
```
- `key`: `<pano kimliği>@<set adı>` (ör. `3-7@pool-a-needgeo`).
- `lat`/`lng`/`year`: sadece elle konumlama veya düzeltme gerekiyorsa.
- `location_name`: "Yer, İl" biçimi, Türkçe ve doğru yazım (İstanbul, İzmir, Çanakkale…).
- `difficulty`: **kolay** = ünlü, hemen tanınan yer veya yılı belirgin; **orta** = bölgesi tahmin edilebilir; **zor** = sıradan sokak/köy, az ipucu. Hedef karışım ≈ %30 kolay, %50 orta, %20 zor.
- `pool`: yaklaşık yarısı `daily`, yarısı `duel`. En güzel ve en "bil bakalım"lık 10–15 kareyi `bonus` yap (sosyal medya videoları için; günlük oyunda çıkmaz).
- Hikaye Türkçe, sıcak ama abartısız, 2–3 cümle; fotoğrafın yılı ve yeri hikayede geçebilir (açılımda gösterilir).

## Dağılım hedefi (lansman, toplam 200+)
| Dönem | Adet |
| --- | --- |
| 1880–1919 | 25 (Abdülhamid II koleksiyonu en fazla 15) |
| 1920–1949 | 30 |
| 1950–1979 | 40 |
| 1980–1999 | 40 |
| 2000–2026 | 65 |
7 bölgenin her birinden ≥10; İstanbul toplamın %30'unu geçmesin.

Dosya biçimi: `{ "set": "<set>", "reviewed_sheets": ["sheet-01", …], "items": [ … ], "rejected_notes": "kısa not" }`.
Doğrulama: `node pipeline/approve.mjs pipeline/selection/<set>.json > /dev/null` hatasız çalışmalı.
