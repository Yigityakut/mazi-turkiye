# İçerik takvimi: lansman öncesi, lansman haftası, Aralık 2026

> **Kapsam:** 10 Kasım – 31 Aralık 2026 · iOS lansmanı **Salı 24 Kasım** · Android üretim **~3 Aralık**
> **Dayanak:** Plan 8.5, 9 ve 10.
> **Hazır metinler:** profiller `social/profiles.md` · açıklama kalıpları ve X taslakları `social/captions.md` · e-postalar `email/waitlist-launch.md` · Reddit, basın ve iş birliği `outreach/` · Android testçileri `testers.md` · mağaza etkinlikleri `../store/in-app-events.md`
> **Görseller:** `social/profile-1080.png`, `social/cover-1500x500.png`, `social/youtube-banner-2560x1440.png`, `../web/assets/og.png` (HTML kaynakları `social/src/`)

---

## 0. Her gönderiden önce 30 saniyelik kontrol

1. **Fotoğraf bugünün setinde değil.** Sadece geçmiş günler veya `bonus` havuzu. Lansmandan önce geçmiş gün olmadığı için **24 Kasım'a kadar her şey `bonus` havuzundan** gelir.
2. **Atıf açıklamada:** `Fotoğraf: <Eser sahibi>, <Kaynak>, <Lisans>`. Videoda atıf satırı zaten her karede var, açıklamaya da yazılır.
3. **Uydurma yok:** Yapay zekâyla üretilmiş "eski" görsel, uydurma sayı, satın alınmış takipçi, beğeni ya da yorum olmaz. Sayı gerekiyorsa ‹gerçek veri› sorgusundan gelir. Veri yoksa cümle sayı kullanmadan kurulur.
4. **Takvim:** Anma günlerinde (10 Kasım, 6 Şubat, 18 Mart, 15 Temmuz, 17 Ağustos) ve ilan edilen milli yas günlerinde oyunlaştırılmış paylaşım yapılmaz. O günün zamanlanmış gönderileri durdurulur.
5. **Link UTM'li olmalı** (Bölüm 5.1). Yapay zekâ seslendirmesi kullanıldıysa platformun "AI ile oluşturuldu" etiketi açılır.

---

## 1. Üretim ve hazırlık (5–9 Kasım)

### 1.1 Üretim aracı: "Bil bakalım" şablonu

`marketing/templates/make-video.mjs` 15–16 saniyelik, 1080×1920 boyutunda bir HyperFrames videosu üretir. Akışı şöyle: giriş kartı → fotoğraf ve "Bu fotoğraf nerede? Hangi yıl?" sorusu → 5'ten geri sayım → haritada cevap, yıl sayacı, yer adı ve CTA. Aynı MP4 Reels, TikTok ve Shorts'a yüklenir.

```bash
# spec: marketing/videos/specs/bb-001.json
#   { id, image (spec'e göre göreli yol), year, location, lat, lng, author, source, license, cta? {title, sub} }
node marketing/templates/make-video.mjs marketing/videos/specs/bb-001.json     # → marketing/videos/bb-001/
cd marketing/videos/bb-001
npx -y hyperframes@0.9.10 check
npx -y hyperframes@0.9.10 snapshot --at 1,4,11,14   # taşma, atıf, logo ve cevap karesini gözle kontrol et
npx -y hyperframes@0.9.10 render --output bb-001.mp4
```

Videonun son kartındaki CTA **dönemine göre** değişir. Şablon, spec'teki isteğe bağlı `cta` alanını okur. Bu alanı boş bırakırsan varsayılan metin çıkar; o metin Android yayınlanmadan önce doğru değildir.

| Dönem | `cta.title` | `cta.sub` |
| --- | --- | --- |
| 11–23 Kasım | 24 Kasım'da App Store'da. | Haber almak için: maziturkiye.com |
| 24 Kasım – Android yayını | Her gün 5 fotoğraf. | Mazi Türkiye · App Store'da · Android yakında |
| Android yayınından sonra | (boş bırak, varsayılan) | (boş bırak: "Mazi Türkiye · App Store ve Google Play") |

Lansman öncesi (bekleme listesi) spec örneği:

```json
{ "id": "bb-001", "image": "../photos/bb-001.jpg", "year": 1890, "location": "‹Yer›, ‹İl›", "lat": 41.0, "lng": 28.9,
  "author": "‹Eser sahibi›", "source": "Library of Congress", "license": "kamu malı",
  "cta": { "title": "24 Kasım'da App Store'da.", "sub": "Haber almak için: maziturkiye.com" } }
```

### 1.2 Pazarlama havuzu

- 14 video için **20 fotoğraf** seç (`status = 'onayli'`, `pool = 'bonus'`). Bonus havuzu ne günlük programa ne de 1v1'e girer, bu yüzden bu fotoğraflar oyundaki sürprizi bozmaz.
- **Seçim ölçütleri:**
  - 7 bölgenin her birinden en az bir fotoğraf olsun, dönemler 1880'lerden 2000'lere yayılsın.
  - İlk saniyede merak uyandırsın ama tek bakışta cevabı ele vermesin.
  - Dikey kırpmada önemli kısım ortada kalsın.
  - Sıradan insanların yüzünün yakından ve tanınır biçimde göründüğü yeni tarihli fotoğraflardan kaçın.
- **Atıf ve lisans** Commons ya da LOC sayfasından bir kez daha kontrol edilir. CC BY-SA'da lisans sürümü tam yazılır (ör. `CC BY-SA 4.0`).
- **Üretim takvimi:** 5–9 Kasım'da bb-001…bb-007, 16 Kasım'da bb-008…bb-014 render edilir.

### 1.3 Paylaşım saatleri

Aşağıdakiler başlangıç varsayımıdır; ölçüldükçe değişir (Bölüm 5).

| Kanal | Saat (TSİ) |
| --- | --- |
| Reels / TikTok / Shorts | 20:30 |
| Instagram hikaye | 08:30 · 13:00 · 21:30 |
| X | 09:00 (ana gönderi) · 18:00 (cevap ya da alıntı) |

Zamanlama platformların kendi araçlarıyla yapılır: Meta Business Suite, TikTok, YouTube Studio ve X (Plan 9.4).

### 1.4 Hemen yapılabilecek bir fırsat: App Store'da öne çıkarma adaylığı

Uygulama kaydı açılır açılmaz App Store Connect → uygulama → **Featuring Nominations** üzerinden Apple editörlerine lansman adaylığı gönderilebilir. Apple bunun haftalar öncesinden yapılmasını öneriyor, yani bu hafta.

Gönderilecek kısa metin şunları anlatır: oyun ne, kimin için, neden farklı (açık lisanslı arşiv fotoğrafları, yapay zekâ görseli yok, reklamsız) ve lansman tarihi (24 Kasım). App Store Connect hesabı gerektiği için bu bir insan kapısıdır.

---

## 2. Lansman öncesi 14 gün (10–23 Kasım)

**Amaç:** Hesapları ısıtmak, formatı denemek ve bekleme listesini büyütmek (maziturkiye.com/#bekleme).

**Her gün:** 1 video (3 kanala), 2–3 hikaye, 1–2 X gönderisi.

**İki CTA:**
- Etkileşim için: "tahminini yorumlara yaz"
- Dönüşüm için: "24 Kasım'da haber almak için link profilde"

Hook'lar ve açıklama kalıpları `social/captions.md` dosyasında. `X-1`, `H1` gibi kısaltmalar o dosyadaki kalıplara karşılık gelir.

### Salı 10 Kasım: Atatürk'ü Anma Günü, paylaşım yok

- Oyunla ilgili hiçbir paylaşım yapılmaz.
- Hesaplar açılır: profil görseli, kapak ve biyografi (`social/profiles.md`) eklenir, 11–13 Kasım gönderileri zamanlanır.
- İsteğe bağlı: 09:05'te logosuz, linksiz, oyun dili taşımayan sade bir anma hikayesi ("Saygı ve özlemle.").

### Çarşamba 11 Kasım: Merhaba

- **Video bb-001:** Kolay bir açılış. Tanıdık bir İstanbul kıyısı ya da köprüsü (1880–1900, Abdülhamid II albümleri).
  - Hook: "Bu fotoğrafın nerede çekildiğini 5 saniyede bulabilir misin?"
- **Hikaye:**
  1. "Merhaba! Biz Mazi Türkiye. Her gün eski bir fotoğraf, tek soru: nerede, hangi yıl?"
  2. Videonun paylaşımı.
  3. Quiz çıkartması "Sence hangi yıl?" (H1).
- **X:** Tanışma gönderisi (X-1), sabitlenir.
- **CTA:** Tahminini yorumlara yaz. 24 Kasım'da App Store'da, link profilde.

### Perşembe 12 Kasım: Ege ve Android testçi çağrısı

- **Video bb-002:** Ege'den bir kıyı kenti (1900–1950).
  - Hook (şehri söylemeden): "Ege'de bir liman. Ama hangisi, ve hangi yıl?"
- **Hikaye:** Android testçi çağrısı (`testers.md`): "Android'in var mı? Google Play'e çıkmak için 14 günlük testte birkaç kişiye daha ihtiyacımız var. DM'den yaz." Altına soru kutusu.
- **X:** Testçi çağrısı (X-3).
- **Not:** Testçilerin **17 Kasım'a kadar** katılması gerekiyor. Android'in 3 Aralık'a yetişmesi buna bağlı.

### Cuma 13 Kasım: Karadeniz ve ilk hikaye karuseli

- **Video bb-003:** Karadeniz'den bir kare.
  - Hook: "Karadenizliysen 3 saniyede bilirsin. Değilsen?"
- **Instagram karuseli #1, "Fotoğrafın hikayesi":** Bonus havuzdan başka bir fotoğrafla 5 kare (captions.md §2). Hikayede sadece kaynakta yazanlar kullanılır.
- **X:** "Fotoğraflar nereden geliyor?" (X-4).

### Cumartesi 14 Kasım: İç Anadolu

- **Video bb-004:** İç Anadolu'dan bir kare.
  - Hook: "Bozkırın ortasında bir şehir. ‹1920'ler› mi, ‹1950'ler› mi?"
- **Hikaye:** Kaydırıcı "Bu fotoğraf ne kadar eski?" (H3) ve testçi hatırlatması.
- **X:** Anket "Hangisini tahmin etmek daha zor: konum mu, yıl mı?" (X-6).

### Pazar 15 Kasım: Aile günü

- **Video bb-005:** 1950–1980 arası, geniş kitleye hitap eden bir şehir hayatı karesi.
  - Hook: "Bunu annene göster. Bence ilk o bilir."
- **Hikaye:** Haftanın cevapları (bb-001…bb-005) ve soru kutusu "Hangi şehrin eski fotoğrafını görmek istersin?" (H5).
- **X:** Aynı soru (X-7). Gelen cevaplar tematik gün ve havuz listesine eklenir.

### Pazartesi 16 Kasım: Üretim günü

- 7 video render edilir (bb-008…bb-014) ve haftanın paylaşımları zamanlanır.
- **Video bb-006:** Akdeniz'den bir kare.
  - Hook: "Akdeniz'de bir kıyı. Haritada 50 km içine iğne bırakabilir misin?"
- **Hikaye:** Kulis, "Fotoğrafları nasıl seçiyoruz?" (H8): lisans, kırpma, bilgi kontrolü. 3 kare.
- **X:** Kurucu notu (X-8). Kurucunun kendi cümleleriyle yazılır.

### Salı 17 Kasım: Doğu Anadolu ve testçilerde son gün

- **Video bb-007:** Doğu Anadolu'dan bir kare.
  - Hook: "Doğu'dan bir kare. Şehri bulan çok olur, ya yılı?"
- **Hikaye:** 12 testçiye ulaşıldıysa teşekkür, ulaşılmadıysa son çağrı. Sayı sadece gerçekse yazılır.
- **X:** "Puanlama nasıl?" (X-9).

### Çarşamba 18 Kasım: Güneydoğu ve hikaye karuseli #2

- **Video bb-008:** Güneydoğu'dan bir kare.
  - Hook: "Taş evler, dar sokaklar. Güneydoğu'da ama tam olarak nerede?"
- **Instagram karuseli #2, "Fotoğrafın hikayesi".**
- **X:** Bil bakalım görseli, cevap 18:00'de alıntıyla verilir (X-2 → X-10).

### Perşembe 19 Kasım: "Nasıl oynanır?" (gerçek ekran kaydı)

- **Video:** 20–25 saniyelik gerçek ekran kaydı.
  - Akış: iğne bırak → yılı kaydır → açılım → puan.
  - TestFlight sürümüyle ve bonus setle çekilir; bugünün fotoğrafları kullanılmaz.
  - Üstte tek satır: "Böyle oynanıyor."
  - Seslendirme yok ya da kurucunun kendi sesi.
- **Hikaye:** Kaydın kısa hali ve link çıkartması (bekleme listesi, `utm_content=ekran-001`).
- **X:** Aynı video (X-11).

### Cuma 20 Kasım: Zor mod

- **Video bb-009:** Az bilinen bir kasaba (1900'ler).
  - Hook: "Bu haftanın en zoru. Bilen çıkarsa yorumuna kalp bırakıyorum."
- **Hikaye:** Meydan okuma özelliğinin tanıtımı: "24 Kasım'dan sonra arkadaşına link gönderip aynı 5 fotoğrafta yarışabileceksin."
- **X:** "Pro neden abonelik değil?" (X-12).

### Cumartesi 21 Kasım: Marmara (İstanbul dışı)

- **Video bb-010:** Bursa, Edirne, Çanakkale ya da İzmit'ten bir kare.
  - Hook: "İstanbul değil. Ama çok yakın."
- **Hikaye:** Anket "1v1'de kime karşı oynamak istersin? Arkadaşım / Rastgele biri" (H4).
- **X:** Aynı anket (X-13).

### Pazar 22 Kasım: 2 gün kaldı

- **Video bb-011:** En çok yorum alan bölgeden yeni bir kare.
  - Hook: "2 gün sonra her sabah 5 tane böyle soru."
- **Hikaye:** Instagram geri sayım çıkartması (H6): "Mazi Türkiye yayında", 24 Kasım 04:00. "Hatırlat"a basanlara bildirim gider.
- **X:** Geri sayım (X-14).

### Pazartesi 23 Kasım: Yarın

- **Üretim:**
  - Lansman haftası videoları (bb-012…bb-016).
  - Lansman ekran kaydı: gerçek uygulama, bonus set, HyperFrames sadece çerçeve ve yazı için.
- **Video bb-012.** Hook: "Yarın sabah 04:00'te ilk gün açılıyor. Isınma turu:"
- **Hikaye:** Geri sayım ve "Yarın ilk sen oyna".
- **X:** "Yarın" (X-15).
- **Akşam kontrolü:**
  - [ ] Lansman e-postası Resend'de 24 Kasım 09:30'a zamanlandı mı?
  - [ ] 5 basın e-postası taslakta mı, maziturkiye.com/basin canlı mı?
  - [ ] Reddit metinleri subreddit kurallarına göre son kez okundu mu? r/KGBTR modlarına mesaj atıldı mı?
  - [ ] App Store'da onaylı sürüm "manuel yayın"da mı? Öneri: 23 Kasım 21:00'de "Yayınla". Mağazada görünmesi birkaç saat sürebilir.
  - [ ] İlk oyun günü 24 Kasım 04:00'te açılıyor. Gece indirenlerin göreceği "ilk gün 04:00'te" durumu test edildi mi?
  - [ ] 24 Kasım'ın 5 fotoğrafı programda mı? Tema önerisi: Öğretmenler Günü için `days.theme`.

---

## 3. Lansman haftası (24–30 Kasım)

**Merkezde WhatsApp meydan okuması var.** Herkes aynı 5 fotoğrafı oynadığı için "beni geçebilir misin?" daveti kendiliğinden doğal.

25 Kasım'dan itibaren dünün fotoğrafları geçmiş gün sayılır ve içerikte kullanılabilir. Böylece içerik havuzu her gün 5 fotoğraf büyür.

### Salı 24 Kasım: Lansman ve Öğretmenler Günü

| Saat | İş | Kaynak |
| --- | --- | --- |
| 04:00 | İlk gün açılır. Öneri: ilk günün teması "Mektepler" olsun, Abdülhamid II albümlerinden okul fotoğrafları. | `../store/in-app-events.md` E1 |
| 07:30 | Turu kendin oyna, skorunu not al. Meydan okuma linkini bu turdan alacaksın. | |
| 08:30 | Hikaye: "Bugün yayında" ve App Store link çıkartması (`ct=instagram-launch-2026`). | captions.md H6 |
| 09:00–10:00 | Basın e-postaları tek tek gönderilir (Webrazzi, Webtekno, ShiftDelete.Net, Log, Teknoblog). İçerik: bülten ve maziturkiye.com/basin. Toplu CC kullanılmaz. | `outreach/press-release.md` |
| 09:30 | Bekleme listesine lansman e-postası (Resend). | `email/waitlist-launch.md` |
| 10:00 | X'te lansman gönderisi (X-16), sabitlenir. Kurucu kendi kişisel hesaplarında (X, LinkedIn, Instagram) "neden yaptım" hikayesini paylaşır. | captions.md |
| 12:00 | WhatsApp: kendi çevrene kişisel meydan okumalar (metin aşağıda). Testçilere: "2 arkadaşına meydan okur musun?" | |
| 13:00 | Hikaye: Öğretmenler Günü. Bonus havuzdan bir okul fotoğrafı ve "Bütün öğretmenlerimizin günü kutlu olsun." Günün oyun fotoğrafları kullanılmaz. | captions.md §5 |
| 18:00 | Reddit r/Turkey (İngilizce). İlk 2 saat başında kal, her yoruma cevap ver. | `outreach/reddit.md` |
| 20:30 | Reels/TikTok/Shorts: lansman videosu. Gerçek ekran kaydı (bonus set) ve "Bugün yayında". | captions.md §1 |
| 22:00 | Telegram uyarıları ve çökme raporları kontrol edilir, yorumlar cevaplanır. | |

**WhatsApp meydan okuma metni** (kişisel gönderilir; toplu yayın listesi ya da tanımadığın gruplar yok):

> Bugün Mazi Türkiye'yi yayınladım 🎉 Her gün 5 eski fotoğraf geliyor, nerede ve hangi yıl çekildiğini tahmin ediyorsun. Bugünkü turda ‹skor› yaptım, beni geçebilir misin? ‹meydan okuma linki›
> (Şimdilik iPhone'da, Android Aralık başında geliyor.)

**Aile grubu için:**

> Aile turnuvası 😄 Hepimiz aynı 5 eski fotoğrafı oynuyoruz, bakalım en yüksek skor kimde. Ben ‹skor› yaptım. ‹meydan okuma linki›

### Çarşamba 25 Kasım: İlk gerçek veri

- **Video: "Dünün en zor fotoğrafı."** 1. günün fotoğrafı artık geçmiş gün sayılır. Video `make-video.mjs` ile üretilir; cevap videonun sonunda.
- **İlk topluluk istatistiği:** Sadece n ≥ 100 ise paylaşılır (captions.md §3). Örnek: "Dünkü 3. fotoğrafı oyuncuların %‹gerçek veri›'i 5 yıl içinde bildi."
- **İş birliği mesajları başlar:** Günde 4 kişi, 5 gün boyunca, toplam 20 mikro hesap (`outreach/influencer-dm.md`). Her mesaj, o kişinin belirli bir gönderisine değinerek yazılır.
- **r/KGBTR:** Modlardan onay geldiyse 20:00'de paylaşılır. Onay yoksa paylaşılmaz.

### Perşembe 26 Kasım

- **r/istanbul gönderisi:** Geçmiş günlerden bir İstanbul fotoğrafı, atıfla birlikte.
- **Basına tek hatırlatma:** Sadece dönüş yapmayanlara ve yeni bir bilgiyle (ör. Android tarihi). İkinci hatırlatma yapılmaz.
- **Video:** Bil bakalım (geçmiş günden).
- **Hikaye:** Dünün cevabı ve quiz.

### Cuma 27 Kasım: Hafta sonu meydan okuması

- **Reels ve hikaye:** "Bu hafta sonu aile turnuvası: linki aile grubuna at, pazar akşamı kim önde?" Gerçek uygulama ekranından meydan okuma akışı gösterilir.
- **X:** Meydan okuma çağrısı (X-17).
- **Ürün tarafı:** İlk 3 günün paylaşım oranına bakılır (`share_tapped / day_completed`). %10'un altındaysa paylaşım ekranındaki tek bir metin değiştirilir (Plan 10.3: tek değişiklik).

### Cumartesi 28 Kasım

- **Fotoğrafın hikayesi:** İlk günün okul fotoğraflarından biri, hikaye kaynağından. 30–45 saniyelik şablon hazır değilse karusel olarak.
- **Video:** Bil bakalım.

### Pazar 29 Kasım

- **Hikaye:** "İlk haftanın en çok şaşırtan fotoğrafı", yani ortalama puanı en düşük fotoğraf (gerçek veri).
- **Akşam:** Aile turnuvası hatırlatması.

### Pazartesi 30 Kasım: İlk haftalık döngü

- **Haftalık şampiyonlar #1** (24–29 Kasım; captions.md §4). Sadece sosyal medyada adının geçmesine ayrıca izin veren oyuncuların takma adı yazılır. İzin yoksa sadece skorlar paylaşılır.
- **Haftalık rapor** (Plan 10) ve içerik satırı (Bölüm 5.5).
- 7 video render edilir. Artık geçmiş günlerden seçim bol.
- **Karar:** Lansman öncesi ölçümlere göre hook ve paylaşım saati ayarı. DECISIONS.md'ye yazılır.

---

## 4. İlk ay: Aralık 2026

### 4.1 Haftalık ritim

| Gün | Reels / TikTok / Shorts | Instagram hikaye | X |
| --- | --- | --- | --- |
| Pazartesi | Haftalık şampiyonlar | Şampiyonlar ve haftanın planı | Haftanın en zor fotoğrafı |
| Salı | Bil bakalım (geçmiş gün) | Quiz ve dünün cevabı | Topluluk istatistiği |
| Çarşamba | Fotoğrafın hikayesi | Soru kutusu | Kaynaktan bilgi notu |
| Perşembe | Bil bakalım | Quiz ve dünün cevabı | Dünün en zor fotoğrafı |
| Cuma | Topluluk istatistiği kartı (8 sn) | Hafta sonu meydan okuma çağrısı | Meydan okuma çağrısı |
| Cumartesi | Bil bakalım (aile, nostalji) | Kaydırıcı | Anket |
| Pazar | Bil bakalım | Haftanın özeti | — |

Bu ritimle Aralık'ta her içerik türü en az 4–5 kez yayınlanır. Bölüm 5'teki karşılaştırma için bu yeterli.

### 4.2 Aralık takvimi

- **1–6 Aralık: Android haftası**
  - **1 Aralık:** Testçiler 17 Kasım'a kadar katıldıysa 14 günlük kapalı test doluyor. Play Console'dan üretim erişimi başvurusu yapılır (cevap taslakları `testers.md`'de).
  - **~3 Aralık:** Google Play'de yayın. Aynı gün:
    - "Android geldi" e-postası (`email/waitlist-launch.md` §2).
    - Reels, X (X-20) ve hikayede "Android'de de".
    - Reddit'te kendi lansman gönderine yorum. Yeni gönderi açılmaz.
    - Haber yapan muhabirlere tek satırlık teşekkür ve Play linki.
  - Video CTA'sı varsayılana döner ("App Store ve Google Play").
  - Android e-postasından sonra bekleme listesi silinir. Söz "sadece lansman duyurusu" idi.
- **7–13 Aralık:**
  - Format karşılaştırması 4.1'deki ritimle başlar.
  - İş birliği yapan hesapların paylaşımları, izin alınarak hikayede yeniden paylaşılır.
  - App Store ürün sayfası testi (Product Page Optimization) başlar: ilk ekran görüntüsü, en az 7 gün (Plan 8.5).
- **10 Aralık:** Yeni Yıl etkinliği App Store Connect'e ve Play Console'a gönderilir (`../store/in-app-events.md` E2).
- **14–20 Aralık:**
  - 17 Aralık'ta etkinlik kartı mağazada görünmeye başlar.
  - Kış ve kar temalı bonus fotoğraflarla bil bakalım serisi yayınlanır.
  - İlk ayın ara değerlendirmesi yapılır (5.4).
- **21–27 Aralık:** "2026'nın en zor fotoğrafları" serisi. Geçmiş günlerden, gerçek ortalama puanlarla.
- **31 Aralık – 3 Ocak:** "Yeni Yıl: Kar Altında Türkiye" tematik günleri (captions.md §5).
  - Yılbaşı gecesi hatırlatma bildirimi gönderilmez; 1 Ocak sabahı normal saatinde gider.
- **4 Ocak 2027 (Pazartesi):** İlk ayın kararı alınır: kazanan içerik türü (5.4). DECISIONS.md'ye yazılır.

### 4.3 Yapılmayacaklar

- **Ücretli reklam yok.** Apple Search Ads testi ancak organik dönüşüm verisi geldikten ve bütçe onaylandıktan sonra yapılır (insan kapısı).
- **Sahte etkileşim yok:**
  - Ekşi Sözlük'te başlık açmak ya da kendi entry'sini yazmak.
  - Takipçi, beğeni ya da yorum satın almak.
  - İkinci hesapla yorum yapmak.
  - Toplu WhatsApp mesajı göndermek.
- **Gündeme yaslanma yok.** Siyasi ya da trajik gündem içeriğe bağlanmaz, trend hashtag'leri kullanılmaz.

---

## 5. Ölçüm: hangi içerik indirme getiriyor?

### 5.1 UTM kuralları

**Biçim:** `?utm_source=<kanal>&utm_medium=<yer>&utm_campaign=<kampanya>&utm_content=<içerik>`

Hepsi küçük harf ve ASCII yazılır; Türkçe karakter ve boşluk kullanılmaz, ayırıcı olarak tire kullanılır. Profil linkleri `social/profiles.md`'deki kalıpla aynıdır.

| Parametre | Değerler |
| --- | --- |
| `utm_source` | `instagram`, `tiktok`, `youtube`, `x`, `reddit`, `whatsapp`, `email`, `press-webrazzi`, `press-webtekno`, `press-shiftdelete`, `press-log`, `press-teknoblog`, `creator-<kisaad>` |
| `utm_medium` | `profile` (biyografi linki), `story` (link çıkartması), `post` (gönderi ya da açıklama), `comment`, `email`, `press`, `dm` |
| `utm_campaign` | `prelaunch-2026` (10–23 Kas), `launch-2026` (24–30 Kas), `android-2026` (1–6 Ara), `always-on`, `yeniyil-2027` ve diğer etkinlik adları |
| `utm_content` | İçerik kimliği: `bb-001` (bil bakalım), `hk-001` (hikaye), `st-001` (istatistik), `sm-001` (şampiyonlar), `tg-001` (tematik gün), `ekran-001` (ekran kaydı), `email-btn1` |

**Örnekler:**

- Instagram biyografi: `https://maziturkiye.com/?utm_source=instagram&utm_medium=profile&utm_campaign=prelaunch-2026`
- Hikaye link çıkartması: `https://maziturkiye.com/?utm_source=instagram&utm_medium=story&utm_campaign=prelaunch-2026&utm_content=bb-004`
- X lansman gönderisi: `https://maziturkiye.com/?utm_source=x&utm_medium=post&utm_campaign=launch-2026&utm_content=x-16`

**Mağaza linkleri:**

- **App Store kampanya linki:** `https://apps.apple.com/tr/app/id‹APP_ID›?pt=‹PROVIDER_TOKEN›&ct=<kaynak>-<kampanya>&mt=8`
  - `ct` en fazla 40 karakter olabilir (ör. `ct=email-launch-2026`).
  - `pt` değeri App Store Connect'in kampanya linki oluşturucusundan alınır.
  - Sonuçlar: App Store Connect → Analytics → Acquisition → Campaigns.
- **Google Play:** `https://play.google.com/store/apps/details?id=com.maziturkiye.app&referrer=utm_source%3Dx%26utm_medium%3Dpost%26utm_campaign%3Dandroid-2026`
  - Sonuçlar: Play Console → kullanıcı edinme raporları.
- **Apple özel ürün sayfaları** (Custom Product Pages, Plan 10.2). Lansmandan sonra iki tane açılır:
  - `sosyal`: ilk ekranda bil bakalım
  - `meydan-okuma`: ilk ekranda WhatsApp düellosu
  - Linke `ppid=` parametresi eklenir.

**Ölçümdeki teknik açık (ajan yapabilir, onay gerekmez).** Landing sayfası şu an ziyaretleri ölçmüyor ve UTM'yi ne mağaza linkine ne de bekleme listesine aktarıyor. Önerilen üç küçük iş:

1. `waitlist` tablosuna `source text` sütunu eklenir; `join_waitlist` sayfanın ilk UTM'sini saklar. Lansman öncesinde tek dönüşüm bekleme listesi olduğu için en değerli ölçüm budur.
2. `MAZI.storeLink()` sayfa URL'sindeki `utm_source` ve `utm_campaign` değerlerini App Store'da `ct`, Google Play'de `referrer` parametresine çevirir.
3. Sayfa ziyaretleri çerezsiz bir sayaçla ölçülür (Vercel Web Analytics ya da PostHog çerezsiz mod). Hangisi seçilirse gizlilik metnine eklenir; bu metin insan onayı ister.

### 5.2 Her gönderi için tutulan sayılar

Gönderiden 72 saat sonra platform analitiğinden alınır ve haftalık tabloya yazılır (Google Sheets ya da `marketing/metrics.csv`):

- görüntülenme
- ortalama izlenme süresi ve tamamlanma oranı
- yorum, paylaşım (gönderme), kaydetme
- profil ziyareti, link tıklaması (platform veriyorsa), yeni takip

Hepsi **1.000 görüntülenme başına** çevrilir. Böylece tek bir viral video tabloyu bozmaz.

### 5.3 İndirmeye bağlama

Organik sosyal medyadan gelen indirmeleri kesin ölçmek zordur. Bu yüzden üç kaynak birlikte okunur:

1. UTM'li landing ziyaretleri ve bekleme listesi kayıtları (5.1'deki teknik işler yapıldıysa).
2. App Store `ct` ve Play `referrer` kampanya indirmeleri.
3. **Zaman eşleşmesi:** Bir video yayınlandıktan sonraki 24 saatteki saatlik indirme artışı, önceki haftanın aynı saatleriyle karşılaştırılır (App Store Connect ve Play Console).

İsteğe bağlı dördüncü kaynak: Onboarding'e atlanabilir tek bir soru eklenir: "Bizi nereden duydun?" Seçenekler: Instagram / TikTok / YouTube / X / Arkadaşım / Mağaza araması / Diğer. Cevap `onboarding_completed` olayına özellik olarak yazılır; kişisel veri içermez.

### 5.4 Kazanan içerik türüne nasıl karar verilir?

- **Karşılaştırılan türler:** bil bakalım, fotoğrafın hikayesi, topluluk istatistiği, haftalık şampiyonlar, tematik gün, ekran kaydı.
- **Asgari örnek:** Her türden en az 5 gönderi ve 3 haftalık veri. Ortalama yerine **medyan** kullanılır.
- **Birincil ölçü (indirme niyeti):** 1.000 görüntülenme başına profil ziyareti ve link tıklaması. Lansmandan sonra mümkünse 1.000 görüntülenme başına kampanya indirmesi.
- **İkincil ölçü (yayılma):** 1.000 görüntülenme başına paylaşım ve kaydetme. Birincil ölçüde türler arası fark %20'den azsa kararı bu ölçü verir.
- **Üçüncül ölçü (algoritma):** Yorum oranı ve tamamlanma oranı. Bu ölçü sadece hook ve video süresi ayarında kullanılır.
- **Hook testi:** Aynı videoyu iki farklı ilk satırla denemek için Instagram'ın deneme Reels özelliği (Trial Reels, önce takipçi olmayanlara gösterilir) kullanılabilir.
- **Slot dağılımı:** Kazanan tür haftalık slotların %50'sini alır, ikinci tür %30'unu. Kalan %20 denemelere ayrılır (yeni hook, yeni tür, iş birliği).
- **Karar günleri:**
  - 23 Kasım: sadece hook ve paylaşım saati.
  - 4 Ocak 2027: ilk ayın kazanan türü.
  - Sonrasında her ayın ilk pazartesi.
  - Her karar DECISIONS.md'ye "tarih · karar · gerekçe" biçiminde yazılır.
- **Zayıf kanal kuralı:** Bir kanalın birincil ölçüsü 3 hafta boyunca diğer kanalların yarısının altında kalırsa o kanala özel üretim durur, sadece yeniden paylaşım yapılır.

### 5.5 Haftalık rapora eklenecek içerik satırı

Plan 10'daki Telegram raporunun sonuna tek satır eklenir:

`İçerik · En iyi gönderi: ‹id› (‹tür›, ‹birincil ölçü›) · Sosyal kaynaklı kayıt/indirme: ‹gerçek veri› · Bu haftaki tek değişiklik: ‹karar›`
