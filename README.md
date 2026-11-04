# Mazi Türkiye

Türkiye'ye özel günlük fotoğraf tahmin oyunu. Oyuncu her gün Türkiye'de çekilmiş 5 gerçek fotoğraf görür, Türkiye haritasına iğne bırakır ve fotoğrafın hangi yıl çekildiğini tahmin eder. Fotoğraf başına en çok 1.000 puan (500 konum + 500 yıl), gün başına 5.000 puan. Gün her sabah 04:00'te (Türkiye saati) yenilenir.

Oyunun çevresinde şunlar var: WhatsApp ile arkadaşa meydan okuma linki, canlı 1v1 (rakip bulunamazsa yapay zekâ rakip), günlük ve haftalık sıralama, istatistik ve tek seferlik **Pro** (5,99 $, `pro_lifetime`). Lansmanda reklam yok.

- **Mağaza adı:** Mazi Türkiye: Tarih Tahmini
- **Bundle ID / paket adı:** `com.maziturkiye.app` · **URL şeması:** `maziturkiye://` · **Alan adı:** `maziturkiye.com`
- **Hedef tarihler:** iOS 24 Kasım 2026 (salı), Android 3 Aralık 2026 (perşembe). Android'in 14 günlük kapalı testi en geç 17 Kasım'da başlamalı.

> Ürün kararlarının tamamı `Plan.md` dosyasında (Türkçe). Bölüm 1'deki kararlar değiştirilemez.

---

## Nereden başlamalı?

Bu proje birden çok ajan oturumunda ilerliyor. Yeni gelen (insan ya da ajan) şu sırayla okur:

| Dosya | Ne işe yarar |
| --- | --- |
| [`STATUS.md`](STATUS.md) | Son durum: biten işler, yarım işler, sıradaki 5 adım, engeller. **İlk buraya bak.** |
| [`DECISIONS.md`](DECISIONS.md) | Karar kaydı (`tarih · karar · gerekçe`). Bir soruyu yeniden açmadan önce burada var mı bak. |
| [`HUMAN_TODO.md`](HUMAN_TODO.md) | Sadece insanın yapabileceği işler (hesaplar, ödemeler, kimlik doğrulama, testçiler, yasal onay). |
| [`Plan.md`](Plan.md) | Uçtan uca proje planı: oyun tasarımı, mimari, yasal, mağaza, ASO, pazarlama, KPI. |
| [`store/release-checklist.md`](store/release-checklist.md) | App Store ve Google Play yükleme kontrol listesi ve lansman günü akışı. |
| [`store/qa-report.md`](store/qa-report.md) | Son QA raporu: otomatik kontroller ve önem sırasına göre bulgular. |

**Çalışma kuralları (Plan, Bölüm 0):** Her karar `DECISIONS.md`'ye tek satırla yazılır. Her oturumun sonunda `STATUS.md` güncellenir. Şifre, API anahtarı ve token **asla** repoya yazılmaz: EAS ortam değişkenleri, Supabase secrets veya yerel `.env` kullanılır (`.env` ve `.env.*` `.gitignore`'da).

---

## Repo düzeni

```
/app            Expo uygulaması (iOS + Android + web önizleme)
/supabase       Postgres migration'ları, Edge Function'lar, SQL testleri
/pipeline       Fotoğraf toplama ve doğrulama scriptleri (GitHub Actions)
/web            Statik site: landing, yasal sayfalar, meydan okuma ve admin link sayfaları
/marketing      HyperFrames video şablonları, sosyal medya ve lansman metinleri, testçi daveti
/store          Mağaza metinleri, ASO, IAP, veri formları, yaş derecelendirmesi, inceleme notu, marka görselleri
/.github        pipeline.yml (fotoğraf hattı iş akışı)
STATUS.md  DECISIONS.md  HUMAN_TODO.md  Plan.md
```

### `/app` — mobil uygulama

Expo SDK 58, Expo Router (`app/src/app/` altında her dosya bir ekran), TypeScript. Harita uygulamaya gömülü SVG (Natural Earth, kamu malı) olduğu için çevrimdışı çalışır ve üçüncü taraf harita servisine bağlı değildir. Sunucu mantığının tamamı Supabase RPC'lerinde; istemci doğru cevabı tahminden önce asla almaz.

| Klasör | İçerik |
| --- | --- |
| `app/src/app/` | Ekranlar: `index` (ana ekran), `onboarding`, `play`, `summary`, `duel/`, `leaderboard`, `stats`, `archive`, `pro`, `settings`, `sources`, `challenge/[code]`, `code`, `m/[code]` (meydan okuma evrensel linki), `d/[token]` (admin Telegram linki) |
| `app/src/components/` | `TurkeyMap` (SVG harita, pinch-zoom), `YearSlider`, `Photo` (tam ekran yakınlaştırma), `Reveal` (açılım + atıf), `CountUp`, ortak UI |
| `app/src/lib/` | `api.ts` (RPC'ler), `supabase.ts` (anonim oturum), `auth.ts` (Apple/Google + hesap birleştirme), `purchases.ts` (RevenueCat), `analytics.ts` (PostHog), `notifications.ts` (yerel hatırlatıcı + push token), `config.ts`, `theme.ts`, `demo.ts` (mağaza ekran görüntüsü modu) |
| `app/app.config.ts` | Dinamik Expo yapılandırması; anahtarlar ortam değişkenlerinden gelir |
| `app/eas.json` | EAS build/submit profilleri: `development`, `preview`, `production` |

**Çalıştırma, ortam değişkenleri, build, mağazaya gönderim, OTA ve evrensel linkler:** [`app/README.md`](app/README.md).

Kısaca:

```bash
cd app
npm install
npx expo start                 # geliştirme sunucusu
npx tsc --noEmit               # tip kontrolü
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest submit -p ios --profile production --latest
npx eas-cli@latest update --channel production --environment production --message "…"
```

### `/supabase` — arka uç

Proje: `timeguessr` (ref `ybhiddgwunzyquzrbzaf`, **eu-central-1 Frankfurt**, KVKK için AB bölgesi). Postgres + Auth (anonim, Apple, Google) + Storage + Realtime + pg_cron + pg_net.

**Migration'lar** (`supabase/migrations/`, sırayla uygulanır):

| Dosya | İçerik |
| --- | --- |
| `…0100_core.sql` | Tablolar, puanlama fonksiyonları, RLS |
| `…0200_game.sql` | Günlük oyun RPC'leri (`get_me`, `get_day`, `submit_guess`, `use_hint`, `leaderboard`, `create_challenge`, `update_profile`, birleştirme bileti…) |
| `…0300_duel.sql` | 1v1 eşleşme, düello durumu, bot, admin bildirimi, `duel-tick` ve `daily-ops` cron işleri |
| `…0400_seed_geo_storage.sql` | İl/bölge verisi, Storage bucket'ları |
| `…0500_pipeline.sql` | Fotoğraf hattı tabloları, Edge Function'ları SQL'den çağıran `private.call_function`, haftalık/günlük cron işleri |
| `…0600_web.sql` | Web sayfalarının kullandığı herkese açık RPC'ler |
| `…0700_cleanup.sql` | Aylık temizlik işi |

Uygulama yolları (biri yeterli):

```bash
# Supabase CLI ile
npx supabase@latest login
npx supabase@latest link --project-ref ybhiddgwunzyquzrbzaf
npx supabase@latest db push            # supabase/migrations altındaki uygulanmamış dosyalar
```

veya Dashboard → SQL Editor'de dosyaları sırayla çalıştırmak (bkz. `HUMAN_TODO.md` madde 1).

**Edge Function'lar** (`supabase/functions/`, Deno):

| Fonksiyon | Kim çağırır | Ne yapar |
| --- | --- | --- |
| `delete-account` | Uygulama (kullanıcının JWT'si ile) | Kullanıcıyı ve bağlı tüm satırları siler |
| `revenuecat-webhook` | RevenueCat | `pro_lifetime` satın alma/iade → `profiles.is_pro` |
| `notify-admin` | pg_net (`x-internal-secret`) | 1v1'de 60. saniyede admin'e Telegram mesajı |
| `push-notify` | pg_cron (`x-internal-secret`) | Expo Push ile "seri tehlikede" bildirimi (23:00 TSİ) |
| `pipeline-harvest` | pg_cron (haftalık) | Wikimedia Commons'tan aday fotoğraf toplama |
| `pipeline-ingest` | pg_cron (günlük) | Onaylı fotoğrafları Storage'a yükleme ve programlama |
| `weekly-report` | pg_cron (pazartesi) | Haftalık KPI raporu (Telegram) |

```bash
# Kullanıcı JWT'si ile çağrılan fonksiyon: JWT doğrulaması açık kalır
npx supabase@latest functions deploy delete-account --project-ref ybhiddgwunzyquzrbzaf

# RevenueCat ve pg_net Authorization başlığı göndermez: JWT doğrulaması kapalı, kendi kontrollerini yaparlar
for f in revenuecat-webhook notify-admin push-notify pipeline-harvest pipeline-ingest weekly-report; do
  npx supabase@latest functions deploy "$f" --no-verify-jwt --project-ref ybhiddgwunzyquzrbzaf
done

# Gizli değerler (değerleri repoya yazma)
npx supabase@latest secrets set --project-ref ybhiddgwunzyquzrbzaf \
  TELEGRAM_BOT_TOKEN=… TELEGRAM_ADMIN_CHAT_ID=… REVENUECAT_WEBHOOK_AUTH=… INTERNAL_SECRET=…
```

`private.secrets` tablosunda `functions_url` (`https://ybhiddgwunzyquzrbzaf.supabase.co/functions/v1`) ve `internal_secret` bulunmalıdır; yoksa cron'dan fonksiyon çağrıları sessizce atlanır.

**Zamanlanmış işler (pg_cron, UTC):** `daily-ops` 01:00 (04:00 TSİ gün dönüşü kontrolü ve 14 günlük program uyarısı) · `duel-tick` 5 sn · `pipeline-ingest-daily` 00:30 · `pipeline-harvest-weekly` pazartesi 00:00 · `streak-danger` 20:00 (23:00 TSİ) · `weekly-report` pazartesi 06:00 · `monthly-cleanup` ayın 1'i 02:00. Gün sınırı SQL'de hesaplanır (`(now() at time zone 'Europe/Istanbul' - 4 saat)::date`), cron sadece programı doldurur.

**Dashboard ayarları** (bir kez): Authentication → **Allow anonymous sign-ins: açık** (kapalıysa uygulama hiçbir veriyi yükleyemez), Apple ve Google sağlayıcıları, Manual linking. Ayrıntı: `HUMAN_TODO.md` madde 2 ve `app/README.md`.

**SQL testleri:** `supabase/tests/` (PGlite ile yerel Postgres; `cd supabase/tests && npm install && npm test`).

### `/pipeline` — fotoğraf hattı

Lisans kuralı (Plan, Bölüm 3.1): sadece kamu malı, CC0, CC BY, CC BY-SA. NC/ND lisanslı hiçbir fotoğraf alınmaz; rakip oyunların fotoğrafları kullanılmaz.

- `pipeline/harvest.mjs`: aday toplama + otomatik eleme (lisans, çözünürlük, tarih, Türkiye sınırı) + inceleme panoları.
- `pipeline/jobs/*.json`: iş dosyaları. Yeni bir iş dosyası push'lanınca `.github/workflows/pipeline.yml` çalışır, sonuçları (`pipeline/data/*.candidates.jsonl`, `pipeline/review/<iş>/sheet-NN.jpg`) aynı dala geri yazar. Elle: Actions → photo-pipeline → Run workflow.
- Yerelde: `npm install --prefix pipeline && node pipeline/harvest.mjs pipeline/jobs/pool-a.json` (Wikimedia'ya erişim gerekir).
- `pipeline/geo/`: harita verisinin üretimi (Natural Earth 1:10m). Çıktılar `app/src/data/turkeyMap.json` ve `supabase/functions/_shared/geo.json`. Ayrıntı: `pipeline/geo/README.md`.
- Lansmandan sonra aynı kurallar sunucuda haftalık çalışır (`pipeline-harvest`, `pipeline-ingest`). Hedef: haftada en az 50 yeni fotoğraf, program her zaman 14 gün ileride.

### `/web` — statik site

Bağımlılıksız HTML/CSS; build adımı yok. Vercel'de yayınlanır (Root Directory: `web`, Framework: Other). Alan adı alınana kadar `maziturkiye.vercel.app`.

| Yol | Sayfa |
| --- | --- |
| `/` | Landing (TR), `/en/` İngilizce |
| `/gizlilik/`, `/kvkk/`, `/kosullar/` | Gizlilik politikası, KVKK aydınlatma metni, kullanım koşulları (sarı yer tutucular insan onayı bekler) |
| `/kaynaklar/` | Fotoğraf atıfları ve lisanslar |
| `/destek/`, `/hesap-silme/` | Destek ve hesap silme talebi (Google Play zorunlu kılar) |
| `/m/<KOD>` | Meydan okuma linki: app yüklüyse evrensel link ile açılır, değilse 6 haneli kodu gösterir |
| `/d/<token>` | Admin'in Telegram linki (1v1'e katılma) |
| `/.well-known/apple-app-site-association`, `/.well-known/assetlinks.json` | Evrensel link / App Links doğrulaması (`APPLE_TEAM_ID` ve `PLAY_APP_SIGNING_SHA256_FINGERPRINT` yer tutucuları doldurulmalı) |

Yerelde önizleme: `npx serve web` (veya `python3 -m http.server -d web 8080`). Yayın: Vercel'e bağlı dala push. `web/vercel.json` rewrite ve başlıkları tanımlar; AASA dosyasının yönlendirmesiz ve `application/json` ile döndüğünü yayından sonra mutlaka kontrol et (bkz. `store/qa-report.md`).

### `/marketing` — pazarlama

| Yol | İçerik |
| --- | --- |
| `marketing/templates/bil-bakalim/` | HyperFrames "Bil bakalım" dikey video şablonu (1080×1920) |
| `marketing/templates/make-video.mjs` | Bir fotoğraf kaydından render'a hazır proje üretir: `node marketing/templates/make-video.mjs <video.json>` → `npx hyperframes@0.9.10 check && npx hyperframes@0.9.10 render` (Node 22+ ve FFmpeg gerekir) |
| `marketing/outreach/` | Basın bülteni, Reddit gönderileri, mikro hesap iş birliği mesajı, SALT izin e-postası |
| `marketing/social/profiles.md` | Sosyal medya kullanıcı adları, biyografiler, atıf kalıbı |
| `marketing/testers.md` | Google Play kapalı testi: 12 testçi × 14 gün davet metni ve takip tablosu |

Kurallar: Günün gerçek fotoğrafları asla paylaşılmaz. Yapay zekâyla "eski" görüntü üretilmez. Her gönderide fotoğraf atfı yer alır. Sahte sayı, sahte yorum, satın alınmış takipçi yok.

### `/store` — mağaza

| Dosya | İçerik |
| --- | --- |
| `listing.tr.md`, `listing.en.md` | App Store ve Google Play metinleri (karakter sınırları `python3 store/check_lengths.py` ile kontrol edilir) |
| `keywords.md` | Anahtar kelime araştırması (ASO) |
| `iap.md` | `pro_lifetime` ürünü ve RevenueCat yapılandırması |
| `privacy-forms.md` | Apple App Privacy ve Google Data safety cevapları |
| `age-rating.md` | Apple yaş derecelendirmesi ve IARC anketi cevapları |
| `review-notes.md` | App Review notu (İngilizce) |
| `brand/` | İkon (`icon-1024.png`, `icon.svg`) ve marka görselleri |
| `screenshots/` | Mağaza ekran görüntüleri (uygulamanın demo modu ile üretilir; çıktı `store/screenshots/out/`) |
| `release-checklist.md` | Yükleme ve lansman kontrol listesi |
| `qa-report.md` | QA raporu |

---

## Üçüncü taraf servisler

| Servis | Ne için | Anahtar nerede |
| --- | --- | --- |
| Supabase | Veritabanı, giriş, depolama, realtime, cron | Uygulama: publishable key (EAS env). Sunucu: Supabase secrets |
| Expo / EAS | Build, mağazaya gönderim, OTA, push | EAS ortam değişkenleri ve credentials |
| RevenueCat | `pro_lifetime` satın alma ve geri yükleme | Public SDK anahtarları (EAS env), webhook yetkisi (Supabase secret) |
| PostHog (EU) | Analitik (Plan 10.2 olay listesi) | Project API key (EAS env) |
| Google Cloud | Google ile giriş (OAuth istemcileri) | Client ID'ler (EAS env), secret Supabase Google sağlayıcısında |
| Apple Developer | Sign in with Apple, App Store | Services ID + key Supabase Apple sağlayıcısında |
| Telegram Bot API | Admin bildirimi ve haftalık rapor | Supabase secrets |
| Vercel | Web sitesi | Vercel hesabı |
