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

## ⏳ Yarım kalanlar / canlıya alınmayı bekleyenler

1. **Canlıya yüklenmemiş backend değişiklikleri.** Ajanın Supabase MCP'si okuma ve `execute_sql` yapabiliyor; `apply_migration` ve deploy, Claude Code izin denetimi tarafından engellendi ("Production Deploy"). İki yol: kullanıcı ayarlara izin kuralı ekler, ya da elle uygular. Sırayla:
   - Migration: `20261104000700_cleanup.sql`, `20261104000800_nickname_filter.sql`, `20261104000900_duel_events.sql` (SQL Editor'de yapıştır → Run).
   - Edge function: `sync-pro` (yeni), `track-event` (yeni), `delete-account` (güncellendi): `supabase functions deploy <ad>` veya MCP `deploy_edge_function`.
   - Yeni secret'lar: `REVENUECAT_SECRET_KEY`, `POSTHOG_KEY`, `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID` (HUMAN_TODO 2, 8, 11).
2. **Fotoğraf hedefi ertelendi (kullanıcı kararı).** Canlıda 104 foto; pool-c2'den 35 foto `photo_candidates`'e `approved` olarak yazıldı, gece 03:30 ingest'inde Storage'a iner. 2. ve 3. tur seçimleri (`pipeline/selection/pool-a2.json`, `pool-b2.json`, `pool-a3.json`, `pool-b3.json`, toplam 72) repoda hazır, Supabase'e aktarılmadı. Aktarmak için: `node pipeline/export-approved.mjs <dosyalar> --out <dir>` → SQL'i `execute_sql` ile çalıştır. Toplu denetim: `node pipeline/check-selection.mjs pipeline/selection/*.json` (211 benzersiz).
3. **QA kodu tamam, cihazda denenmedi:** ekran okuyucu "İl seç" listesi, düellodan çıkış onayı + Android geri tuşu, arka planda kuyruğun iptali. Edge function'lar Deno olmadan sadece sözdizimi denetiminden geçti.

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
