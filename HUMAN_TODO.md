# Senin yapman gerekenler (insan kapıları)

Ajan bunları hazırladı; kimlik, ödeme, telefon onayı veya hukuki onay gerektirdiği için senin elinden geçmesi gerekiyor.
Sıra önemlidir. Play hesabı 2019'da açıldı: 12 testçi × 14 gün kuralı uygulanmaz (2026-11-04). Kritik yol artık Apple hesabı + EAS build.

Durum işaretleri: `[ ]` bekliyor · `[x]` tamam. Bitirdiğin maddeyi işaretleyip commit'lemen yeterli; sonraki ajan buradan okur.

---

## ⚡ Tek seferlik erişim (2026-11-04) — bundan sonra ajan bunlarla her şeyi kendisi yapar

1. Supabase access token (supabase.com/dashboard/account/tokens) → `~/.config/mazi/env` içinde `SUPABASE_ACCESS_TOKEN`.
2. PostHog personal API key (All access) → aynı dosyada `POSTHOG_PERSONAL_API_KEY`.
3. App Store Connect API anahtarı (Admin): `.p8` dosyası `~/.config/mazi/` altına, Key ID ve Issuer ID aynı env dosyasına (`ASC_KEY_ID`, `ASC_ISSUER_ID`).
4. `.claude/settings.local.json` izin kuralları (Supabase MCP, supabase/eas CLI, api.supabase.com ve PostHog curl).
5. Chrome'da açık oturum: App Store Connect, Play Console, Google Cloud, Vercel, RevenueCat, PostHog.

Bu yapıldıktan sonra aşağıdaki Supabase, Expo, PostHog, RevenueCat, Play maddeleri ajanındır; kullanıcıya tekrar sorulmaz.

## 🔴 Bugün (en çok gecikme yaratanlar)

### 1. [ ] Supabase: tek bir SQL dosyasını çalıştır (1 dk)
Migration'ların hepsi canlıda, sadece **aylık temizlik işi** kaldı (silme ifadesi içerdiği için Supabase MCP senden onay istiyor, diyalog yanıtsız kaldı).
Dashboard → `timeguessr` → SQL Editor → `supabase/migrations/20261104000700_cleanup.sql` dosyasının içeriğini yapıştır → Run. Lansmandan önce zorunlu değil.

### 2. [ ] Supabase ayarları (5 dk)
Dashboard → `timeguessr` projesi:
- Authentication → Sign In / Providers → **Allow anonymous sign-ins: Açık**
- Authentication → Providers → **Apple**: Açık (Services ID ve anahtar Apple hesabı açılınca, madde 5)
- Authentication → Providers → **Google**: Açık (Web client ID + secret, madde 7)
- Authentication → **Manual linking**: Açık
- Edge Functions → Secrets: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `REVENUECAT_WEBHOOK_AUTH` (rastgele uzun bir değer); RevenueCat ve PostHog açılınca `REVENUECAT_SECRET_KEY` (madde 8), `POSTHOG_KEY`, `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID` (madde 11). İç çağrı anahtarı veritabanında otomatik üretildi; bir şey yapman gerekmiyor.

### 3. [x] Google Play geliştirici hesabı (mevcut, 2019)
https://play.google.com/console/signup — **Öneri: Bireysel hesap.** Şirket hesabı 12 testçi kuralından muaf ama D-U-N-S numarası gerektirir (2–4 hafta).
Eski (Kasım 2023 öncesi açılmış) bir hesabın varsa onu kullan; 12 testçi kuralı uygulanmaz.

### 4. [x] 12 kapalı testçi — gerekmiyor (hesap Kasım 2023 öncesi)
Davet metni ve talimat hazır: `marketing/testers.md`. Arkadaş, aile, Türk geliştirici toplulukları (ör. Teknoseyir, r/KGBTR'de değil — kurallar). Her testçinin **Gmail adresini** topla ve `marketing/testers.md`'deki listeye ekle (adresleri repoya yazmak istemezsen sadece sayıyı yaz).
Testçilerin **14 gün boyunca** testte kalması gerekir: uygulamayı kaldırmasınlar.

---

## 🟠 Bu hafta

### 5. [ ] Apple Developer Program (99 $/yıl)
https://developer.apple.com/programs/enroll/ — Bireysel kayıt (Apple ID + iki adımlı doğrulama + kimlik). Sonra:
- App Store Connect → Business → **Paid Apps sözleşmesi**, banka hesabı, vergi formu (**W-8BEN**; Türkiye–ABD vergi anlaşması yok, %30 kesinti satırı boş/otomatik).
- App Store Connect → Apps → **+ New App**: Platform iOS · Ad `Mazi Türkiye: Tarih Tahmini` · Birincil dil **Türkçe** · Bundle ID `com.maziturkiye.app` · SKU `mazi-turkiye-ios`.
- Team ID'yi `web/.well-known/apple-app-site-association` içindeki `APPLE_TEAM_ID` yerine yaz (veya ajana söyle).
- Sign in with Apple için: Certificates, Identifiers & Profiles → Services ID + Key oluştur → Supabase Apple provider'a gir.
- Aynı Sign in with Apple anahtarını (p8) hesap silmede Apple token iptali için Supabase Edge Functions → Secrets'a da gir: `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` (p8 dosyasının içeriği), `APPLE_CLIENT_ID` = `com.maziturkiye.app`.

### 6. [x] Expo hesabı ve EAS (ajan yaptı: @rubygamestudios/mazi-turkiye, projectId app.config.ts'de)
https://expo.dev → hesap (ücretsiz plan yeter). Terminalde (veya ajana erişim ver):
```bash
cd app && npx eas-cli@latest init
```
Çıkan **projectId**'yi EAS ortam değişkeni `EAS_PROJECT_ID` olarak gir. Diğer ortam değişkenleri: `app/README.md`.
Expo bağlantısında (MCP) App Store Connect API anahtarı ve Google service account JSON tanımlanınca ajan `build_run` / `build_submit` ile yükler.

### 7. [ ] Google Cloud (Google ile giriş)
console.cloud.google.com → yeni proje "Mazi Türkiye" → OAuth consent screen (External, uygulama adı, destek e-postası, gizlilik URL'si) → Credentials:
Web client (Supabase'e), iOS client (bundle ID), Android client (paket adı + Play imza SHA-1). Client ID'leri `EXPO_PUBLIC_GOOGLE_*` değişkenlerine.

### 8. [ ] RevenueCat
https://app.revenuecat.com → proje "Mazi Türkiye" → App Store ve Play uygulamalarını bağla → Entitlement `pro`, ürün `pro_lifetime` (detay: `store/iap.md`) → public SDK anahtarlarını `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY` olarak gir → Webhook URL'si ve Authorization başlığı (`store/iap.md`).
- RevenueCat → Project settings → API keys → **Secret API key (v1)** → Supabase Edge Functions → Secrets: `REVENUECAT_SECRET_KEY`. Satın alma/geri yüklemeden hemen sonra Pro'yu sunucuda açan `sync-pro` fonksiyonu ve hesap silmede RevenueCat abonesini silen `delete-account` bunu kullanır (yoksa Pro sadece webhook'la açılır, silmede RevenueCat adımı atlanır).

### 9. [ ] Alan adı + proje e-postası
- `maziturkiye.com` müsait mi kontrol et ve al (ajan konteynerden kontrol edemedi). Alınamazsa: `mazituerkiye.com`, `maziturkiye.app`, `mazi.com.tr` (.com.tr belge ister).
- `destek@maziturkiye.com` adresi (ör. Zoho Mail ücretsiz, Cloudflare Email Routing ile Gmail'e yönlendirme veya Google Workspace).
- Vercel'e `web/` klasörünü bağla (Root Directory: `web`, framework: Other) → alan adını ekle.

### 10. [x] Telegram bot — İPTAL (kullanıcı kararı; kod token yoksa sessizce atlıyor)
@BotFather → `/newbot` → Ad: **Mazi Türkiye Admin** · Kullanıcı adı önerisi: `maziturkiye_admin_bot` → token'ı Supabase secret `TELEGRAM_BOT_TOKEN`'a.
Bota bir mesaj at, sonra `https://api.telegram.org/bot<TOKEN>/getUpdates` adresinden `chat.id`'yi alıp `TELEGRAM_ADMIN_CHAT_ID`'ye yaz.
Admin hesabın: uygulamaya Apple ile giriş yap, Ayarlar'ın altındaki kimliği ajana ver (ajan `is_admin = true` yapar).

### 11. [ ] PostHog
EU bölgesinde proje aç (KVKK için) → Project API key'i `EXPO_PUBLIC_POSTHOG_KEY`'e.
Supabase Edge Functions → Secrets (girilmezse ilgili adım sessizce atlanır):
- `POSTHOG_KEY` = aynı Project API key (phc_…): `duel_matched` olayı rakip türüyle sunucudan gider (`track-event`).
- `POSTHOG_PERSONAL_API_KEY` (PostHog → Settings → Personal API keys, kapsam **person:write**) ve `POSTHOG_PROJECT_ID` (proje ayarlarındaki sayı): hesap silinince PostHog kişisi ve olayları silinir (`delete-account`).
- Proje US bölgesindeyse ayrıca `POSTHOG_HOST=https://us.i.posthog.com` ve `POSTHOG_API_HOST=https://us.posthog.com`. Mevcut projen US ise gizlilik metnindeki bölge satırını güncelle.

### 12. [ ] Sosyal medya hesapları
Kullanıcı adları, biyografi, profil görseli hazır: `marketing/social/profiles.md`. Instagram, TikTok, X, YouTube'da `@maziturkiye` (yoksa `@mazi.turkiye`, `@maziturkiyeapp`). Telefon/e-posta doğrulaması sende.

---

## 🟢 Lansmandan önce

### 13. [ ] Yasal metin onayı
`web/gizlilik`, `web/kvkk`, `web/kosullar`: sarı işaretli yer tutucuları doldur (veri sorumlusunun adı/unvanı, adres, PostHog bölgesi). **Bir avukata göstermen önerilir.**
KVKK: yurt dışına aktarım için sağlayıcılarla (Supabase, PostHog, RevenueCat, Expo) **standart sözleşme** imzalanıp 5 iş günü içinde Kurul'a bildirilmesi gerekir. VERBİS kaydı: yıllık çalışan sayısı 50'den az ve bilanço 100 milyon TL altındaysa muafsın (özel nitelikli veri işlenmiyor).

### 14. [ ] Marka araması
https://www.turkpatent.gov.tr → Marka araştırma → "MAZİ TÜRKİYE" ve "MAZİ", sınıf **9** (yazılım) ve **41** (eğlence/oyun). Sonucu `DECISIONS.md`'ye yaz. Tescil başvurusu isteğe bağlı (ücretli).

### 15. [ ] ASO doğrulama (15 dk, Chrome)
App Store ve Google Play'de (Türkiye) arama kutusuna `tarih`, `eski fotoğraf`, `harita oyunu`, `bilgi yarışması` yazıp otomatik tamamlama önerilerini `store/keywords.md`'ye ekle.

### 16. [ ] Gerçek cihaz testi
TestFlight ve Play internal track'te: `store/release-checklist.md` → "Gönderim öncesi kontrol listesi".

### 17. [ ] SALT Araştırma izni (isteğe bağlı)
Taslak e-posta: `marketing/outreach/salt-izin.md`. Gönderirsen cevabı `DECISIONS.md`'ye yaz.
