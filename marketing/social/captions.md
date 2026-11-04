# Açıklama kalıpları, hikaye şablonları, X taslakları ve topluluk dili

> Ses tonu, biyografiler ve atıf kalıbı için `profiles.md`, hangi gün ne paylaşılacağı için `../content-calendar.md`.
> `‹…›` olan her yer doldurulur. **‹gerçek veri›** yazan yerler sadece veritabanından ya da PostHog'dan gelir; uydurma sayı yazılmaz, tahmini sayı yazılmaz.

## 0. Her açıklamada

- **İlk satır hook'tur.** Akışta sadece o görünür, kısa ve merak uyandıran bir cümle olmalı.
- **Tek CTA.** Döneme göre:
  - 11–23 Kasım: `24 Kasım'da App Store'da. Haber almak için link profilde.`
  - 24 Kasım – Android: `Mazi Türkiye App Store'da, Android Aralık başında. Link profilde.`
  - Android'den sonra: `Mazi Türkiye App Store ve Google Play'de. Link profilde.`
- **Atıf satırı her zaman:** `Fotoğraf: ‹Eser sahibi›, ‹Kaynak›, ‹Lisans›`
  - Kamu malı ise `kamu malı`, CC lisansında sürümüyle (`CC BY-SA 4.0`).
  - Eser sahibi bilinmiyorsa `Fotoğraf: Bilinmiyor, Wikimedia Commons, kamu malı`.
- **Bugünün fotoğrafları ve cevapları asla yazılmaz.**
- **Şehir hashtag'i cevabı ele verir.** Bil bakalım gönderisinde şehir ya da bölge hashtag'i kullanılmaz (§8).
- **En fazla 2–3 emoji.** Hashtag'ler en sonda.
- **Yapay zekâ seslendirmesi varsa** platformun "AI ile oluşturuldu" etiketi açılır, açıklamaya da `Seslendirme: yapay zekâ` yazılır.

---

## 1. Bil bakalım (Reels / TikTok / Shorts)

### 1A. Standart açıklama

```
‹Hook: cevabı vermeden bölge ya da dönem ipucu›

Geri sayım bitmeden videoyu durdur, tahminini yorumlara yaz: şehir + yıl. Cevap videonun sonunda 👀

‹CTA›

Fotoğraf: ‹Eser sahibi›, ‹Kaynak›, ‹Lisans›
‹hashtag seti›
```

**Hook formülleri** (hiçbiri cevabı söylemez):

| Formül | Örnek |
| --- | --- |
| Bölge ipucu | Ege'de bir liman. Ama hangisi, ve hangi yıl? |
| Dönem ikilemi | ‹1920'ler› mi, ‹1950'ler› mi? Arabalara iyi bak. |
| Yerel meydan okuma | ‹Karadeniz›liysen 3 saniyede bilirsin. Değilsen? |
| Aile | Bunu annene göster. Bence ilk o bilir. |
| Zorluk | Bu haftanın en zoru. Bilen çıkarsa yorumuna kalp bırakıyorum. |
| Mesafe | Haritada 50 km içine iğne bırakabilir misin? |
| Ayrıntı (sadece fotoğrafta gerçekten bir ipucu varsa) | Fotoğrafta tek bir ipucu var. Buldun mu? |
| Yer ama yıl değil | Burayı herkes bilir. Peki ya yılı? |

### 1B. Sabit yorum

Yayından hemen sonra yazılır ve sabitlenir:

```
Kural basit: şehir + yıl yaz. 50 km ve 5 yıl içindeysen ustasın 😄 Cevabı gördükten sonra "bildim" ya da "hiç yaklaşamadım" yaz.
```

### 1C. Geçmiş gün versiyonu (25 Kasım'dan itibaren)

```
Dünkü ‹N›. fotoğraf 👇 Oynamadıysan şimdi tahmin et; oynadıysan kaç puan aldığını yaz.

‹Sadece gerçek veriyle, n ≥ 100 ise: Oyuncuların %‹gerçek veri›'i 100 km içine iğne bıraktı.›

Bugünün 5 fotoğrafı uygulamada, her sabah 04:00'te yenileniyor.

Fotoğraf: ‹Eser sahibi›, ‹Kaynak›, ‹Lisans›
```

### 1D. YouTube Shorts

- **Başlık** (en fazla 100 karakter, ideali 60'ın altı): `Bu fotoğraf nerede, hangi yıl? Bil bakalım #‹NNN›`
- **Açıklama:**

```
‹Hook›
Cevap videonun sonunda. Tahminini yorumlara yaz.

Fotoğraf: ‹Eser sahibi›, ‹Kaynak›, ‹Lisans›
Kaynak sayfası: ‹kaynak URL›

Her gün 5 fotoğraf: https://maziturkiye.com/?utm_source=youtube&utm_medium=post&utm_campaign=‹kampanya›&utm_content=‹bb-NNN›
#shorts #tarih #nostalji
```

### 1E. TikTok

- Açıklama 1A'nın kısa hali: hook, tek satır CTA, atıf ve 3–4 hashtag.
- **Ekran üstü yazı** (TikTok editörü, ilk 2 saniye): hook'un en fazla 6 kelimelik hali, ör. "Bu sokak nerede, hangi yıl?"

---

## 2. Fotoğrafın hikayesi (30–45 sn video ya da 5 karelik karusel)

**Kural:** Hikayede sadece kaynakta yazan bilgi kullanılır: Commons açıklaması, LOC kaydı, `photos.story_tr`. "Söylenir ki" diye başlayan anlatım, tahmin ya da süsleme yoktur. Yıl kesin değilse (`year_uncertainty = 1`) "1890'lar civarı" yazılır.

**Karusel kareleri:**

1. Fotoğraf ve "Nerede, hangi yıl? Kaydırmadan önce tahmin et."
2. Haritada konum ve büyük harflerle yıl.
3. Hikaye: kaynaktan 2–3 kısa cümle.
4. (İsteğe bağlı) "Bugün orası": sadece kendi çektiğin ya da açık lisanslı güncel bir fotoğrafla. Yapay zekâ kullanılmaz.
5. Kaynak ve atıf, altında "Her gün 5 fotoğraf: Mazi Türkiye".

**Açıklama:**

```
Kaydırmadan tahmin et: bu fotoğraf nerede, hangi yıl? Cevap 2. karede.

‹Kaynaktan 2–3 cümle. Ör. "Fotoğrafın kaynaktaki başlığı: ‹başlık›. ‹Kaynakta yazan bir ayrıntı›."›

Bu fotoğrafı daha önce görmüş müydün? 👇

Fotoğraf: ‹Eser sahibi›, ‹Kaynak›, ‹Lisans›
‹hashtag seti: burada şehir hashtag'i serbest›
```

---

## 3. Topluluk istatistiği (8 sn kart ya da tek görsel)

**Kurallar:**

- Sadece **geçmiş günler.** Bugünün fotoğrafı hakkında istatistik paylaşılmaz, çünkü cevaba ipucu verir.
- **n < 100 ise yüzde paylaşılmaz.** Küçük örnek yanıltır. Onun yerine "dünün en zor fotoğrafı" paylaşılır.
- Yalnız `mode = 'daily'` oyunları sayılır; admin hesapları dahil edilmez. Yüzdeler tam sayıya yuvarlanır.
- **Sorgu ve sonucu paylaşımdan önce not edilir.** Biri sorarsa kaynağı gösterebilmek için.

**Sorgu (Supabase SQL):**

```sql
-- Dünün ‹N›. fotoğrafı (admin hariç, sadece günlük mod)
select count(*)                                               as n,
       round(100.0 * avg((abs(p.year_diff) <= 5)::int))      as yuzde_5_yil,
       round(100.0 * avg((p.distance_km <= 100)::int))       as yuzde_100_km,
       round(avg(p.score_location + p.score_year))           as ortalama_puan,
       round(avg(p.guess_year))                              as ortalama_yil_tahmini
from public.plays p
join public.profiles pr on pr.id = p.user_id
where p.day = public.game_day() - 1 and p.slot = ‹N› and p.mode = 'daily' and not pr.is_admin;
```

**Kalıplar:**

```
Dünkü ‹N›. fotoğrafı oyuncuların %‹gerçek veri›'i 5 yıl içinde bildi. Sen olsan?
```

```
Dünün ortalama skoru ‹gerçek veri› / 5.000. En çok zorlayan ‹N›. fotoğraftı: ortalama ‹gerçek veri› puan.
```

```
Kalabalığın bilgeliği: dünkü ‹N›. fotoğraf için yıl tahminlerinin ortalaması ‹gerçek veri›, doğru cevap ‹yıl›. ‹Tuttu! / Bu sefer tutmadı.›
```

```
Dün ‹N›. fotoğrafta oyuncuların %‹gerçek veri›'i iğnesini 100 km içine bıraktı. Haritada en çok şaşırtan fotoğraf buydu.
```

**Açıklamanın son satırı:** `Sayılar ‹tarih› günü oynanan turlardan, uygulama içi anonim verilerden.` ve atıf satırı.

---

## 4. Haftalık şampiyonlar (pazartesi)

- **Ayrı izin gerekir.** Oyuncu uygulama içi sıralamada görünse bile adı sosyal medyada paylaşılmadan önce izni alınır (uygulama içi mesaj ya da e-posta). İzin yoksa sadece skor yazılır. Şehir, yaş gibi kişisel bilgi yazılmaz.
- **Haftalık skor:** Pazartesi–pazar arasındaki 7 günlük turların toplamı, en çok 35.000. Sadece o gün oynanan turlar sayılır (`on_time`).

```
Haftanın şampiyonları 🏆 (‹tarih aralığı›)

1. ‹izinli takma ad› · ‹gerçek veri› puan
2. ‹izinli takma ad› · ‹gerçek veri› puan
3. ‹izinli takma ad› · ‹gerçek veri› puan

Haftanın en zor fotoğrafı ‹gün› günün ‹N›. fotoğrafıydı: ortalama ‹gerçek veri› puan. Kaydır, kendin dene 👉

Bu hafta senin adın burada olsun mu? Her sabah 04:00'te 5 yeni fotoğraf.
```

---

## 5. Tematik gün

Videoda ya da görselde **günün oyun fotoğrafları kullanılmaz.** Temaya uyan bir bonus ya da geçmiş gün fotoğrafı seçilir.

```
Bugün ‹tema›: günün 5 fotoğrafı ‹tema açıklaması›. ‹bitiş tarihi›'ne kadar uygulamada.

Bu videodaki fotoğraf oyundaki setten değil, sürpriz bozulmasın diye 🙂 Tahminini yine de yorumlara yaz.

Fotoğraf: ‹Eser sahibi›, ‹Kaynak›, ‹Lisans›
```

**Hazır örnekler** (takvim: `../../store/in-app-events.md`):

- **Öğretmenler Günü (24 Kasım):** `Bugün Öğretmenler Günü. Günün 5 fotoğrafı eski mekteplerden: sınıflar, okul bahçeleri, öğretmenler. Bütün öğretmenlerimizin günü kutlu olsun.`
- **Yeni Yıl (31 Aralık – 3 Ocak):** `Yeni yıla karlı kareler: 4 gün boyunca her gün 5 karlı fotoğraf. Erzurum mu, Kars mı, İstanbul mu? Bu kez kar da ipucu sayılmaz.`
- **23 Nisan:** `23 Nisan Ulusal Egemenlik ve Çocuk Bayramı kutlu olsun! Bugünün fotoğraflarında çocuklar ve ilk Meclis var. Bu turu çocuğunla birlikte oyna.`
- **19 Mayıs:** `19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı kutlu olsun. Bugün eski stadyumlar, spor bayramları ve Samsun.`
- **29 Ekim:** `Cumhuriyet Bayramımız kutlu olsun! Bu hafta Cumhuriyet'in ilk yıllarından fotoğraflar: yeni başkent, ilk demiryolları, okullar.`

**Anma günleri için kalıp yoktur, bilerek.** Paylaşım yapılacaksa sade bir metin olur; logo, CTA ve oyun dili kullanılmaz.

---

## 6. Instagram hikaye şablonları

| # | Çıkartma | Metin | Not |
| --- | --- | --- | --- |
| H1 | Quiz | **Sence hangi yıl?** Seçenekler: ‹doğru yıl› · ‹doğru + 12› · ‹doğru − 25› · ‹doğru + 40› | Seçeneklerden ikisi birbirine yakın olsun. Fotoğraf bonus havuzdan ya da geçmiş günden; cevap ertesi gün H7'de. |
| H2 | Quiz | **Hangi bölge?** 7 bölgeden 4'ü | Aynı fotoğrafla H1'den bir gün önce kullanılabilir. |
| H3 | Emoji kaydırıcı (📷) | **Bu fotoğraf ne kadar eski?** Sol: dün · Sağ: 140 yıl | Sonucu ertesi gün gerçek yılla göster. |
| H4 | Anket | **1v1'de kime karşı?** Arkadaşım · Rastgele biri | Ürün kararı için de faydalı. |
| H5 | Soru kutusu | **Hangi şehrin eski fotoğrafını görmek istersin?** | Cevaplar havuz ve tematik gün listesine yazılır. |
| H6 | Geri sayım | **Mazi Türkiye yayında.** 24 Kasım, 04:00 | "Hatırlat"a basanlara bildirim gider. Lansmanda link çıkartmasıyla tekrar. |
| H7 | — (metin) | **Dün sorduk:** %‹Instagram quiz sonucu› ‹seçenek› dedi. **Cevap:** ‹yer›, ‹yıl›. | Yüzde Instagram'ın kendi quiz sonucundan alınır, gerçek veridir. |
| H8 | — (3 kare) | **Kulis: fotoğrafları nasıl seçiyoruz?** 1) Lisansı açık mı? 2) Türkiye'de mi, yeri ve yılı belli mi? 3) Cevabı ele vermeden merak uyandırıyor mu? | Arşiv sayfasının ekran görüntüsü kullanılabilir. |
| H9 | Link | **Hafta sonu aile turnuvası:** Turu bitir, "Meydan oku"ya dokun, linki aile grubuna at. Pazar akşamı kim önde? | Kullanıcı ekran görüntülerini yeniden paylaşmadan önce izin alınır. |

---

## 7. X taslakları (20 gönderi)

**Kurallar:**

- Her gönderi 280 karakterin altında. Taslakların uzunluğu kontrol edildi; link 23 karakter sayılır.
- En fazla bir hashtag, çoğu zaman hiç.
- Görselli gönderide atıf satırı yazılır.
- Sayılar sadece oyunun kendi kurallarından (5 fotoğraf, 1.000 puan, 04:00) ya da ‹gerçek veri›den gelir.

**X-1 · Tanışma (sabitlenir, 11 Kasım)**
```
Merhaba X 👋 Biz Mazi Türkiye.

Her gün Türkiye'den 5 gerçek fotoğraf. Haritaya iğneni bırakıyorsun, yılı tahmin ediyorsun. 1880'lerden bugüne.

24 Kasım'da App Store'da. Haber almak için: https://maziturkiye.com/?utm_source=x&utm_medium=post&utm_campaign=prelaunch-2026&utm_content=x-1
```

**X-2 · Bil bakalım (görsel: bonus havuz)**
```
Bil bakalım 📍

Bu fotoğraf nerede ve hangi yıl çekildi? Şehir + yıl yaz, cevabı akşam 18:00'de alıntılıyoruz.

Fotoğraf: ‹Eser sahibi›, ‹Kaynak›, ‹Lisans›
```

**X-3 · Android testçi çağrısı (12 Kasım)**
```
Android kullanan tarih meraklıları 🙋

Google Play'e çıkmadan önce 14 günlük kapalı test zorunlu ve birkaç testçiye daha ihtiyacımız var. Günde 2–3 dakikalık bir oyun.

Katılmak istersen DM at; Play Store'da kullandığın Gmail adresini isteyeceğiz.
```

**X-4 · Fotoğraflar nereden?**
```
Fotoğraflar nereden geliyor?

Hepsi kamu malı ya da açık lisanslı: Wikimedia Commons, ABD Kongre Kütüphanesi'ndeki Abdülhamid II koleksiyonu ve benzeri arşivler. Her fotoğrafın sahibi ve lisansı oyunda yazıyor.

Yapay zekâyla üretilmiş tek bir "eski fotoğraf" yok.
```

**X-5 · Arşiv notu**
```
Küçük bir arşiv notu: II. Abdülhamid 1890'larda okulları, hastaneleri, kışlaları ve şehirleri gösteren fotoğraf albümlerini ABD Kongre Kütüphanesi'ne hediye etti.

Bugün kamu malı, herkes inceleyebiliyor. Oyundaki 1890'lar fotoğraflarının bir kısmı oradan.
```

**X-6 · Anket**
```
Hangisini tahmin etmek daha zor?

(Oyunda ikisi de 500'er puan.)

[Anket: Konum · Yıl · İkisi de · Fotoğrafa göre değişir]
```

**X-7 · Şehir isteği**
```
Bir şehir yaz, eski fotoğraflarını arayalım 👇

Hangi şehirlerin yeterince açık lisanslı fotoğrafı var, birlikte görelim. En çok istenenler tematik gün olur.
```

**X-8 · Kurucu notu** (kurucunun kendi cümleleriyle doldurulur, uydurulmaz)
```
Bunu neden yapıyorum: ‹kurucunun kendi 1–2 cümlesi›

Mazi Türkiye'yi tek başıma yapıyorum. Soruları, önerileri, eleştirileri burada okuyorum; çekinmeden yaz.
```

**X-9 · Puanlama**
```
Puanlama nasıl?

Her fotoğraf en çok 1.000 puan: 500 konum, 500 yıl.
• 50 km sapma ≈ 358 puan
• 5 yıl sapma ≈ 303 puan
• Tam isabet o bölümü 500'e tamamlar

Günlük en yüksek skor: 5.000.
```

**X-10 · Cevap (X-2'nin 18:00 alıntısı)**
```
Cevap: ‹Yer›, ‹yıl› 📍

En yakın tahmin @‹kullanıcı›'dan geldi: ‹tahmin›. Tebrikler!

Fotoğraf: ‹Eser sahibi›, ‹Kaynak›, ‹Lisans›
Yarın yeni bir fotoğraf.
```

**X-11 · Nasıl oynanır (gerçek ekran kaydı)**
```
Böyle oynanıyor: fotoğrafa bak → haritaya iğneni bırak → yılı kaydır → gerçek yeri ve yılı gör.

Her fotoğrafın sonunda kısa hikayesi ve kaynağı var.

24 Kasım'da App Store'da. [ekran kaydı]
```

**X-12 · Pro neden abonelik değil?**
```
Günlük oyun ücretsiz ve reklamsız kalacak.

İsteyene tek seferlik Pro: ipuçları, geçmiş günlerin arşivi, sınırsız 1v1, detaylı istatistik ve seri koruma.

Abonelik yok. Bir kere alırsın, o kadar.
```

**X-13 · 1v1 anketi**
```
Canlı 1v1'de ikiniz aynı fotoğrafı aynı anda görüyorsunuz, 45 saniyeniz var.

Kime karşı oynamak istersin?

[Anket: Arkadaşıma · Rastgele birine · İkisi de]
```

**X-14 · 2 gün kaldı (22 Kasım)**
```
2 gün kaldı.

Salı sabahı 04:00'te ilk 5 fotoğraf açılıyor. Herkes aynı fotoğrafları oynayacak; ilk günün sıralamasında yerini al.
```

**X-15 · Yarın (23 Kasım)**
```
Yarın 🗺️

Mazi Türkiye 24 Kasım'da App Store'da. Android Aralık başında.

Haber almak isteyenler: https://maziturkiye.com/?utm_source=x&utm_medium=post&utm_campaign=prelaunch-2026&utm_content=x-15
```

**X-16 · Lansman (sabitlenir, 24 Kasım)**
```
Mazi Türkiye bugün App Store'da 🎉

Her gün 5 gerçek fotoğraf, tek soru: nerede, hangi yıl?
Ücretsiz, reklamsız, hesap açmadan oynanıyor. Android Aralık başında.

https://apps.apple.com/tr/app/id‹APP_ID›?pt=‹PT›&ct=x-launch-2026&mt=8
```

**X-17 · Meydan okuma**
```
Bugünün turunu bitirince "Meydan oku"ya bas, linki WhatsApp'tan gönder.

Arkadaşın aynı 5 fotoğrafı oynar, skorlarınız yan yana çıkar.

Aile grubunda en iyi kimin bildiğini öğrenmenin en kısa yolu.
```

**X-18 · Topluluk istatistiği** (sadece n ≥ 100 ise)
```
Dünkü ‹N›. fotoğrafı oyuncuların %‹gerçek veri›'i 5 yıl içinde bildi.

Bugünküler daha mı kolay? 04:00'te 5 yeni fotoğraf geldi.
```

**X-19 · 1v1 hakkında dürüst not**
```
Dürüst bir not: 1v1'de önce gerçek bir rakip arıyoruz. Bulamazsak yapay zekâ rakip atanabiliyor; bunu kullanım koşullarında açıkça yazdık.

Arkadaşınla oynamak istersen en garantisi meydan okuma linki.
```

**X-20 · Android geldi (~3 Aralık)**
```
Android'ciler, beklediğiniz için teşekkürler 🙏

Mazi Türkiye artık Google Play'de. iPhone'lu arkadaşlarınıza aynı 5 fotoğrafla meydan okuyabilirsiniz.

https://play.google.com/store/apps/details?id=com.maziturkiye.app&referrer=utm_source%3Dx%26utm_campaign%3Dandroid-2026
```

---

## 8. Hashtag setleri

**Platform başına:**

| Platform | Kaç tane |
| --- | --- |
| Instagram | 3–5 |
| TikTok | 3–4 |
| Shorts | `#shorts` + 2 |
| X | 0–1 |

Her gün aynı set kullanılmaz; setler dönüşümlü kullanılır.

| Set | Etiketler | Ne zaman |
| --- | --- | --- |
| Marka (her zaman, 1 tane) | `#maziturkiye` | Her gönderi |
| A · Nostalji | `#eskifotoğraflar` `#nostalji` `#eskitürkiye` `#tarih` | Bil bakalım (cevabı ele vermez) |
| B · Oyun | `#bilbakalım` `#tahminoyunu` `#bilgiyarışması` `#coğrafya` | Bil bakalım, ekran kaydı |
| C · Şehir | `#eski‹şehir›` (ör. `#eskiistanbul` `#eskiizmir` `#eskiankara`) | **Sadece** cevabın açık olduğu gönderiler: hikaye, geçmiş gün cevabı |
| D · Tematik | `#öğretmenlergünü` `#yeniyıl` `#23nisan` `#19mayıs` `#29ekim` | Sadece o tematik gün |
| E · Shorts | `#shorts` `#tarih` `#nostalji` | YouTube |

**Notlar:**

- Türkçe karakterli ve ASCII sürümler (`#eskifotoğraflar` ve `#eskifotograflar`) ayrı etiketlerdir. İlk kullanımdan önce hangisinin daha canlı olduğuna bakılır ve o seçilir.
- Bir etiketi ilk kez kullanmadan önce sayfası açılır: içerik alakalı mı, etiket kısıtlanmış mı?
- Siyasi, trajik ya da trend olan gündem etiketleri hiç kullanılmaz.

---

## 9. Yorumlara cevap rehberi

1. **Hız:** İlk 1 saatte her yoruma cevap verilir. Sonrasında günde iki tur yapılır, öğlen ve akşam.
2. **Tahmini kutla, yanlışla dalga geçme.** Yakınlık bilgisi ver: "100 km kadar doğudaydı", "8 yıl erken".
3. **Bugünün cevaplarını yazan olursa** (oyundaki günün spoiler'ı) yorum gizlenir ve kibarca açıklanır. Bonus ya da geçmiş gün videolarında erken cevap serbesttir.
4. **Bilgi düzeltmesi:**
   - Teşekkür edilir ve kaynak kontrol edilir.
   - Yorum haklıysa açıklamaya `Düzeltme: …` satırı eklenir ve uygulamadaki kayıt güncellenir.
   - Haklı değilse kaynak gösterilir; tartışmaya girilmez.
5. **Siyaset, etnik ya da dini tartışma, provokasyon:** Tartışmaya girilmez, konu fotoğrafa geri getirilir. Nefret söylemi ve hakaret gizlenir ya da silinir, gerekirse hesap engellenir.
6. **"Yapay zekâ mı?" sorusu:** Açık cevap ve kaynak linki.
7. **Telif bildirimi:** Teşekkür edilir, kişi destek@maziturkiye.com'a yönlendirilir, fotoğraf inceleme bitene kadar kaldırılır (destek sayfasındaki süreç).
8. **Hata ya da şikayet:** Özür dilenir, destek e-postası verilir, takip edilir. "Bende çalışıyor" denmez.
9. **Android sorusu** (3 Aralık'tan önce): "Aralık başında geliyor; profildeki linkten e-postanı bırakırsan çıktığı gün haber veririz."
10. **Asla yapılmayacaklar:**
    - İkinci hesapla cevap yazmak.
    - Satın alınmış yorum.
    - "5 yıldız ver" ricası, ödül karşılığı yorum ya da puan istemek.
    - Başka bir oyunu kötülemek.
11. **Ton:** "Sen" dili, sıcak ve kısa, en fazla bir emoji.

### 10 örnek cevap

1. **Tam isabet:** "Vay! Hem şehir hem yıl tutmuş 👏 Bu fotoğrafta 1.000'e en çok yaklaşan sen olabilirsin."
2. **Yakın tahmin:** "Çok yakın! Yer doğru, yıl 8 yıl sonrası. Arabaları görüp 70'ler demek gayet mantıklı aslında."
3. **Uzak tahmin:** "Haritada epey uzaktın ama bu fotoğraf herkesi şaşırttı, rahat ol 😄 Yarın yeni bir tane var."
4. **"Yapay zekâ mı bu?":** "Değil. Fotoğraf ‹Kaynak›'ta, ‹Eser sahibi›'ne ait, lisansı ‹Lisans›. Linki açıklamada. Oyunda yapay zekâyla üretilmiş tek bir görsel yok."
5. **Bilgi düzeltmesi:** "Çok teşekkürler! Kaynağa tekrar baktık, haklısın: ‹düzeltme›. Açıklamaya düzeltme notu ekledik, uygulamadaki kaydı da güncelliyoruz."
6. **Telif:** "Haber verdiğin için teşekkürler. Hak sahibiysen destek@maziturkiye.com'a yazar mısın? İnceleme bitene kadar fotoğrafı hemen kaldırıyoruz."
7. **Günün spoiler'ı:** "Bugünün cevaplarını yazmayalım ki herkes kendi tahminini yapabilsin 🙏 Yorumu gizledik, yarın birlikte konuşuruz."
8. **Siyasi provokasyon:** "Burada sadece fotoğrafın nerede ve ne zaman çekildiğini konuşuyoruz. Senin tahminin neydi?"
9. **"1v1 rakibim bot muydu?":** "Önce gerçek oyuncu arıyoruz; bulamazsak yapay zekâ rakip atanabiliyor, kullanım koşullarında da yazıyor. Arkadaşınla oynamak istersen meydan okuma linki en garantisi."
10. **"Benim şehrim de olsun":** "Not aldık! ‹Şehir› için açık lisanslı fotoğraf arıyoruz, bulursak bir gün mutlaka çıkar. Bildiğin bir arşiv varsa yaz, birlikte bakalım."
