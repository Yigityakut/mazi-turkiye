# Yayın kontrol listesi · Mazi Türkiye 1.0

Sıra önemlidir: maddeler yukarıdan aşağıya yapılır. `[ ]` bekliyor · `[x]` tamam. 👤 işaretli maddeler **insan kapısıdır** (kimlik, ödeme, sözleşme, telefon onayı); ajan hazırlar, insan tamamlar (`HUMAN_TODO.md`).

Bağlantılı dosyalar: `store/listing.tr.md` (metinler) · `store/iap.md` (ürün) · `store/privacy-forms.md` (veri formları) · `store/age-rating.md` (yaş) · `store/review-notes.md` (inceleme notu) · `store/qa-report.md` (açık hatalar) · `app/README.md` (build, ortam değişkenleri, linkler) · `marketing/testers.md` (kapalı test).

## Takvim

| Tarih (2026) | Olay |
| --- | --- |
| 4–14 Kasım | QA raporundaki Kritik/Yüksek bulguların düzeltilmesi, TestFlight ve Play internal test |
| **17 Kasım (salı)** | **Kritik yol:** Google Play kapalı testi 12+ testçiyle başlar. iOS 1.0 App Review'a gönderilir (17–18 Kasım) |
| 23 Kasım (pazartesi) | iOS onaylanmış ve "Pending Developer Release" durumunda olmalı |
| **24 Kasım (salı)** | **iOS lansmanı** |
| 1 Aralık (salı) | 14 günlük kapalı test biter → üretim erişimi başvurusu (Google incelemesi genelde ≤7 gün) |
| **3 Aralık (perşembe)** | **Android lansmanı** (üretim erişimi zamanında onaylanırsa; gecikirse tarih kayar ve `DECISIONS.md`'ye yazılır) |

---

## 0. Ön koşullar (iki mağaza için ortak)

- [ ] `store/qa-report.md`'deki **Kritik** ve **Yüksek** bulgular kapatıldı veya `DECISIONS.md`'de gerekçesiyle ertelendi.
- [ ] 👤 Yasal metinler onaylandı ve yayında: `/gizlilik/`, `/kvkk/`, `/kosullar/`, `/kaynaklar/`, `/destek/`, `/hesap-silme/` (sarı yer tutucular doldu; HUMAN_TODO 13). Koşullarda "Rakip bulunamadığında yapay zekâ rakip atanabilir." maddesi var.
- [ ] 👤 Alan adı (`maziturkiye.com`) Vercel'e bağlı, HTTPS çalışıyor; `destek@maziturkiye.com` e-posta alıyor (HUMAN_TODO 9).
- [ ] `web/.well-known/apple-app-site-association` → `APPLE_TEAM_ID` gerçek Team ID ile değişti; `curl -sI https://maziturkiye.com/.well-known/apple-app-site-association` → **200**, `application/json`, yönlendirme yok.
- [ ] `web/.well-known/assetlinks.json` → Play App Signing SHA-256 (ve EAS upload key SHA-256) girildi (Android adımı B3'ten sonra).
- [ ] Supabase: tüm migration'lar uygulandı; Edge Function'lar deploy edildi (kökteki `README.md`); secrets girildi (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `REVENUECAT_WEBHOOK_AUTH`, `INTERNAL_SECRET`).
- [ ] Supabase Auth: **Allow anonymous sign-ins açık**; Apple ve Google sağlayıcıları açık (Apple Client IDs'te `com.maziturkiye.app`); **Rate Limits → anonim giriş sınırı lansman için yükseltildi** (varsayılan IP başına saatte 30, CGNAT yüzünden yetmez).
- [ ] Fotoğraf programı: önümüzdeki **14 günün her birinde 5 günlük fotoğraf** programlı; 1v1 havuzunda en az 100 onaylı fotoğraf; `daily-ops` uyarı göndermiyor.
- [ ] Telegram admin botu çalışıyor (test mesajı geldi); admin hesabı `is_admin = true`.
- [ ] RevenueCat: proje, entitlement `pro`, offering `default` → `$rc_lifetime` → `pro_lifetime`; webhook URL'si ve Authorization başlığı tanımlı (`store/iap.md`); test satın almasında `profiles.is_pro` true oluyor.
- [ ] PostHog (EU) projesi açık; production anahtarı EAS'te; Plan 10.1 göstergeleri için pano hazır.
- [ ] EAS `production` ortam değişkenleri eksiksiz (`npx eas-cli@latest env:list --environment production`, liste: `app/README.md` §2). **`EXPO_PUBLIC_DEMO` hiçbir ortamda tanımlı değil.**
- [ ] `EAS_PROJECT_ID` ile `npx expo config --type public` çıktısında `updates.url` ve `extra.eas.projectId` dolu (OTA ve push için).
- [ ] Ekran görüntüleri üretildi (`store/screenshots/render.mjs`, metinler `store/screenshots/captions.md`): `store/screenshots/out/ios-6.9/` (1320×2868, 6 adet) ve `store/screenshots/out/android-phone/` (1080×1920; Play en-boy oranı **en fazla 2:1** ister, iOS görselleri 2,17:1 olduğu için Play'de kullanılamaz). Android seti iOS ile aynı 6 ekrana tamamlandı.
- [ ] `python3 store/check_lengths.py` hatasız.

---

## A. App Store Connect (iOS)

### A1. Hesap ve sözleşmeler
- [ ] 👤 Apple Developer Program üyeliği aktif (HUMAN_TODO 5).
- [ ] 👤 App Store Connect → Business → **Paid Apps Agreement: Active**; banka hesabı ve vergi formu (W-8BEN) tamam. Bu olmadan uygulama içi satın alma sandbox'ta bile test edilemez.
- [ ] Team ID (Membership details) not edildi → AASA dosyası (Bölüm 0).

### A2. Kimlikler ve anahtarlar
- [ ] App ID `com.maziturkiye.app` (ilk EAS build oluşturur) yetenekleri: **Sign in with Apple**, **Associated Domains**, **Push Notifications**, In-App Purchase.
- [ ] 👤 Sign in with Apple için Services ID + key oluşturuldu, Supabase Apple sağlayıcısına girildi.
- [ ] APNs anahtarı EAS'e eklendi: `npx eas-cli@latest credentials` → iOS → Push Notifications.
- [ ] App Store Connect API anahtarı (rol: App Manager) oluşturuldu; EAS Submit ve RevenueCat'e verildi. RevenueCat için ayrıca **In-App Purchase Key** (.p8) yüklendi.

### A3. Uygulama kaydı
- [ ] 👤 Apps → **+ New App**: Platform **iOS** · Name **Mazi Türkiye: Tarih Tahmini** · Primary Language **Turkish** · Bundle ID **com.maziturkiye.app** · SKU **mazi-turkiye-ios** · User Access: Full Access.
- [ ] App Information → General → **Apple ID** (10 haneli) → `app/eas.json` → `submit.production.ios.ascAppId` (`SET_AFTER_APP_STORE_CONNECT_RECORD` yerine).

### A4. App Information
- [ ] Name: `Mazi Türkiye: Tarih Tahmini` (27/30) · Subtitle: `Eski fotoğraf, harita ve yıl` (28/30).
- [ ] Category: Primary **Games**, alt kategoriler **Trivia** ve **Puzzle** (Plan 7.1: Bilgi Yarışması, ikincil Bulmaca).
- [ ] Content Rights: "Contains third-party content" → **Yes, I have the rights** (kamu malı / CC0 / CC BY / CC BY-SA; atıf uygulamada ve `/kaynaklar/`'da).
- [ ] Age Rating: anket `store/age-rating.md`'deki gibi dürüst yanıtlandı → beklenen **4+**.
- [ ] License Agreement: Apple Standard EULA (koşullar açıklamada linkli).
- [ ] İsteğe bağlı: English (U.S.) metadata yerelleştirmesi `store/listing.en.md` (uygulamanın Türkçe olduğu açıklamada yazmalı).

### A5. Pricing and Availability
- [ ] Price: **Free**.
- [ ] Availability: tüm ülkeler (yurt dışındaki Türkler ikincil kitle) veya en az Türkiye.
- [ ] "iPhone and iPad Apps on Apple Silicon Macs" ve Apple Vision Pro dağıtımı **kapalı** (test edilmedi; `supportsTablet: false`).

### A6. Uygulama içi satın alma: `pro_lifetime` (`store/iap.md`)
- [ ] Monetization → In-App Purchases → **+** → Type **Non-Consumable** · Reference Name `Mazi Türkiye Pro (ömür boyu)` · Product ID **`pro_lifetime`** (sonradan değiştirilemez).
- [ ] Price Schedule: taban **5,99 USD**; diğer ülkeler Apple'ın otomatik eşitlemesi. Türkiye fiyatı ilk ayın verisine göre gözden geçirilir (`DECISIONS.md`).
- [ ] Localization (Turkish): Display Name `Mazi Türkiye Pro` · Description `İpuçları, arşiv, sınırsız 1v1, tam istatistik` (≤45).
- [ ] Family Sharing: **kapalı** (açıldıktan sonra kapatılamaz; ilk ay verisinden sonra karar).
- [ ] Review Information: ekran görüntüsü `store/screenshots/iap-review.png` (Pro ekranı, 1290×2796) + not: "Home → Arşiv · Pro → Pro'yu aç, or tap 'Dönem ipucu' during a round."
- [ ] Durum **Ready to Submit**.
- [ ] 👤 Users and Access → Sandbox → Testers: en az bir sandbox Apple hesabı.
- [ ] RevenueCat'te App Store uygulaması bağlı, `pro_lifetime` içe aktarıldı ve `pro` entitlement'ına bağlı; offering `default` → Lifetime paketi.

### A7. App Privacy (`store/privacy-forms.md`)
- [ ] Privacy Policy URL: `https://maziturkiye.com/gizlilik/`
- [ ] Data Collection: "Yes"; kategoriler: Contact Info → Email (sadece Apple/Google girişi), User Content → Other, Identifiers → User ID, Usage Data → Product Interaction, Purchases → Purchase History, Diagnostics → Crash/Performance, Other Data → Gameplay. Hepsi **Linked to You**, hiçbiri **Tracking** değil. Location: **toplanmıyor**.
- [ ] **Publish** edildi (yayımlanmadan inceleme gönderilemez).

### A8. Build ve TestFlight iç testi
- [ ] `app/app.config.ts` → `version: "1.0.0"`; production ortam değişkenleri tam (Bölüm 0).
- [ ] `cd app && npx eas-cli@latest build -p ios --profile production`
- [ ] `npx eas-cli@latest submit -p ios --profile production --latest` → App Store Connect → TestFlight'ta "Processing" → "Ready to Test" (10–30 dk). Şifreleme sorusu çıkmaz (`ITSAppUsesNonExemptEncryption: false`).
- [ ] TestFlight → Internal Testing → grup "Ekip" → iç testçiler eklendi (App Store Connect kullanıcıları, en çok 100); Test Information: açıklama ve geri bildirim e-postası `destek@maziturkiye.com`.
- [ ] Ajan ve kullanıcı kendi telefonunda **Bölüm C**'yi (Gönderim öncesi kontrol listesi) TestFlight build'iyle baştan sona yaptı.
- [ ] TestFlight → Crashes ve Feedback boş (Expo bağlantısında `testflight_crashes`, `testflight_feedback`).

### A9. Sürüm sayfası (iOS App → 1.0 Prepare for Submission)
- [ ] Sürüm numarası build ile aynı: **1.0.0** (varsayılan "1.0" ise düzelt; yoksa build seçilemez).
- [ ] **Screenshots → iPhone 6.9" Display:** `store/screenshots/out/ios-6.9/` (`01-nerede` … `06-istatistik`, 1320×2868, dikey; Apple 3–10 adet kabul eder). Sıra (Plan 8.3): 1) fotoğraf + Türkiye haritası + "Bu fotoğraf nerede, hangi yıl?", 2) açılım anı ve puan, 3) 1v1, sonra seri, meydan okuma, istatistik. Sahte kullanıcı sayısı veya uydurma yorum yok. iPad görüntüsü gerekmez.
- [ ] App Preview (isteğe bağlı): sadece uygulamanın gerçek ekran kaydı; HyperFrames sadece çerçeve/yazı için.
- [ ] Promotional Text (≤170), Description, Keywords (`nostalji,bilgi,yarışması,…` 94/100), Support URL `https://maziturkiye.com/destek/`, Marketing URL `https://maziturkiye.com`: `store/listing.tr.md`'den aynen.
- [ ] Copyright: `© 2026 ‹VERİ SORUMLUSU ADI›` (yer tutucu dolduruldu).
- [ ] Build: TestFlight'taki son production build seçildi.
- [ ] **In-App Purchases and Subscriptions** bölümüne `pro_lifetime` eklendi (ilk IAP, binary ile birlikte incelenir; eklenmezse inceleme ekibi satın alamaz → 2.1 reddi).
- [ ] Game Center: kapalı.
- [ ] App Review Information: **Sign-in required: kapalı** (demo hesabı yok, anonim oturum) · iletişim adı, telefonu, e-postası · **Notes:** `store/review-notes.md`'deki İngilizce blok aynen.
- [ ] Version Release: **Manually release this version** (lansman 24 Kasım'da elle).

### A10. İncelemeye gönderim
- [ ] Son kontrol: Bölüm C tamam; günün fotoğrafları inceleme günlerinde de hazır (program ≥14 gün).
- [ ] **17–18 Kasım:** Add for Review → Submit to App Review (inceleme genelde 24–48 saat; bir ret için pay bırakır).
- [ ] Ret gelirse: Resolution Center'daki gerekçe okunur → düzeltilir → tekrar gönderilir → `DECISIONS.md`'ye yazılır. Kural sorusuysa Resolution Center'dan net bir yanıt yazılır (bot açıklaması, hesap silme yolu, sandbox adımları zaten notta).
- [ ] Onay sonrası durum: **Pending Developer Release** (23 Kasım'a kadar).

### A11. Kademeli yayın
- [ ] Plan 7.1: kademeli yayın açık. Apple'ın "Phased Release for Automatic Updates" seçeneği **sadece güncellemelerde** (1.0.1+) çıkar; 1.0'da yeni indirmeler zaten herkese açıktır. 1.0.1'den itibaren her sürümde açılır (7 gün: %1 → %2 → %5 → %10 → %20 → %50 → %100; 30 güne kadar duraklatılabilir). Bu not `DECISIONS.md`'ye yazılır.

---

## B. Google Play Console (Android)

### B1. Hesap
- [ ] 👤 Geliştirici hesabı (bireysel önerilir; HUMAN_TODO 3), kimlik doğrulaması tamam, iletişim e-postası/telefonu doğrulandı.
- [ ] 👤 **Ödeme profili** (merchant account) açıldı: ücretli ürün oluşturmak için şart.
- [ ] Hesap Kasım 2023'ten önce açılmışsa veya şirket hesabıysa B8–B9 (12 testçi × 14 gün) atlanır; durum `DECISIONS.md`'ye yazılır.

### B2. Uygulamayı oluştur
- [ ] Home → **Create app**: App name **Mazi Türkiye: Tarih Tahmini** · Default language **Turkish – tr-TR** · App or game: **Game** · Free or paid: **Free** · Developer Program Policies ve US export laws beyanları işaretli.

### B3. İlk AAB (elle) ve uygulama imzalama
- [ ] `cd app && npx eas-cli@latest build -p android --profile production` → `.aab` dosyasını indir.
- [ ] Test and release → Testing → **Internal testing** → Create new release → App signing: **Google tarafından üretilen anahtar** (Play App Signing, varsayılan) → `.aab` yükle → sürüm notu → Save → Review → **Start rollout to Internal testing**. (Google API ilk yüklemeyi kabul etmez; sonraki yüklemeler `npx eas-cli@latest submit -p android --profile production --latest`.)
- [ ] Internal testing → Testers: e-posta listesi "Ekip" → opt-in linkiyle kur ve aç.
- [ ] Setup → **App integrity** → App signing key certificate: **SHA-256** → `web/.well-known/assetlinks.json`; **SHA-1** → Google Cloud Android OAuth istemcisi. Upload key (EAS) SHA-1/SHA-256'sı da aynı yerlere eklendi.

### B4. Uygulama içi ürün: `pro_lifetime`
- [ ] Monetize with Play → Products → **One-time products** → Create: Product ID **`pro_lifetime`** · Name `Mazi Türkiye Pro` · Description `İpuçları, geçmiş günler, sınırsız 1v1 ve detaylı istatistik — tek seferlik` · satın alma seçeneği: Buy · taban fiyat **5,99 USD**, diğer ülkeler otomatik dönüşüm · **Activate**. (BILLING izni olan bir AAB yüklenmeden ürün oluşturulamaz; B3 önce.)
- [ ] RevenueCat'te Play uygulaması bağlı (service account JSON: finansal veri ve sipariş yönetimi izni) · Real-time developer notifications (Pub/Sub) RevenueCat rehberine göre kuruldu · ürün içe aktarıldı ve `pro` entitlement'ına bağlı.
- [ ] Setup → **License testing**: test Gmail hesapları eklendi (ücretsiz test satın alması).

### B5. App content (Policy and programs → App content), cevaplar `store/privacy-forms.md`
- [ ] **Privacy policy:** `https://maziturkiye.com/gizlilik/`
- [ ] **App access:** All functionality is available without any access restrictions (giriş gerekmez).
- [ ] **Ads:** No, my app does not contain ads.
- [ ] **Content rating:** IARC anketi (e-posta `destek@maziturkiye.com`, kategori Game; cevaplar `store/age-rating.md`) → beklenen PEGI 3 / ESRB Everyone ("Users Interact", "In-App Purchases" etiketleriyle).
- [ ] **Target audience and content:** 13–15, 16–17, 18+; çocuklara yönelik değil; Families programı yok.
- [ ] **News app:** No. **Government app:** No. **Financial features:** none. **Health:** not a health app.
- [ ] **Data safety:** tablo `store/privacy-forms.md` → aktarımda şifreleme Evet, silme talebi Evet, hesap silme URL'si `https://maziturkiye.com/hesap-silme/`.
- [ ] **Advertising ID:** kullanılmıyor (build sonrası birleşik manifestte `com.google.android.gms.permission.AD_ID` olmadığını doğrula).
- [ ] Konsol başka izin beyanı isterse (fotoğraf/video, exact alarm, foreground service, full-screen intent): kullanılmıyor.

### B6. Store settings
- [ ] App category: **Game → Trivia** · Tags (en çok 5): Bilgi yarışması, Bulmaca, Tek oyunculu, Çok oyunculu, Çevrimiçi.
- [ ] Store listing contact details: e-posta `destek@maziturkiye.com`, web sitesi `https://maziturkiye.com`.

### B7. Main store listing (`store/listing.tr.md`)
- [ ] App name (27/30), Short description (80/80), Full description (≤4.000).
- [ ] App icon: 512×512 PNG, 32-bit, ≤1 MB (`store/brand/icon-1024.png`'den küçültülür).
- [ ] **Feature graphic: 1024×500** JPG veya 24-bit PNG (zorunlu; henüz repoda yok, üretilmeli).
- [ ] Phone screenshots: `store/screenshots/out/android-phone/` (1080×1920). 2–8 adet, en-boy oranı ≤2:1, tanıtıma uygunluk için en az 4 adet ve kısa kenar ≥1080 px. Sıra iOS ile aynı (Plan 8.3).
- [ ] İsteğe bağlı: tanıtım videosu (YouTube URL), English çevirisi (`store/listing.en.md`).
- [ ] Not: Tam açıklama "Google ile giriş yapıp skorlarını koru" diyor; Google girişi production build'de açık değilse cümle çıkarılır.

### B8. Kapalı test: 12 testçi × 14 gün (`marketing/testers.md`)
- [ ] Testing → **Closed testing** → track (varsayılan "Alpha") → Countries/regions: Türkiye (+ testçilerin bulunduğu ülkeler).
- [ ] Testers: e-posta listesi "Kapalı test" → **en az 12, hedef 15–16** Gmail adresi (adresler repoya yazılmaz) → Save → **opt-in linkini** kopyala → davet metnindeki `<PLAY_TEST_OPT_IN_LINK>` yerine koyup gönder.
- [ ] Create release → **Add from library** (internal'daki AAB) → Türkçe sürüm notu → Review → **Start rollout to Closed testing**. (Kapalı test sürümü Google incelemesinden geçer; saatler–birkaç gün.)
- [ ] **En geç 17 Kasım:** 12+ testçi opt-in yaptı ve uygulamayı Play'den kurdu. 14 gün sayacı ancak 12 testçi aynı anda katılı olduğunda ilerler; Dashboard'daki sayaç takip edilir.
- [ ] Testçi takibi `marketing/testers.md` tablosunda; düşen testçinin yerine yedek davet edilir.
- [ ] Test süresince hatalar yeni kapalı test sürümleriyle düzeltilir (sayaç sıfırlanmaz). Geri bildirimler ve yapılan değişiklikler not edilir (üretim başvurusunda sorulur).

### B9. Üretim erişimi başvurusu
- [ ] 14 gün dolunca (17 Kasım başlangıçla **1 Aralık**) Dashboard → **Apply for production** → sorular `marketing/testers.md`'deki taslakla yanıtlanır (testçileri nasıl bulduk, nasıl kullandılar, geri bildirim ve değişiklikler, hazır mı) → gönder.
- [ ] Onay gelene kadar (genelde ≤7 gün) production sürümü hazırlanır ama yayınlanmaz.

### B10. Üretim sürümü ve kademeli yayın
- [ ] Publishing overview → **Managed publishing açık** (onaylanan değişiklik sen "Publish" diyene kadar yayına girmez; lansman saatini sen belirlersin).
- [ ] Production → Countries/regions: iOS ile aynı ülkeler.
- [ ] Production → Create new release → Add from library (kapalı testteki son AAB) → sürüm notu (`listing.tr.md` → "Bu sürümde (1.0)") → **Staged rollout: %20** → Review → Start rollout to Production.
- [ ] **İlk sürüm notu:** Daha önce yayında sürüm olmadığı için %20 kademeli yayın, yeni yüklemeleri de kullanıcıların yaklaşık %20'siyle sınırlar. Lansman duyurularından (3 Aralık sabahı) önce %100'e çıkarılır; %20 aşaması onay gelir gelmez 1–2 gün önceden başlatılıp Android vitals izlenir.
- [ ] Android vitals: kullanıcı tarafından algılanan çökme oranı <%1,09, ANR <%0,47 (Google'ın kötü davranış eşikleri). Sorun yoksa %20 → %50 → %100. Ani artışta **Halt rollout**, düzelt, yeni sürüm.

---

## C. Gönderim öncesi kontrol listesi

Plan 7.3 (aynen):

- [ ] Gerçek cihazda günlük oyun, 04:00 gün dönüşü ve bildirim denendi
- [ ] 1v1: gerçek oyuncu, admin bildirimi (60. saniye) ve bot (120. saniye) senaryoları denendi
- [ ] Meydan okuma linki app yüklüyken ve yüklü değilken denendi
- [ ] Pro satın alma ve geri yükleme sandbox'ta denendi
- [ ] Hesap silme çalışıyor
- [ ] Her fotoğrafın atfı görünüyor
- [ ] Gizlilik, koşullar, destek URL'leri açılıyor
- [ ] İnternet yokken uygulama çökmüyor, anlaşılır bir mesaj gösteriyor
- [ ] Çökme ve analitik olayları PostHog'a ulaşıyor

### C.1 Nasıl denenir (iOS TestFlight + Android internal/closed, ikisinde de)

- **Günlük oyun ve gün dönüşü:** Temiz kurulum → karşılama (3 adım) → 5 fotoğraf → açılım (çizgi, yıl sayacı, puan, hikaye, atıf, "Fotoğrafı tekrar aç", "Bu bilgi yanlış mı?") → gün özeti → paylaş. Fotoğrafa dokununca tam ekran yakınlaştırma (pinch, çift dokunma) **Android'de de** çalışıyor. 03:58–04:02 arası uygulama açıkken geri sayım sıfırlanıp yeni gün yükleniyor; seri doğru artıyor.
- **Bildirim:** İzin ilk turun sonunda isteniyor (açılışta değil). Ertesi gün turu bitirmeden hatırlatıcı geliyor; bitirince o günün bildirimi gelmiyor. Ayarlar'dan sabit saat seçimi çalışıyor. Bildirime dokununca uygulama açılıyor. Android'de "seri tehlikede" push bildirimi geliyor (FCM yapılandırması).
- **1v1:** (a) iki gerçek cihaz eşleşiyor, 45 sn sayaç, açılım, sonuç, derece değişimi; (b) tek cihazla bekle → 60. saniyede admin'e Telegram mesajı → linke dokununca admin hesabı maça bağlanıyor; (c) 120. saniyede bot katılıyor, bot ismi sabit listeden, ekranda "Rakip bulunamazsa yapay zekâ rakip atanabilir." yazıyor; (d) ücretsiz kullanıcı 3 maçtan sonra Pro ekranını görüyor.
- **Meydan okuma:** Gün özeti → "Arkadaşına meydan oku" → WhatsApp. (a) Uygulama yüklü cihazda link doğrudan meydan okumayı açıyor (iOS evrensel link, Android App Links "verified"); (b) yüklü olmayan cihazda web sayfası 6 haneli kodu gösterip kopyalıyor → mağazadan kur → karşılamada "Meydan okuma kodun var mı?" → "Panodan yapıştır" → aynı 5 fotoğraf → karşılaştırma.
- **Pro:** Sandbox (iOS) / license tester (Android) hesabıyla: ipucu çipi → Pro ekranı → mağaza fiyatı görünüyor (yedek "6 $" değil) → satın al → ipucu çalışıyor, arşiv açılıyor, 1v1 sınırı kalkıyor, uygulamayı kapatıp açınca Pro kalıyor. Uygulamayı sil-kur → "Satın alımı geri yükle" → Pro geri geliyor. **Apple/Google ile giriş yaptıktan sonra** satın alma ve geri yükleme de denenir (QA bulgusu).
- **Hesap silme:** Ayarlar → Hesabı sil → onay → veriler gidiyor, uygulama yeni anonim oturumla açılıyor; Apple ile girişli hesapta da deneniyor. Web: `/hesap-silme/` talep sayfası açılıyor.
- **Atıf:** Her açılımda ve 1v1 açılımında eser sahibi, kaynak (link) ve lisans (link) görünüyor; Ayarlar → Kaynaklar ve lisanslar dolu.
- **URL'ler:** Ayarlar → Gizlilik, KVKK, Kullanım koşulları uygulama içi tarayıcıda açılıyor; Destek e-postası açılıyor; mağaza sayfalarındaki gizlilik/destek/pazarlama URL'leri 200 dönüyor.
- **İnternetsiz:** Uçak modunda: ilk kurulum (karşılama → oyun "Bağlantı kurulamadı" + Tekrar dene), oyun ortasında tahmin, sıralama, istatistik, kaynaklar, Pro ekranı, 1v1 araması ve 1v1 maçı. Hiçbiri çökmüyor; her ekranda anlaşılır mesaj var; internet gelince "Tekrar dene" ekranı gerçekten toparlıyor.
- **PostHog:** Live events'te `app_opened`, `onboarding_completed`, `photo_guessed`, `day_completed`, `share_tapped`, `challenge_sent`, `challenge_opened`, `duel_search_started`, `duel_matched`, `duel_finished`, `paywall_viewed`, `pro_purchased`, `pro_restored`, `notification_opened`, `account_deleted` görünüyor; olaylarda e-posta/isim yok. Test amaçlı bir hata fırlatılınca (yalnızca preview build) `$exception` olayı geliyor.

### C.2 Ek kontroller
- [ ] Karanlık mod ve büyük yazı boyutu (Ayarlar → Erişilebilirlik → Daha Büyük Metin) ekranları bozmuyor.
- [ ] VoiceOver / TalkBack ile ana akış gezilebiliyor (düğme etiketleri Türkçe).
- [ ] Küçük ekran (iPhone SE / 5,5" Android) ve büyük ekranda oyun ekranında harita, yıl kaydırıcısı ve "Tahmin et" görünür.
- [ ] Apple ile giriş ve Google ile giriş; anonim skorların hesaba taşınması; iki cihaz arası senkron.
- [ ] Sürüm bilgisi Ayarlar'ın altında doğru (1.0.0 ve build numarası).
- [ ] OTA: preview kanalına küçük bir metin değişikliği gönder (`npx eas-cli@latest update --channel preview --environment preview`), uygulama iki açılışta güncellemeyi alıyor.

---

## D. Lansman günü akışı

Saatler Türkiye saatiyle (TSİ). Gün 04:00'te kendiliğinden açılır.

### D.0 Lansmandan önceki hafta (17–23 Kasım)
- [ ] Sosyal hesaplar açık, profiller `marketing/social/profiles.md`'ye göre dolu; son 14 günde 10–15 "bil bakalım" videosu yayınlandı (Plan 9.5; `marketing/templates/` + `make-video.mjs`; **günün fotoğrafları asla**).
- [ ] Basın bülteni (`marketing/outreach/press-release.md`): ‹Ad Soyad›, kurucu alıntısı, tarih dolduruldu; basın kiti sayfası (`maziturkiye.com/basin`: ekran görüntüleri, ikon, logo) yayında veya bültenden link çıkarıldı.
- [ ] Reddit gönderileri (`marketing/outreach/reddit.md`) her topluluğun kuralına göre son kez okundu.
- [ ] 20 mikro hesap listesi (`marketing/outreach/creators.md`, elle doldurulur) hazır; mesaj `marketing/outreach/influencer-dm.md`.
- [ ] Landing'deki bekleme listesi (Resend) varsa duyuru e-postası taslağı hazır.
- [ ] Pro promosyon kodları: App Store Connect'te `pro_lifetime` için offer/promo code, Play Console'da promo code (iş birlikleri için).
- [ ] iOS durumu **Pending Developer Release**.

### D.1 iOS lansmanı · 24 Kasım 2026, salı
- [ ] **04:15** Gerçek cihazda yeni günün (#N) açıldığını ve oynandığını kontrol et; `daily-ops` ve Telegram'da uyarı yok.
- [ ] **08:30** Son kontrol: Supabase sağlıklı (Dashboard → Reports, Edge Function logları), PostHog olay alıyor, web sayfaları açılıyor, AASA 200 dönüyor.
- [ ] **09:00** App Store Connect → 1.0 → **Release This Version**. Mağazada görünmesi birkaç saat (en çok 24 saat) sürebilir; `https://apps.apple.com/tr/app/id<APPLE_ID>` açılana kadar duyuru yapma.
- [ ] **10:00** Link açılınca yer tutucuları değiştir: `marketing/outreach/reddit.md` (‹link›), `marketing/outreach/press-release.md` (App Store linki, ‹tarih›), web landing'deki App Store rozeti, sosyal biyografi linkleri (`?utm_source=<kanal>&utm_medium=profile`).
- [ ] **10:30** Bekleme listesine duyuru e-postası (varsa).
- [ ] **11:00** Basın e-postaları: Webrazzi, Webtekno, ShiftDelete.Net, Log, Teknoblog (`press-release.md`; her birine kişisel bir giriş cümlesi).
- [ ] **12:00** Sosyal medya: lansman "bil bakalım" videosu Reels + TikTok + Shorts, X gönderisi, Instagram hikayesi (atıf kalıbı ve AI etiketi kuralları `profiles.md`'de).
- [ ] **13:00** Kendi çevren: günün turunu oyna, gün özetinden WhatsApp meydan okuma linki gönder (Plan 9.5.2).
- [ ] **17:00** Reddit gönderileri (`reddit.md`; r/Turkey için ABD sabahıyla çakışan saat). Sonraki 2–3 saat yorumlara kurucu olarak yanıt ver.
- [ ] **Gün boyu:** Telegram'da 1v1 bekleme bildirimi gelince admin olarak maça gir (lansman günü bot oranını düşürür). PostHog: `app_opened`, `onboarding_completed`, `day_completed`, `challenge_sent`, `paywall_viewed`, `pro_purchased`. Supabase: hata logları, anonim giriş 429'ları. App Store yorumlarına 48 saat içinde Türkçe, kişisel yanıt (Expo bağlantısı: `appstore_reviews`, `appstore_reply_review`).
- [ ] **22:00** Günün sayıları ve gözlemler `STATUS.md`'ye; alınan kararlar `DECISIONS.md`'ye.

**Acil durum:**
- Sadece JS hatası → düzelt → `npx eas-cli@latest update --channel preview --environment preview --message "…"` ile dene → `--channel production --environment production`.
- Native hata → `version` 1.0.1 → build → submit → App Review'dan **expedited review** talebi.
- Arka uç hatası → migration / Edge Function düzeltmesi hemen.
- Telif şikayeti → ilgili fotoğraf derhal yayından çekilir (Plan 11).
- Mağaza reddi, 1 yıldızlı yorumlarda ani artış, çökme oranı >%1 → Telegram'dan kullanıcıya bildirilir.

**İlk hafta (25–30 Kasım):** 20 mikro hesaba kişisel iş birliği mesajı (`influencer-dm.md`, toplu gönderim yok) · her gün 1 video + 2–3 hikaye · yorumlara 48 saat içinde yanıt · Plan 10.3 haftalık döngüsü (en zayıf halka → tek değişiklik).

### D.2 Android lansmanı · 3 Aralık 2026, perşembe
- [ ] **1 Aralık:** Kapalı test 14 günü doldu → üretim erişimi başvurusu (B9).
- [ ] **Onay gelince (en geç 2 Aralık):** Production sürümü %20 kademeli yayınla başlatıldı (B10), Android vitals ve PostHog'da `platform = android` izleniyor.
- [ ] **3 Aralık 04:15** Android cihazda yeni günün açıldığını kontrol et.
- [ ] **09:00** Kademeli yayını **%100**'e çıkar (Managed publishing açıksa "Publish changes"). `https://play.google.com/store/apps/details?id=com.maziturkiye.app` Türkiye'den açılıyor.
- [ ] **09:30** Play'den kurulan cihazda App Links doğrulandı: `adb shell pm get-app-links com.maziturkiye.app` → `verified`; WhatsApp'taki meydan okuma linki uygulamayı açıyor.
- [ ] **10:00** Linkleri güncelle: web landing Google Play rozeti, sosyal biyografiler, Reddit gönderilerine "Android sürümü çıktı" yorumu, iOS haberini yapan basına kısa takip e-postası (`press-release.md` → Google Play ‹tarih›).
- [ ] **11:00** Sosyal medya: "Android'de de yayında" gönderisi + yeni "bil bakalım" videosu.
- [ ] **11:30** Kapalı testçilere WhatsApp'tan teşekkür (`marketing/testers.md` listesi).
- [ ] **Gün boyu:** Android vitals, Play yorumları (`playstore_reviews`, `playstore_reply_review`; 48 saat içinde yanıt), PostHog, Supabase. Çökme artarsa Halt rollout.
- [ ] **22:00** `STATUS.md` ve `DECISIONS.md` güncellenir.
- [ ] **Üretim erişimi 3 Aralık'a yetişmezse:** Android duyurusu yapılmaz, tarih kaydırılır ve `DECISIONS.md`'ye yazılır; iOS akışı etkilenmez.
