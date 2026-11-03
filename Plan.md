# Türkiye Zaman-Konum Tahmin Oyunu — Uçtan Uca Proje Planı

Nov 4, 2026 · @Yigit

## 0. Yürütücü yapay zekâ için talimatlar

Bu planı uygulayan yapay zekâ projenin tek yöneticisidir: bu belgede açık bırakılan her kararı kendisi verir, kullanıcıya soru sormaz. Bölüm 1'deki kesinleşmiş kararlar değiştirilemez; geri kalan her şey yöneticinin takdirindedir.

**Çalışma kuralları**

1. Her karar `DECISIONS.md` dosyasına tek satırla yazılır: tarih, karar, gerekçe. Sonraki ajan aynı soruyu tekrar açmaz.
2. Her oturumun sonunda `STATUS.md` güncellenir: biten işler, yarım işler, sıradaki 5 adım, engeller. Bu proje tek oturumda bitmez; sonraki ajan buradan devam eder.
3. Kod, içerik ve belgeler tek bir private GitHub reposunda tutulur. Şifre, API anahtarı ve token asla repoya yazılmaz; `.env` ve ilgili servisin gizli değişken kasası kullanılır.
4. Mükemmel değil, yayına çıkabilir olan hedeflenir. Takılan bir adımda 30 dakikadan fazla harcanmaz; alternatif yol seçilir ve karar kaydına yazılır.
5. Rakip app'lerden (özellikle TimeGuessr) isim, logo, ekran düzeni, metin veya görsel kopyalanmaz. Sadece işlev ve tür ortaktır.

**Chrome erişimiyle ilgili sınırlar**

- Kullanıcı adına para ödemesi, abonelik başlatması veya fatura bilgisi girmesi yapılmaz.
- Kimlik doğrulama, telefon onayı, vergi formu, banka bilgisi ve sözleşme onayı gibi adımlar kullanıcıya bırakılır (aşağıdaki insan kapıları).
- Hesap silme, app silme veya yayından kaldırma gibi geri alınamaz işlemler yapılmaz.
- Sosyal medyada sahte kullanıcı hesabı açılmaz, sahte yorum ve puan üretilmez, takipçi satın alınmaz.

**İnsan kapıları:** Ajan bu adımlara geldiğinde işi hazırlar, `HUMAN_TODO.md` dosyasına net bir talimat yazar ve diğer işlere devam eder. Bekleyerek zaman kaybetmez.

| Kapı | Neden insan gerekiyor | Ajanın hazırlayacağı |
| --- | --- | --- |
| Apple Developer hesabı ve Paid Apps sözleşmesi | Kimlik, ödeme, vergi (W-8BEN), banka | Adım adım talimat, doldurulacak alanların listesi |
| Google Play hesabı (yoksa) | Kimlik ve 25 $ ödeme | Hesap türü önerisi (bireysel veya şirket) |
| 12 kapalı testçi bulmak | Gerçek kişiler gerekiyor | Davet metni, test linki, testçilere talimat |
| Sosyal medya hesaplarının açılması | Telefon ve e-posta doğrulaması | Kullanıcı adları, profil fotoğrafı, biyografi metinleri |
| Telegram bot token'ı | @BotFather kullanıcının hesabından | Bot adı ve açıklaması |
| Yasal metinlerin son onayı | Kullanıcının sorumluluğunda | Hazır metinler |

## 1. Ürün özeti ve kesinleşmiş kararlar

Türkiye'ye özel bir günlük tahmin oyunu: oyuncu Türkiye'de çekilmiş bir fotoğraf görür, Türkiye haritasına iğne bırakır ve fotoğrafın hangi yıl çekildiğini tahmin eder. Global örnek TimeGuessr'dır; bizim farkımız yalnızca Türkiye fotoğrafları, Türkçe deneyim ve çok daha iyi bir tasarımdır.

**Hedef kitle:** Türkiye'de yaşayan, nostaljiyi, tarihi ve Wordle tarzı günlük oyunları seven 16–55 yaş arası akıllı telefon kullanıcıları. Yurt dışındaki Türkler ikincil kitledir.

**Değiştirilemez kararlar**

| Konu | Karar |
| --- | --- |
| Kapsam | Tüm fotoğraflar Türkiye sınırları içinde çekilmiş olacak. Oyuncu konumu Türkiye haritası üzerinde seçer. |
| Günlük oyun | Her gün 5 fotoğraf. Her gün saat 04:00'te (Türkiye saati, UTC+3) yenilenir. |
| Hatırlatıcı | O günü çözmemiş kullanıcıya 09:00–24:00 arasında, kullanıcının alışık olduğu oynama saatine göre bir bildirim gider. Çözmüşse gitmez. |
| Fotoğraf havuzu | Lansman için 200 fotoğraf yeterli. Havuz sonra büyütülür. |
| 1v1 | Canlı 1v1 eşleşme var. Rakip bulunamazsa bot rakip atanır. |
| Bot kuralı | Kullanım koşullarında "Rakip bulunamazsa yapay zekâ rakip atanabilir" maddesi yer alır. Hiçbir yerde "binlerce aktif oyuncu" gibi sahte sayı kullanılmaz. |
| Admin bildirimi | Eşleşme 1 dakikayı geçerse kullanıcıya (admin) Telegram bildirimi gider, o da isterse girip oynar. 2. dakikada hâlâ kimse yoksa bot katılır. Ekranda "Tahmini bekleme: 1–2 dk" yazar. |
| Arkadaşa meydan okuma | Kullanıcı WhatsApp üzerinden link gönderir; arkadaşı aynı 5 fotoğrafı oynar ve skorlar karşılaştırılır. |
| Gelir | Lansmanda reklam yok. Tek seferlik Pro: 6 $. Pro ipuçlarını açar. |
| Telif | Sadece ticari kullanıma izin veren lisanslı veya telif süresi dolmuş fotoğraflar kullanılır (Bölüm 3). |

**Başarı ölçüsü (ilk 90 gün):** Uygulama iki mağazada yayında, günlük aktif kullanıcıların %40'ı günün 5 fotoğrafını bitiriyor, ilk 7 günde geri dönme oranı %20'nin üzerinde ve ilk Pro satışları gelmiş.

## 2. Oyun tasarımı

Oyunun çekirdeği günlük 5 fotoğraflık turdur. 1v1, meydan okuma linki ve Pro, bu çekirdeğin çevresine kurulur. Aşağıdaki sayılar başlangıç değerleridir; yönetici ajan test sonuçlarına göre değiştirebilir.

### 2.1 Bir fotoğrafın akışı

1. Fotoğraf tam ekran açılır; yakınlaştırılabilir.
2. Oyuncu Türkiye haritasına iğne bırakır ve yıl kaydırıcısıyla yılı seçer (aralık: havuzdaki en eski fotoğrafın yılından bu yıla).
3. "Tahmin et" sonrası doğru konum ve yıl, mesafe (km) ve yıl farkıyla gösterilir. Fotoğrafın kısa hikayesi ve kaynağı (lisans atfı dahil) burada görünür.
4. Fotoğrafı tahmin sonrası tekrar açabilme özelliği olur (TimeGuessr kullanıcılarının şikayet ettiği bir eksik).

### 2.2 Puanlama

Fotoğraf başına en çok 1.000 puan: 500 konum + 500 yıl. Günlük en yüksek skor 5.000.

```latex
\text{konum} = 500 \cdot e^{-d/150}, \quad \text{yıl} = 500 \cdot e^{-|\Delta y|/10}
```

Burada d kilometre cinsinden mesafe, Δy yıl farkıdır. 50 km sapma yaklaşık 358 konum puanı, 5 yıl sapma yaklaşık 303 yıl puanı verir. Tam isabet bonusu: 1 km altı veya yılı tam bilmek, o bölümü 500'e tamamlar.

### 2.3 Günlük oyun, seri ve paylaşım

- Yeni gün 04:00'te başlar; günün 5 fotoğrafı herkese aynıdır.
- **Seri (streak):** Art arda oynanan gün sayısı ana ekranda büyük gösterilir.
- **Paylaşım metni:** Wordle tarzı, fotoğrafı ele vermeyen bir özet. Örnek: `#42 · 3.870/5.000` ardından konum ve yıl için birer sıra renkli kare. WhatsApp, X ve Instagram hikayesi için tek dokunuşla paylaşılır.
- **Günlük sıralama:** Türkiye geneli ve arkadaşlar arası.

### 2.4 Arkadaşa meydan okuma linki

- Oyuncu bitirdiği günün turu için WhatsApp'tan link gönderir. Link, aynı 5 fotoğrafı ve göndericinin skorunu taşır.
- App yüklüyse link doğrudan meydan okumayı açar; değilse mağaza sayfasına yönlendirir ve kurulumdan sonra meydan okuma kaybolmaz (ertelenmiş derin link).
- Sürüm 1.1 hedefi: Linki açan kişi app'i yüklemeden web'de oynayabilsin. Bu, viral yayılmayı ciddi ölçüde artırır.

### 2.5 Canlı 1v1

- Maç 5 fotoğraf; iki oyuncu aynı fotoğrafı aynı anda görür, fotoğraf başına 45 saniye süre vardır. Toplam skoru yüksek olan kazanır.
- 1v1 fotoğrafları günlük oyunun havuzundan ayrı bir havuzdan gelir ve bir oyuncuya aynı fotoğraf tekrar gelmez (havuz bitince en eski görülenler döner).
- Basit bir derece puanı (Elo) tutulur; eşleşme yakın dereceliler arasında yapılır.
- **Eşleşme zaman çizelgesi:** 0. saniye arama başlar, ekranda "Tahmini bekleme: 1–2 dk" yazar → 60. saniyede admin'e Telegram bildirimi gider ("Rakip bekliyor, girmek için dokun") → 120. saniyede gerçek oyuncu veya admin yoksa bot katılır.
- **Admin modu:** Admin hesabı normal oyuncu gibi görünür. Telegram'daki linke dokununca app bekleyen maça doğrudan bağlanır.
- **Bot davranışı:** Botun beceri seviyesi rakibin ortalama skoruna yakın ayarlanır. Tahminleri doğru cevaba rastgele bir sapma eklenerek üretilir (yılda yaklaşık ±12, konumda yaklaşık 200 km). Her fotoğrafta 8–35 saniye arası rastgele bir sürede tahmin yapar. Bot, sabit bir Türkçe takma ad listesinden isim alır.

### 2.6 Pro (tek seferlik, 6 $)

| Özellik | Ücretsiz | Pro |
| --- | --- | --- |
| Günlük 5 fotoğraf | Var | Var |
| İpuçları: dönem ("1960'lar") ve bölge ("Ege") | Yok | Var; ipucu kullanılan bölümün en yüksek puanı %30 düşer ve sıralamada işaretlenir |
| 1v1 maç | Günde 3 | Sınırsız |
| Geçmiş günlerin arşivi | Yok | Var |
| Detaylı istatistik (on yıl ve bölge bazlı isabet) | Temel | Tam |
| Seri koruyucu (ayın 1 günü kaçırılırsa seri bozulmaz) | Yok | Var |

Ücretsiz kullanıcıya Pro, sadece doğal anlarda önerilir: günlük 3. 1v1 maçtan sonra, arşive dokunulunca, ipucu düğmesine basılınca. Günlük oyunun ortasında ödeme ekranı çıkmaz.

### 2.7 Bildirimler

- **Günlük hatırlatıcı:** Cihazın kendisinde planlanan yerel bildirim. Saat = kullanıcının son 7 gündeki oyun başlangıç saatlerinin ortancası, 09:00–24:00 arasına sıkıştırılır; geçmiş yoksa 20:00. Günün turu bitince o günün bildirimi iptal edilir.
- **Sunucu bildirimleri:** Meydan okuma geldi, arkadaşın skorunu geçti, seri tehlikede (23:00).
- Bildirim izni ilk turun sonunda istenir, uygulama açılır açılmaz istenmez.

### 2.8 Hesap

- Günlük oyun hesap açmadan oynanır (anonim oturum).
- 1v1, sıralamada isim ve cihazlar arası senkron için Apple ile giriş ve Google ile giriş sunulur. Apple, Google girişi sunan app'lerde Apple ile girişi de zorunlu tutar.
- Uygulama içinden hesap silme zorunludur (Apple kuralı).

## 3. Fotoğraf veritabanı

Lansman için 200 onaylı fotoğraf gerekir: 100'ü günlük oyuna, 100'ü 1v1'e ayrılır. Günlük oyun haftada 35 fotoğraf tükrettiği için 100 fotoğraf yaklaşık 3 hafta yeter. Bu yüzden haftalık toplama hattı, lansmandan önce otomatik çalışır durumda olmalı ve haftada en az 50 yeni fotoğraf eklemelidir.

### 3.1 Kaynaklar ve lisans kuralı

Uygulama ticari bir üründür. Sadece ticari kullanıma ve yeniden boyutlandırmaya izin veren fotoğraflar alınır. "Ticari olmayan" (NC) veya "türetilemez" (ND) lisanslı hiçbir fotoğraf kullanılmaz.

| Kaynak | Ne verir | Kural |
| --- | --- | --- |
| [Wikimedia Commons](https://commons.wikimedia.org) | En geniş havuz; Türkiye'nin her dönemi | Sadece kamu malı, CC0, CC BY, CC BY-SA. Lisans her dosyanın sayfasından okunur. API isteklerinde proje adını taşıyan bir User-Agent kullanılır. |
| [Kongre Kütüphanesi, Abdülhamid II koleksiyonu](https://www.loc.gov/pictures/collection/ahii/about.html) | 1880–1893 Osmanlı fotoğrafları | Kütüphane hak vermez ve reddetmez; fotoğrafların yaşı gereği telif süresi dolmuştur. Her kaydın "Rights" alanı kontrol edilir. Bu dönemden en fazla 15 fotoğraf alınır (hepsi aynı 13 yıl). |
| [Europeana](https://www.europeana.eu) | Avrupa arşivlerindeki Türkiye fotoğrafları | Sadece "açık yeniden kullanım" filtresiyle aranan kayıtlar. |
| Flickr (Creative Commons) | 2000 sonrası çok bol, coğrafi etiketli | Sadece CC BY, CC BY-SA, CC0, Kamu Malı İşareti ve "bilinen telif kısıtlaması yok" (Flickr Commons). API anahtarı için Flickr hesabı gerekir; yoksa bu kaynak atlanır. |
| [SALT Araştırma](https://archives.saltresearch.org) | Türkiye'nin en zengin arşivlerinden biri | Lisansı CC BY-NC-ND, yani **izinsiz kullanılamaz**. Ajan bir iş birliği veya izin talebi e-postası taslaklar; izin gelene kadar dokunulmaz. |
| [TimeGuessr](https://timeguessr.com) ve benzerleri | — | Rakip oyunların fotoğrafları ve açıklamaları kesinlikle kullanılmaz. |

Her fotoğrafın altında ve "Kaynaklar" ekranında atfı gösterilir: eser sahibi, kaynak, lisans adı ve lisans linki. CC BY ve CC BY-SA bunu zorunlu kılar.

### 3.2 Seçim kriterleri

- **Yıl:** Kesin yıl veya en fazla ±1 yıl belirsizlik. "Yaklaşık" veya on yıllık aralıkla tarihlenmiş fotoğraflar alınmaz.
- **Konum:** En fazla 5 km hassasiyetle belirlenebilir olmalı. Coğrafi etiket yoksa, başlıktaki bilinen bir yerden (örneğin Galata Köprüsü) koordinat çıkarılır.
- **Kalite:** Uzun kenarı en az 1.200 piksel; bulanık, çok karanlık veya ilgisiz fotoğraflar elenir.
- **İçerik:** Şiddet, ölüm, terör, darbe ve siyasi gerilim içeren fotoğraflar alınmaz. Ana konusu tanınabilir bir özel kişi olan portreler alınmaz; kalabalık ve sokak fotoğrafları serbesttir.
- **Zorluk karışımı:** Havuzun yaklaşık %30'u kolay, %50'si orta, %20'si zor. Tabela ve yazılar ipucu olarak kalabilir, ama cevabı doğrudan yazan fotoğraflar (örneğin "İzmir 1985" yazan pankart) alınmaz.

**Lansman havuzunun dağılım hedefi (200 fotoğraf)**

| Dönem | Adet |
| --- | --- |
| 1880–1919 | 25 |
| 1920–1949 | 30 |
| 1950–1979 | 40 |
| 1980–1999 | 40 |
| 2000–2026 | 65 |

Bölge kuralı: 7 coğrafi bölgenin her birinden en az 10 fotoğraf. İstanbul toplamın %30'unu geçmez. 1950–1990 arası telifsiz fotoğrafı bulması en zor dönemdir; hedef tutmazsa açık 2000 sonrasına kaydırılır ve karar kaydına yazılır.

### 3.3 Toplama hattı

1. **Aday toplama:** Kaynaklardan en az 3 kat aday (lansman için 600+) lisans ve meta verisiyle birlikte çekilir.
2. **Otomatik eleme:** Lisans, çözünürlük, tarih ve konum alanları kurala uymayanlar atılır.
3. **Görsel denetim:** Görüntüyü okuyabilen bir model kaliteyi, uygunsuz içeriği, "Türkiye'de mi?" sorusunu ve cevabı ele veren yazıları puanlar.
4. **Tekrar eleme:** Algısal hash ile aynı veya çok benzer fotoğraflar elenir.
5. **Meta veri doğrulama:** Yıl ve konum, kaynak sayfasındaki başlık ve açıklamayla çapraz kontrol edilir; tutarsızsa elenir.
6. **Zorluk tahmini ve hikaye:** Her fotoğrafa zorluk etiketi ve kaynak sayfasındaki bilgiye dayanan 2–3 cümlelik Türkçe hikaye yazılır. Kaynakta olmayan bilgi uydurulmaz.
7. **İşleme ve kayıt:** Görsel 1.600 piksele küçültülüp WebP'ye çevrilir, Supabase Storage'a yüklenir ve tabloya yazılır.
8. **Planlama:** Günlük havuzdan 14 gün ileriye program yapılır. Her günün 5 fotoğrafı farklı bölge ve dönemlerden gelir; en az biri kolay, en az biri zordur.

### 3.4 Tablo şeması (photos)

| Alan | Açıklama |
| --- | --- |
| id | Benzersiz kimlik |
| image\_path | Storage'daki WebP dosyası |
| year, year\_uncertainty | Yıl ve ± belirsizlik (0 veya 1) |
| lat, lng, location\_name, region | Koordinat, yer adı, 7 bölgeden biri |
| difficulty | kolay / orta / zor |
| story\_tr | 2–3 cümlelik hikaye |
| source\_name, source\_url, author | Kaynak ve eser sahibi |
| license\_code, license\_url | Örneğin CC BY-SA 4.0 |
| pool | daily veya duel |
| scheduled\_date | Günlük havuzdaysa gösterileceği gün |
| status | aday / onaylı / yayında / emekli |
| phash | Tekrar kontrolü için algısal hash |

## 4. Teknik mimari

Tek kod tabanından iOS ve Android: Expo (React Native, TypeScript) ön yüzde, Supabase arka yüzde. Bu seçim, kodlama ajanlarının en iyi bildiği yığın olduğu ve Expo'nun bulut build ile Mac gerektirmediği için yapıldı.

| Katman | Seçim | Not |
| --- | --- | --- |
| Uygulama | Expo SDK (güncel sürüm), Expo Router, TypeScript | Build, mağazaya gönderim ve OTA güncelleme EAS ile. |
| Harita | MapLibre React Native + [OpenFreeMap](https://openfreemap.org) | OpenFreeMap ücretsiz ve anahtar istemez, ama garanti vermez. Yedek: Türkiye'yi kapsayan bir PMTiles dosyasını kendi depolamamızdan sunmak. Oyun haritası sade olmalı: il sınırları ve büyük şehir adları, küçük yer adları gizli. |
| Veritabanı ve giriş | Supabase: Postgres, Auth (anonim + Apple + Google), Storage | Supabase Pro kredisi kullanıcıda mevcut. |
| Sunucu mantığı | Supabase Edge Functions + pg\_cron | Gün dönüşü pg\_cron ile her gün 01:00 UTC'de (04:00 Türkiye). Puanlama sunucuda hesaplanır; istemci doğru cevabı tahminden önce asla almaz. |
| 1v1 | Supabase Realtime | Eşleşme kuyruğu tablosu, maç başına bir kanal, sayacı sunucu tutar. Bot tahminleri sunucuda üretilir ve zamanı gelince yayınlanır. |
| Satın alma | RevenueCat | Tek seferlik, tüketilmeyen ürün: `pro_lifetime`. Satın alma geri yükleme düğmesi zorunlu. |
| Bildirim | expo-notifications (yerel) + Expo Push Service (sunucu) |  |
| Analitik | PostHog | Kullanıcıda Scale planı mevcut. Olay listesi Bölüm 10'da. |
| Admin bildirimi | Telegram Bot API | Edge function, 60. saniyede admin'e linkli mesaj gönderir. Telegram butonları sadece https link kabul ettiği için evrensel link kullanılır. |
| Linkler | Expo Router derin linkleri + evrensel link (iOS) / App Links (Android) | Bunun için bir web alan adı gerekir. Alan adı alınana kadar ücretsiz bir alt alan adı (örneğin Vercel) kullanılır. |
| Web sayfaları | Landing, gizlilik, koşullar, destek, meydan okuma sayfası | Framer (kullanıcıda Pro var) veya Vercel'de statik site; ajan seçer. |
| Pazarlama videosu | [HyperFrames](https://github.com/heygen-com/hyperframes) | HTML'den MP4 üretir; Bölüm 9. |

**Ertelenmiş derin link:** App yüklü değilken açılan meydan okuma linki ilk açılışta kaybolmamalıdır. En basit çözüm: Web sayfası 6 haneli bir meydan okuma kodu gösterir, app ilk açılışta "Meydan okuma kodun var mı?" diye sorar. Ajan daha iyi bir yol bulursa onu seçer.

**Repo düzeni**

```
/app            Expo uygulaması
/supabase       migrations, edge functions, seed
/pipeline       fotoğraf toplama ve doğrulama scriptleri
/web            landing, yasal sayfalar, meydan okuma sayfası
/marketing      HyperFrames projeleri, görseller, içerik takvimi
/store          mağaza metinleri, ekran görüntüleri, ASO notları
STATUS.md  DECISIONS.md  HUMAN_TODO.md
```

**Kurulacak skill'ler:** [appllama-app-design-skill](https://github.com/Appllama/appllama-skills) (yerel his ve tasarım kalitesi), [replica-skill](https://github.com/Jakeschincariol/replica-skill) içinden `replica-entrepreneur` ve `replica-launch` (rakip yorum analizi, mağaza metni), [Supabase agent skills](https://supabase.com/docs/guides/getting-started/ai-skills.md), HyperFrames skill'leri, [instagram-agent-skill](https://github.com/Jakeschincariol/instagram-agent-skill) (Reels ve caption). Referans: [Open Paywall Gallery](https://github.com/paywallpro/paywall-gallery) (Pro ekranı tasarımı için; lisansı sadece referans kullanımına izin verir).

## 5. Tasarım ve marka

Tasarım hedefi: "yapay zekâ yapmış" gibi görünmeyen, mağazada ekran görüntüsüyle fark edilen bir oyun. TimeGuessr'ın zayıf arayüzü bizim ana fırsatımız; tasarım kalitesi bir özellik olarak ele alınır.

### 5.1 İsim

Yönetici ajan ismi kendisi seçer. Kriterler:

- Türkçe, kısa (en fazla 14 karakter), söylemesi ve yazması kolay.
- App Store ve Google Play'de aynı isimde app yok; Türkiye'de tescilli bir marka ile çakışmıyor (TürkPatent marka araması yapılır).
- Instagram, TikTok ve X'te kullanıcı adı ve bir alan adı alınabilir durumda.
- "TimeGuessr" veya "GeoGuessr" kelimelerini içermez.

Başlangıç adayları: "Neredeydi", "Kaç Yılıydı", "Zaman Pusulası", "Anı Avı". Mağaza başlığı isim + anahtar kelime şeklinde kurulur (Bölüm 8).

### 5.2 Görsel yön

- **Duygu:** Eski bir fotoğraf arşivini karıştırmanın sıcaklığı, modern bir oyunun hızıyla. Kağıt tonları, hafif film dokusu, bir vurgu rengi. Karanlık mod da tasarlanır.
- **Tipografi:** Türkçe karakterleri (ğ, ş, ı, İ) düzgün gösteren, lisansı ticari kullanıma açık bir font (Google Fonts). Sayılar Türk biçiminde: 5.000.
- **En önemli an:** Tahmin sonrası açılım. Haritada tahminden doğru konuma çizilen çizgi, yıl sayacının doğru yıla akması, puanın sayılarak artması ve dokunsal geri bildirim. Bu an oyunun bağımlılık yaratıcı kısmıdır; en çok özen buraya harcanır.
- **Referans çalışması:** Mobbin'de NYT Games, Duolingo (seri), GeoGuessr ve popüler trivia app'lerinin akışları incelenir. Rakiplerden sadece kalıp öğrenilir, ekran kopyalanmaz.
- **Kurallar:** appllama tasarım skill'inin kurallarına uyulur (yerel kontroller, anlamlı animasyon, simülatörde doğrulama). Dokunma alanları en az 44 pt, kontrast WCAG AA.
- **İkon:** Nano Banana veya Higgsfield ile taslaklar üretilir, en iyisi vektöre temizlenir. 1024 piksel, şeffaflık yok, küçük boyutta okunur olmalı.

### 5.3 Ekran listesi

| Ekran | İçerik |
| --- | --- |
| Karşılama | En fazla 3 adım; oyunu anlatmak yerine ilk fotoğrafı oynatarak öğretir. |
| Ana ekran | Bugünün kartı, seri, 1v1 düğmesi, arkadaşa meydan oku, yeni güne geri sayım. |
| Oyun | Fotoğraf, harita, yıl kaydırıcısı, ipucu düğmesi (Pro). |
| Açılım | Doğru cevap, mesafe, yıl farkı, puan, fotoğrafın hikayesi ve atfı. |
| Gün özeti | Toplam skor, sıralamadaki yer, paylaş, meydan oku. |
| 1v1 eşleşme ve maç | Bekleme ekranı ("Tahmini bekleme: 1–2 dk"), maç, sonuç, derece değişimi. |
| Sıralama | Bugün, hafta, arkadaşlar. |
| Arşiv | Geçmiş günler takvimi (Pro). |
| İstatistik | Ortalama skor, on yıl ve bölge bazlı isabet. |
| Pro | Tek seferlik 6 $, özellik listesi, satın alma ve geri yükleme. |
| Ayarlar | Bildirim saati, hesap, hesap silme, kaynaklar ve lisanslar, gizlilik, koşullar, destek. |

## 6. Yasal metinler ve uyumluluk

Lansmandan önce dört metin yayında olmalı (gizlilik politikası, KVKK aydınlatma metni, kullanım koşulları, kaynaklar ve lisanslar sayfası) ve iki mağazanın veri formları doldurulmalı. Ajan metinleri hazırlar; son onay kullanıcıya aittir ve bir avukata gösterilmesi önerilir.

| Metin / iş | İçermesi gerekenler |
| --- | --- |
| Gizlilik politikası (TR + EN) | Toplanan veriler (anonim kimlik, oyun skorları, giriş yapıldıysa e-posta, analitik olayları, bildirim token'ı), amaçlar, saklama süresi, üçüncü taraflar (Supabase, PostHog, RevenueCat, Expo), yurt dışına aktarım, hesap silme yolu, iletişim adresi. Mağazalar bu sayfanın URL'sini zorunlu tutar. |
| KVKK aydınlatma metni | Veri sorumlusu, işleme amaçları, hukuki sebepler, aktarım, haklar (KVKK madde 11). Sunucular yurt dışında olduğu için yurt dışına aktarım kuralları kontrol edilir. Supabase bölgesi olarak Frankfurt (AB) seçilir. |
| Kullanım koşulları | Oyun kuralları, adil oyun, çok oyunculu mod maddesi: **"Rakip bulunamadığında yapay zekâ rakip atanabilir."** Pro'nun tek seferlik olduğu ve iadelerin mağaza üzerinden yapıldığı, hesap silme, sorumluluk sınırları. |
| Kaynaklar ve lisanslar | Her fotoğrafın eser sahibi, kaynağı, lisansı ve linki. App içinde ve web'de. |
| Analitik izni | PostHog olayları kişiyi tanımlamaz şekilde toplanır. Reklam ve izleme olmadığı için Apple'ın izleme izni (ATT) penceresi gerekmez; reklam eklenirse bu yeniden değerlendirilir. |
| Apple gizlilik etiketleri | App Store Connect'te "App Privacy" formu, gizlilik politikasıyla tutarlı doldurulur. |
| Google veri güvenliği formu | Play Console'da "Data safety" formu aynı bilgilerle doldurulur. |
| Yaş derecelendirmesi | Apple anketi ve Google IARC anketi dürüstçe yanıtlanır. Hedef kitle çocuk değildir; Google'ın aile programına girilmez. |
| Hesap silme | App içinde Ayarlar'dan, ayrıca web'de bir hesap silme talebi sayfası (Google bunu ister). |
| Marka | Seçilen isim için TürkPatent araması sonucu karar kaydına yazılır. Tescil başvurusu ücretli olduğu için insan kapısıdır ve şimdilik zorunlu değildir. |

**İletişim adresi:** Mağazalar ve yasal metinler için proje adına bir e-posta adresi gerekir. Yeni bir adres açmak telefon doğrulaması isteyebileceğinden bu da bir insan kapısıdır; ajan `HUMAN_TODO.md`'ye ekler.

## 7. Mağazaya hazırlık ve yükleme

iOS önce yayınlanır; Android, Google'ın kapalı test kuralı nedeniyle en erken 14 gün sonra gelir. Build ve gönderim EAS ile yapılır (Expo bağlantısı üzerinden `build_run` ve `build_submit`).

### 7.1 App Store

1. App Store Connect'te app kaydı açılır (bundle ID, birincil dil Türkçe, kategori Oyunlar → Bilgi Yarışması, ikincil Bulmaca). Sadece iPhone desteklenir (iPad ekran görüntüsü yükünden kaçınmak için).
2. **İnsan kapısı:** Paid Apps sözleşmesi, banka ve vergi formu tamamlanmadan uygulama içi satın alma test edilemez.
3. Uygulama içi ürün: tüketilmeyen `pro_lifetime`, 6 $'a en yakın fiyat noktası. Ülke fiyatları Apple'ın otomatik eşitlemesine bırakılır; Türkiye fiyatı ilk ayın verisine göre gözden geçirilir.
4. TestFlight'ta iç test: Ajan bütün akışları dener, kullanıcı da kendi telefonunda dener.
5. Mağaza sayfası: Bölüm 8'deki metinler, 6,9 inç iPhone ekran görüntüleri, istenirse tanıtım videosu.
6. İnceleme notu: Giriş yapmadan oynanabildiği; 1v1'de rakip bulunamazsa yapay zekâ rakip atandığı ve bunun kullanım koşullarında yazılı olduğu; Pro'nun sandbox test hesabıyla nasıl test edileceği. Açık bir not, ret ihtimalini düşürür.
7. Kademeli yayın açık olarak gönderilir. Ret gelirse ajan gerekçeyi okur, düzeltir, tekrar gönderir ve karar kaydına yazar.

### 7.2 Google Play

1. Play Console'da app oluşturulur. **İnsan kapısı:** Ödeme profili (satıcı hesabı) kullanıcı tarafından açılır.
2. Zorunlu formlar: uygulama erişimi (giriş gerekmez), reklam beyanı (reklam yok), içerik derecelendirmesi, hedef kitle, veri güvenliği, hesap silme URL'si.
3. Uygulama içi ürün `pro_lifetime` aynı fiyatla oluşturulur.
4. **Kapalı test:** Kasım 2023'ten sonra açılmış bireysel hesaplarda, üretime çıkmadan önce en az 12 testçinin 14 gün boyunca testte kalması zorunludur ([Google](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-GB)). Ajan testçi davet metnini ve talimatını hazırlar; testçileri bulmak insan kapısıdır (arkadaşlar, aile, Türk geliştirici toplulukları). Hesap şirket hesabıysa veya daha eskiyse bu adım atlanır.
5. Kapalı test bitince üretim erişimi başvurusu yapılır, onaydan sonra kademeli yayın (%20 ile başlayarak) açılır.

### 7.3 Gönderim öncesi kontrol listesi

- [ ] Gerçek cihazda günlük oyun, 04:00 gün dönüşü ve bildirim denendi
- [ ] 1v1: gerçek oyuncu, admin bildirimi (60. saniye) ve bot (120. saniye) senaryoları denendi
- [ ] Meydan okuma linki app yüklüyken ve yüklü değilken denendi
- [ ] Pro satın alma ve geri yükleme sandbox'ta denendi
- [ ] Hesap silme çalışıyor
- [ ] Her fotoğrafın atfı görünüyor
- [ ] Gizlilik, koşullar, destek URL'leri açılıyor
- [ ] İnternet yokken uygulama çökmüyor, anlaşılır bir mesaj gösteriyor
- [ ] Çökme ve analitik olayları PostHog'a ulaşıyor

## 8. ASO — mağaza optimizasyonu

Amaç: Türkiye mağazalarında "tarih oyunu", "eski fotoğraflar" ve "bilgi yarışması" gibi aramalarda ilk sayfaya çıkmak ve sayfaya gelenin indirme oranını yükseltmek. ASO bir kerelik iş değil, aylık döngüdür.

### 8.1 Anahtar kelime araştırması

- **Ücretsiz kaynaklar:** App Store ve Google Play arama kutusunun otomatik tamamlama önerileri (Chrome ile Türkiye mağazasında), Google Trends (Türkiye), rakiplerin başlık ve alt başlıkları.
- **Başlangıç havuzu:** tarih, eski fotoğraf, nostalji, bilgi yarışması, tahmin, harita, coğrafya, Türkiye, günlük bulmaca, quiz, zeka, Osmanlı, eski İstanbul, yıl, nerede.
- Her kelime için arama hacmi tahmini, rekabet ve alaka puanı `store/keywords.md` dosyasında tutulur.

### 8.2 Mağaza alanları

| Alan | Sınır | Kural |
| --- | --- | --- |
| Apple: isim | 30 karakter | İsim + en güçlü kelime (örnek kalıp: "İsim: Tarih Tahmin Oyunu"). |
| Apple: alt başlık | 30 karakter | İkinci kelime grubu; isimdekileri tekrarlamaz. |
| Apple: anahtar kelimeler | 100 karakter | Virgülle ayrılır, boşluk yok, isim ve alt başlıktaki kelimeler tekrar edilmez, tekil hal yeterli. |
| Apple: tanıtım metni | 170 karakter | Aramada indekslenmez; güncel olay ve kampanyalar için güncellenir. |
| Google: başlık | 30 karakter | Apple'daki isimle aynı mantık. |
| Google: kısa açıklama | 80 karakter | En önemli iki kelime ve bir fayda cümlesi. |
| Google: uzun açıklama | 4.000 karakter | Google bunu indeksler: ana kelimeler doğal akışta 3–5 kez geçer, doldurma yapılmaz. |

### 8.3 Görseller

- **İlk 3 ekran görüntüsü belirleyicidir.** Sıra: (1) bir fotoğraf + Türkiye haritası + "Bu fotoğraf nerede, hangi yıl?", (2) açılım anı ve puan, (3) 1v1. Sonrası: seri, meydan okuma, istatistik.
- Her ekranın üstünde 3–5 kelimelik bir fayda başlığı. Sahte kullanıcı sayısı veya uydurma yorum yazılmaz.
- 15–30 saniyelik tanıtım videosu HyperFrames ile üretilir (Bölüm 9).

### 8.4 Puan ve yorum

- Mağazanın kendi puan isteme penceresi, kullanıcı 3. gününü tamamlayıp kendi ortalamasının üzerinde skor aldığı anda gösterilir. Puan karşılığı ödül verilmez, puan kapısı ("5 yıldız verdiysen devam et") kurulmaz.
- Her yoruma 48 saat içinde Türkçe, kişisel bir yanıt verilir (Expo bağlantısındaki yorum okuma ve yanıtlama araçlarıyla).
- Olumsuz yorumlardaki tekrar eden şikayetler bir sonraki sürümün iş listesine girer.

### 8.5 Deneyler ve etkinlikler

- **Apple Product Page Optimization** ve **Google Store Listing Experiments** ile ikon ve ilk ekran görüntüsü A/B test edilir. Her test en az 7 gün sürer.
- **Apple In-App Events:** Uygulama içi etkinlikler aramada ayrı kart olarak görünür. Tematik günler için kullanılır: yılbaşı, 23 Nisan, 19 Mayıs, 29 Ekim gibi günlerde o temaya özel 5 fotoğraflık set. Anma günlerinde (10 Kasım gibi) oyunlaştırılmış etkinlik yapılmaz.
- Her ay: sıralama ve dönüşüm verisine bakılır, zayıf kelimeler değiştirilir, değişiklik karar kaydına yazılır.

## 9. Pazarlama ve sosyal medya

Oyunun kendisi içerik üretir: her fotoğraf bir "bil bakalım" videosudur. Başlangıçta reklam bütçesi yok; büyüme organik kısa videolardan, paylaşım metninden ve WhatsApp meydan okumalarından gelir.

### 9.1 Kanallar ve sıklık

| Kanal | İçerik | Sıklık |
| --- | --- | --- |
| Instagram Reels, TikTok, YouTube Shorts | Aynı dikey video üç kanala | Günde 1 |
| Instagram hikaye | Video paylaşımı, anket ("sence hangi yıl?"), günün skor dağılımı | Günde 2–3 |
| X | Günün gerçek istatistiği, haftanın en zor fotoğrafı, bilgi notu | Günde 1–2 |
| Reddit (r/Turkey, r/KGBTR, r/istanbul) | Kurucu ağzından şeffaf bir "bu oyunu yaptım" gönderisi | Lansmanda 1 kez, her topluluğun kuralına uyarak |
| Teknoloji basını (Webrazzi, Webtekno, ShiftDelete.Net, Log) | Basın bülteni ve basın kiti | Lansman haftası |

### 9.2 İçerik türleri

1. **Bil bakalım (ana format):** Arşivden bir fotoğraf, 5 saniyelik geri sayım, "yorumlara tahminini yaz", sonda haritada cevap ve yıl. **Günün gerçek fotoğrafları asla paylaşılmaz**; sadece geçmiş günlerin veya bonus havuzun fotoğrafları kullanılır.
2. **Fotoğrafın hikayesi:** 30–45 saniyelik mini tarih anlatımı; sadece kaynakta yazan bilgiyle.
3. **Topluluk istatistiği:** "Dünkü 3. fotoğrafı oyuncuların sadece %9'u 5 yıl içinde bildi." Sadece gerçek veri.
4. **Haftalık şampiyonlar:** Sıralama birincileri, sadece izin veren oyuncuların takma adlarıyla.
5. **Tematik günler:** Bölüm 8.5'teki etkinliklerle aynı takvim.

### 9.3 HyperFrames ile video üretim hattı

[HyperFrames](https://github.com/heygen-com/hyperframes), HTML ve animasyondan MP4 üreten açık kaynaklı bir araçtır (Node.js 22+ ve FFmpeg ister). Claude Code için kendi skill'leri vardır: `claude plugin marketplace add heygen-com/hyperframes` ve `claude plugin install hyperframes@hyperframes`.

1. **Şablonlar** (`/marketing/templates`): (a) Bil bakalım, 15 sn, 1080×1920. (b) Fotoğrafın hikayesi, 30–45 sn. (c) İstatistik kartı, 8 sn. (d) Mağaza tanıtım videosu.
2. **Veri:** Her video fotoğraf tablosundan beslenir: görsel, yıl, konum, hikaye, atıf.
3. **Seslendirme:** ElevenLabs ile Türkçe, her zaman aynı marka sesi.
4. **Render ve kontrol:** `npx hyperframes render` ile MP4; ajan videonun ilk ve son karesine bakarak yazı taşması, atıf ve logo kontrolü yapar.
5. **Haftalık üretim:** Her pazartesi 7 video üretilip planlanır. Render işi Oracle sunucusunda veya ajanın ortamında yapılır.

**Kurallar:**

- Yapay zekâyla geçmişe ait sahte görüntü veya video üretilmez (örneğin "1950'lerde Taksim" diye üretilmiş bir görsel). Bu, tarih oyununun güvenilirliğini yok eder. Higgsfield, Runway ve Veo sadece marka girişleri ve soyut geçişler için kullanılır.
- Her gönderinin açıklamasında fotoğraf atfı yer alır (örnek: "Fotoğraf: Eser sahibi, Wikimedia Commons, CC BY-SA 4.0").
- Platformların yapay zekâ içerik etiketi kurallarına uyulur (yapay zekâ seslendirmesi gerekiyorsa işaretlenir).
- App Store tanıtım videosu Apple kuralı gereği uygulamanın gerçek ekran kaydından oluşur; HyperFrames sadece çerçeve ve yazı için kullanılır.
- Takipçi, beğeni veya yorum satın alınmaz; sahte hesaplarla etkileşim yapılmaz.

### 9.4 Paylaşımın otomasyonu

- **Başlangıç:** Platformların kendi zamanlayıcıları kullanılır (Meta Business Suite, TikTok, YouTube Studio, X). Ajan bunları Chrome üzerinden haftalık doldurur.
- **Sonra:** Instagram Graph API (işletme hesabı ve Meta uygulama incelemesi gerekir) ve YouTube Data API ile n8n üzerinden tam otomatik paylaşım.
- Hesapları açmak ve telefonla doğrulamak insan kapısıdır; ajan kullanıcı adı, profil görseli ve biyografiyi hazırlar.

### 9.5 Lansman akışı

1. **Lansmandan 14 gün önce:** Sosyal hesaplar açılır, 10–15 "bil bakalım" videosu yayınlanır, landing sayfasında e-posta bekleme listesi (Resend) açılır.
2. **Lansman günü (salı–perşembe arası):** Bekleme listesine e-posta, Reddit gönderileri, basın e-postaları, kullanıcının kendi çevresine WhatsApp meydan okuma linki.
3. **İlk hafta:** Nostalji ve tarih içerikleri üreten 20 mikro hesaba (10 bin – 200 bin takipçi) Pro kodu ile iş birliği teklifi (mağazaların promosyon kodu özelliğiyle). Mesajlar kişisel yazılır, toplu spam atılmaz.
4. **İlk ay:** Hangi içerik türünün indirme getirdiği ölçülür (Bölüm 10); kazanan türe ağırlık verilir.
5. **Ücretli reklam (opsiyonel):** Apple Search Ads ile küçük bir test, ancak organik dönüşüm verisi geldikten sonra ve kullanıcı bütçe verirse (insan kapısı).

## 10. Analitik, KPI ve büyüme döngüsü

Her hafta tek bir rapor üretilir ve kullanıcıya Telegram'dan gönderilir: beş ana sayı, geçen haftaya göre değişim ve ajanın o hafta aldığı 3 karar. Başka rapor istenmez.

### 10.1 Ana göstergeler ve ilk hedefler

| Gösterge | Tanım | 90 günlük hedef |
| --- | --- | --- |
| Günlük tamamlama | O gün app'i açanların 5 fotoğrafı bitirme oranı | %40+ |
| D1 / D7 geri dönüş | Yükleyenlerin 1. ve 7. gün tekrar oynama oranı | %35+ / %20+ |
| Paylaşım oranı | Turu bitirenlerin paylaş veya meydan oku düğmesine basma oranı | %10+ |
| Meydan okuma dönüşümü | Açılan meydan okuma linklerinden yüklemeye dönenler | %15+ |
| Pro dönüşümü | Aktif kullanıcıların Pro satın alma oranı | %2+ |
| 1v1 bot oranı | Botla biten maçların oranı (gizli iç gösterge) | Zamanla düşmeli |

### 10.2 PostHog olayları

`app_opened`, `onboarding_completed`, `photo_guessed` (mesafe, yıl farkı, süre, ipucu), `day_completed` (toplam skor), `share_tapped` (kanal), `challenge_sent`, `challenge_opened`, `challenge_completed`, `duel_search_started`, `duel_matched` (rakip türü: oyuncu / admin / bot, bekleme süresi), `duel_finished`, `paywall_viewed` (tetikleyen an), `pro_purchased`, `pro_restored`, `notification_opened`, `account_deleted`.

Kişisel veri olay özelliklerine yazılmaz. Sosyal medyadan gelen indirmeleri ayırmak için profil linklerinde kampanya parametresi ve Apple'ın özel ürün sayfaları kullanılır.

### 10.3 Haftalık döngü

1. Sayıları oku ve geçen haftayla karşılaştır.
2. En zayıf halkayı bul (örneğin düşük tamamlama oranı → fotoğraflar fazla zor olabilir).
3. Tek bir değişiklik seç, uygula, karar kaydına yaz.
4. Bir sonraki hafta etkisini ölç.

## 11. Yayın sonrası operasyon

Yayından sonra işin çoğu tekrar eden görevlerdir; bunlar zamanlanmış işlere (pg\_cron, kullanıcının Oracle sunucusundaki n8n) bağlanır ve kullanıcıya sadece istisnalar bildirilir.

| Sıklık | Görev | Otomasyon |
| --- | --- | --- |
| Her gün 04:00 | Yeni günün açılması; 14 günlük programın dolu olduğunun kontrolü | pg\_cron. Program 7 günün altına düşerse Telegram uyarısı. |
| Her gün | Mağaza yorumlarına yanıt, çökme kontrolü, sosyal medya yorumlarına kısa yanıt | Ajan oturumu veya n8n akışı. |
| Anında | 1v1 bekleyen oyuncu → admin'e Telegram bildirimi | Edge function. |
| Her hafta | En az 50 yeni fotoğraf (Bölüm 3 hattı), 7 video üretimi ve planlaması, KPI raporu | n8n + ajan oturumu. |
| Her ay | ASO döngüsü, bir sürüm güncellemesi, Pro fiyatı ve dönüşüm gözden geçirmesi | Ajan oturumu. |

**Kullanıcıya bildirilecek istisnalar (Telegram):** mağaza reddi, 1 yıldızlı yorumlarda ani artış, çökme oranının %1'i geçmesi, fotoğraf programının bitmek üzere olması, telif şikayeti (böyle bir şikayette ilgili fotoğraf derhal yayından çekilir).

### 11.1 Yol haritası (lansman sonrası)

1. **Sürüm 1.1:** Meydan okuma linkini app yüklemeden web'de oynayabilme. Viral yayılmaya en büyük katkıyı yapacak özellik.
2. **Sürüm 1.2:** Haftalık ligler ve arkadaş grupları.
3. **Sürüm 1.3:** Kullanıcıların açık izinle aile fotoğrafı yükleyebilmesi ("1978, Kadıköy"). Moderasyon, telif beyanı ve fotoda tanınabilir kişilerin onayı gerekir. 1950–1990 boşluğunu doldurur.
4. **Sonra:** Reklam, ancak Pro geliri ve geri dönüş oranı olumsuz etkilenmeyecekse; SALT gibi arşivlerle izinli iş birliği; tematik fotoğraf paketleri.

## 12. Zaman çizelgesi ve ilk oturumun kapsamı

Hedef: iOS lansmanı 24 Kasım 2026 (salı), Android üretim yayını 3 Aralık 2026 (perşembe). Tarihler hedeftir; insan kapıları gecikirse yönetici ajan takvimi kaydırır ve karar kaydına yazar. En kritik bağımlılık, Android'in 14 günlük kapalı testinin 17 Kasım'da başlamasıdır; bunun için 12 testçi o tarihe kadar hazır olmalıdır.

### 12.1 İlk oturum (yarına kadar)

Tek oturumda her şey bitmez. Aşağıdaki sırayla ilerlenir; süre biterse temiz bir noktada durulur ve `STATUS.md` güncellenir.

1. Repo, skill kurulumu, `STATUS.md`, `DECISIONS.md`, `HUMAN_TODO.md`.
2. `HUMAN_TODO.md`'nin ilk hali: hesaplar, testçiler, Telegram token'ı, proje e-postası. Kullanıcı bunları paralel halledebilsin diye en başta yazılır.
3. İsim kararı ve kontrolleri (mağaza, marka, sosyal kullanıcı adı).
4. Supabase projesi: şema, gün dönüşü, puanlama fonksiyonu.
5. Fotoğraf hattı ve ilk 200 fotoğraf (yetişmezse en az günlük havuzun ilk 3 haftası).
6. App: günlük oyunun baştan sona çalışan hali (oyun, açılım, gün özeti, paylaşım, bildirim).
7. 1v1, bot ve Telegram admin bildirimi.
8. Web: landing, gizlilik, koşullar, KVKK, kaynaklar, hesap silme.
9. Mağaza metinlerinin ve anahtar kelimelerin ilk hali.
10. HyperFrames "bil bakalım" şablonu ve 3 örnek video.

### 12.2 Lansmana kadar

&#91;embedded content: Lansman takvimi · 5 iş kalemi, 2 yayın tarihi\]

Kritik yol, 12 testçinin 17 Kasım'a kadar hazır olmasıdır: bu tarih kaçarsa Android yayını da aynı gün sayısı kadar kayar.

## 13. Riskler

En büyük üç risk: fotoğraf telifi, 200 fotoğrafın hızla tükenmesi ve Android'in kapalı test gecikmesi. Her birinin yedek planı aşağıdadır.

| Risk | Olasılık | Etki | Önlem / yedek plan |
| --- | --- | --- | --- |
| Telif şikayeti | Orta | Yüksek | Sadece Bölüm 3.1'deki lisanslar; her fotoğrafın lisans kaydı tabloda; şikayette fotoğraf derhal kaldırılır. |
| Fotoğraf havuzunun tükenmesi | Yüksek | Yüksek | Haftalık 50+ fotoğraf hattı lansmandan önce çalışır; 7 gün altı uyarısı; 1v1 havuzu günlük havuzun geçmiş günleriyle beslenebilir. |
| Yanlış yıl veya konum bilgisi | Orta | Orta | Çapraz kontrol; app'te "Bu bilgi yanlış mı?" bildirme düğmesi; 3 bildirim alan fotoğraf incelemeye düşer. |
| Google 12 testçi kuralı | Yüksek | Orta | iOS önce çıkar; testçi listesi ilk gün başlatılır; uygunsa daha eski bir hesap veya şirket hesabı kullanılır. |
| Apple 4.3 / benzerlik reddi | Düşük | Orta | Türkiye'ye özel içerik, özgün tasarım, açık inceleme notu. |
| Botun fark edilmesi ve tepki | Orta | Düşük | Kullanım koşullarında açık madde; sahte oyuncu sayısı yok; gerçek oyuncu varken bot atanmaz. |
| Türkiye'de düşük ödeme isteği | Yüksek | Orta | Pro tek seferlik ve ucuz; ilk ayın verisine göre Türkiye fiyatı ayarlanır; ileride reklam seçeneği. |
| OpenFreeMap kesintisi | Düşük | Yüksek | Kendi depolamamızdan Türkiye PMTiles yedeği. |
| Ajan oturumunun yarıda kalması | Yüksek | Düşük | `STATUS.md` ve `DECISIONS.md` sayesinde bir sonraki ajan kaldığı yerden devam eder. |

## Kaynaklar

- [TimeGuessr, App Store](https://apps.apple.com/app/id6745130802)
- [Google Play Console Yardım: yeni kişisel hesaplar için test gereksinimleri](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-GB)
- [SALT Araştırma, örnek kayıt ve lisansı](https://archives.saltresearch.org/handle/123456789/108152)
- [Kongre Kütüphanesi, Abdülhamid II koleksiyonu haklar sayfası](https://www.loc.gov/collections/abdul-hamid-ii/about-this-collection/rights-and-access/)
- [HyperFrames (GitHub)](https://github.com/heygen-com/hyperframes)
- [OpenFreeMap](https://openfreemap.org)
- [Open Paywall Gallery](https://github.com/paywallpro/paywall-gallery)
