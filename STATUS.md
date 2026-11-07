# Durum — devir notu

_Son güncelleme: 2026-11-04 (yerel oturum 1)_

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

## ⏳ Yarım kalanlar (2026-11-07)

1. **Canlı backend tamam:** migration 0700–0900 ve `sync-pro`, `track-event`, `delete-account` deploy edildi; anonim giriş ve manual linking açıldı (canlıda doğrulandı).
2. **EAS:** `@rubygamestudios/mazi-turkiye`; production/preview/development env'leri girildi (Supabase URL/key, domain, destek e-postası, PostHog). Android production build #1 kuyrukta (versionCode 2). iOS build Apple kimlik bilgisi olmadığı için durdu.
3. **PostHog:** EU proje 338708 (boş projeydi, kullanıldı). Token EAS'te; `track-event` varsayılan olarak bu public token'ı kullanır. `POSTHOG_PERSONAL_API_KEY` yok: hesap silmede PostHog kişisi silinmez (secret-store yazımı ajana kapalı).
4. **Play Console:** "Mazi Türkiye: Tarih Tahmini" formu dolduruldu (Oyun, Ücretsiz, tr-TR); iki beyan kutusu + "Create app" kullanıcının (yasal onay). Sonra ilk AAB elle (Chrome) yüklenecek.
5. **Fotoğraf:** 104 canlı + 35 onaylı (pool-c2); 72 seçim repoda, aktarılmadı (ertelendi).

**Kullanıcı kapıları (tek seferlik):** Play beyan kutuları; App Store Connect'e Chrome'da giriş; RevenueCat ve Vercel'e Chrome'da giriş; alan adı satın alma onayı (maziturkiye.com müsait).

## Bu oturumda biten

- Bağımlılıklar kuruldu; `tsc` temiz, SQL testleri **62/62**.
- QA raporundaki tüm kod maddeleri ✅ (`store/qa-report.md`); Y4, Y5, O6 insan işi.
- Mağaza ekran görüntüleri 6 gerçek canlı fotoğrafla (`store/screenshots/out/`); künyeler `captions.md`'de. Feature graphic'teki CC BY-SA fotoğrafın künyesi Play açıklamasına eklenmeli.
- İlk 3 "Bil bakalım" videosu: `marketing/videos/` (README'de künye ve paylaşım metinleri). Bitiş kartı 24 Kasım öncesi metni içeriyor.

## Sıradaki adımlar (öncelik sırasıyla)

1. Yukarıdaki 1. madde: migration ve function'ları canlıya al.
2. İnsan kapıları (`HUMAN_TODO.md`): Apple (Play hesabı mevcut, 12 testçi kuralı yok), `eas init`, ortam değişkenleri.
3. Build: `npx eas-cli build -p all --profile production`; TestFlight ve Play kapalı test; cihazda QA (`store/release-checklist.md`).
4. Vercel'e `web/` deploy; alan adı; Apple Team ID ve Play SHA-256'yı `web/.well-known/` dosyalarına yaz; AASA'yı `curl` ile doğrula.
5. Play açıklamasına feature graphic fotoğraf künyesi.
6. (Ertelendi) Fotoğraf havuzunu 200'e tamamlama: 72 hazır seçimi aktar; açık dönemler 1920–1979.

## Engeller

- Bulut konteynerinde ağ kısıtlıydı: Wikimedia, Supabase API ve mağaza siteleri erişilemiyordu. Bu yüzden bazı işler GitHub Actions ve Supabase MCP üzerinden yapıldı. Yerelde bu kısıt yok; `pipeline/harvest.mjs` doğrudan çalıştırılabilir: `node pipeline/harvest.mjs pipeline/jobs/<iş>.json`, önce `npm install --prefix pipeline`.
- Hesaplar (Apple, Google Play, Expo, RevenueCat, PostHog, Telegram, alan adı, sosyal medya) → `HUMAN_TODO.md`.

## Faydalı komutlar

```bash
cd app && npm install && npx expo start                  # uygulama
cd app && npx tsc --noEmit                               # tip kontrolü
cd supabase/tests && npm install && npm test             # SQL testleri (62 senaryo)
python3 store/check_lengths.py                           # mağaza metni karakter sınırları
node marketing/templates/make-video.mjs <spec.json>      # video projesi üret, sonra: npx hyperframes@0.9.10 render
```
