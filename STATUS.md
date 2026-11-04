# Durum — devir notu

_Son güncelleme: 2026-11-04 (bulut oturumu 1 sona erdi; yerel oturum buradan devam eder)_

> **Yeni oturum için başlangıç sırası:** bu dosya → `HUMAN_TODO.md` → `DECISIONS.md` → aşağıdaki "Sıradaki adımlar".
> Plan: `Plan.md`. Tüm metinler Türkçe. Dal: `claude/dreamy-hawking-i1vot8`.

## ✅ Biten

| Alan | Ne var | Nerede |
| --- | --- | --- |
| İsim ve marka | **Mazi Türkiye**; ikon, adaptive ikon, splash, bildirim ikonu, OG ve kapak görselleri | `store/brand/`, `app/assets/`, `marketing/social/`, `web/assets/og.png` |
| Uygulama | Expo SDK 58; Plan 5.3'teki tüm ekranlar; gömülü SVG Türkiye haritası; demo modu (`EXPO_PUBLIC_DEMO=1`, ekran görüntüleri için). `npx tsc --noEmit` temiz, web export çalışıyor | `app/` (kurulum: `app/README.md`) |
| Backend (**canlı**) | Supabase `timeguessr` (Frankfurt): migration'lar 0100–0650 uygulandı; 7 edge function deploy edildi; pg_cron işleri kurulu; iç çağrı zinciri test edildi (DB → pg_net → function) | `supabase/` |
| SQL testleri | PGlite ile 60/60 senaryo testi | `cd supabase/tests && npm install && npm test` |
| Fotoğraf hattı | GitHub Actions'ta aday toplama (`pipeline/jobs/*.json` push'lanınca çalışır), inceleme panoları, onay/aktarım betikleri | `pipeline/`, `.github/workflows/pipeline.yml`, `pipeline/REVIEW_GUIDE.md` |
| Fotoğraflar (**canlı**) | 104 fotoğraf onaylandı; 84'ü Storage'a yüklendi (40 günlük, 36 1v1, 8 bonus); 5 gün programlandı (14–18 Kasım) | `pipeline/selection/pool-a.json`, `pool-bc.json` |
| Web | Landing (bekleme listesi), gizlilik TR/EN, KVKK, koşullar, kaynaklar, destek/SSS, hesap silme, meydan okuma `/m/KOD`, admin `/d/token`, basın kiti, `.well-known`, `vercel.json` | `web/` |
| Mağaza | TR/EN metinler (sınırlar kontrol edildi), anahtar kelimeler, inceleme notu, App Privacy ve Data safety cevapları, yaş anketi, IAP, uygulama içi etkinlikler, adım adım yayın kontrol listesi, QA raporu | `store/` |
| Ekran görüntüleri | Hattı hazır: demo modu, render betiği, CI. Şu anki PNG'ler **TASLAK** (yer tutucu fotoğraflı) | `store/screenshots/`, `.github/workflows/screenshots.yml` |
| Pazarlama | İçerik takvimi, açıklama şablonları, e-postalar, profiller, testçi kiti, basın bülteni, Reddit, mikro hesap mesajı, SALT izin e-postası, HyperFrames "Bil bakalım" şablonu (render test edildi) | `marketing/` |

## ⏳ Yarım kalanlar (bulut oturumu kapanırken durduruldu)

1. **20 onaylı fotoğraf henüz Storage'a inmedi** (`photo_candidates.status = 'approved'`). Supabase SQL Editor'de şunu çalıştır:
   `select private.call_function('pipeline-ingest', '{"limit":60}'::jsonb, 30000);`
   Ya da bekle: her gece 03:30'da (TSİ) kendiliğinden çalışır.
2. **2. tur fotoğraf incelemesi yarıda kaldı.** Panolar hazır ama seçim dosyası yazılmadı:
   - `pipeline/review/pool-a2`, `pool-a2-needgeo`, `pool-b2`, `pool-b2-needgeo` (1880–1999)
   - `pipeline/review/pool-c2` (2000+, il bazlı; eksik bölgeler için önemli)
3. **3. tur hasat bitti, hiç incelenmedi:** `pipeline/review/pool-a3*`, `pool-b3*` (on yıl kategorileri, düzeltilmiş yıl ve il kuralları).
4. **Uygulama QA düzeltmeleri kısmen yapıldı.** Durum işaretleri `store/qa-report.md`'de (✅ düzeltildi / 🟡 kısmen / ⏳ bekliyor). En önemli açıklar: Pro'nun sunucuyla eşitlenmesi (`sync-pro` edge function önerisi, Y1) ve 🟡/⏳ ile işaretli maddeler. Durdurulmadan önce `tsc` temizdi.
5. **Aylık temizlik migration'ı** (`supabase/migrations/20261104000700_cleanup.sql`) canlıya uygulanmadı. Silme ifadesi içerdiği için Supabase onay istiyor. SQL Editor'de elle çalıştır.
6. **Gerçek ekran görüntüleri:** `store/screenshots/fixtures.json`'a 6 gerçek fotoğrafın `commons_url`'ünü ve metadatasını yaz, sonra push et; CI render alıp commit'ler. Yerelde: `store/screenshots/render.mjs` ve `prepare.mjs` başındaki talimatlar.

## Sıradaki adımlar (öncelik sırasıyla)

1. Yukarıdaki 1. ve 2. maddeler: kalan ingest + 2. ve 3. tur inceleme.
   Hedef ≥200 fotoğraf, Plan 3.2 dağılımı. Şu an eksikler: 1920–1979; Karadeniz, Doğu ve Güneydoğu Anadolu.
   - Yöntem: `node pipeline/show.mjs <set> <id>…` ile meta veriyi oku, `pipeline/selection/<set>.json`'a yaz, `node pipeline/approve.mjs` ile doğrula.
   - Supabase'e aktar: `node pipeline/export-approved.mjs pipeline/selection/<set>.json --out <dir>` ile üretilen SQL'i çalıştır, sonra 1. maddedeki ingest çağrısını yap.
   - Yerelde Supabase'e doğrudan erişebilirsin: Supabase CLI veya Dashboard SQL Editor.
2. Kalan QA düzeltmeleri (`store/qa-report.md`, ⏳ ve 🟡 maddeler).
3. Gerçek fotoğraflarla mağaza ekran görüntüleri; ilk 3 "bil bakalım" videosu (bonus havuzundan, `marketing/templates/make-video.mjs`).
4. İnsan kapıları açıldıkça (`HUMAN_TODO.md`):
   - `eas init` ve ortam değişkenleri.
   - iOS ve Android build: `npx eas-cli build -p all --profile production`.
   - TestFlight; Play kapalı test (**en geç 17 Kasım**, 12 testçi).
5. Vercel'e `web/` deploy; alan adı; Apple Team ID ve Play SHA-256 değerlerini `web/.well-known/` dosyalarına yaz.

## Engeller

- Bulut konteynerinde ağ kısıtlıydı: Wikimedia, Supabase API ve mağaza siteleri erişilemiyordu. Bu yüzden bazı işler GitHub Actions ve Supabase MCP üzerinden yapıldı. Yerelde bu kısıt yok; `pipeline/harvest.mjs` doğrudan çalıştırılabilir: `node pipeline/harvest.mjs pipeline/jobs/<iş>.json`, önce `npm install --prefix pipeline`.
- Hesaplar (Apple, Google Play, Expo, RevenueCat, PostHog, Telegram, alan adı, sosyal medya) → `HUMAN_TODO.md`.

## Faydalı komutlar

```bash
cd app && npm install && npx expo start                  # uygulama
cd app && npx tsc --noEmit                               # tip kontrolü
cd supabase/tests && npm install && npm test             # SQL testleri (60 senaryo)
python3 store/check_lengths.py                           # mağaza metni karakter sınırları
node marketing/templates/make-video.mjs <spec.json>      # video projesi üret, sonra: npx hyperframes@0.9.10 render
```
