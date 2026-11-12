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

## 📱 iOS / TestFlight (2026-11-12)

- App Store Connect: "Mazi Türkiye: Tarih Tahmini" (App ID 6833869544, takım 8D5577P5QU, bundle `com.maziturkiye.app`).
- iOS build 21 (1.0.0) TestFlight'ta; dahili grup "Team (Expo)", proje sahibi davet edildi.
- Kimlik: ASC API anahtarı `52FW696LZF` (issuer `fcbaa887-…`), `.p8` yalnız yerelde: `~/.appstoreconnect/private_keys/` (thaledox Mac hesabı). `eas.json` submit bu yolu kullanıyor.
- Sonraki iOS build: `cd app && EAS_NO_VCS=1 EXPO_NO_CAPABILITY_SYNC=1 EXPO_ASC_API_KEY_PATH=… EXPO_ASC_KEY_ID=52FW696LZF EXPO_ASC_ISSUER_ID=… EXPO_APPLE_TEAM_ID=8D5577P5QU eas build -p ios --profile production --non-interactive`, sonra `eas submit -p ios --profile production --id <build>`.
- Notlar: EAS'in yetenek senkronu Apple API değişikliği yüzünden "Sign in with Apple"da hata veriyor (yetenekler elle açıldı; `EXPO_NO_CAPABILITY_SYNC=1`). Kod adı ASCII (`Mazi Turkiye`), görünen ad "Mazi Türkiye". Bu Mac hesabında git push Yigityakut reposuna erişemiyor (gh girişi yok).

## ⏳ Yarım kalanlar (2026-11-07)

1. **Canlı backend tamam:** migration 0700–0900 ve `sync-pro`, `track-event`, `delete-account` deploy edildi; anonim giriş ve manual linking açıldı (canlıda doğrulandı).
2. **EAS:** `@rubygamestudios/mazi-turkiye`; production/preview/development env'leri girildi (Supabase URL/key, domain, destek e-postası, PostHog). Android production build #1 bitti (versionCode 2, AAB `~/Downloads/mazi-turkiye-2.aab`); Play'e ilk yükleme elle (Chrome aracı 10 MB sınırlı, servis hesabı anahtarı oluşturma izin denetimine takıldı). iOS build Apple kimlik bilgisi olmadığı için durdu.
3. **PostHog:** EU proje 338708 (boş projeydi, kullanıldı). Token EAS'te; `track-event` varsayılan olarak bu public token'ı kullanır. `POSTHOG_PERSONAL_API_KEY` yok: hesap silmede PostHog kişisi silinmez (secret-store yazımı ajana kapalı).
4. **Play Console:** uygulama oluşturuldu (app id 4974085984465631793), dahili test sürümü sayfası hazır; AAB sürüklenip bırakılacak.
5. **Fotoğraf:** 104 canlı + 35 onaylı (pool-c2); 72 seçim repoda, aktarılmadı (ertelendi).

**Bu oturumda canlıya alınanlar (2026-11-07):** Play dahili test sürümü 1.0.0 (2) yayında; Play `pro_lifetime` (5,99 $, 174 ülke) aktif; RevenueCat projesi a0ea7bc5: Play uygulaması, `pro` yetkisi, `default` teklifi ($rc_lifetime → pro_lifetime), Android SDK anahtarı EAS'te. Web Vercel'de (`maziturkiye.vercel.app`) ama *.vercel.app Türkiye'den erişilemiyor; web GitHub Pages'te yayında: https://yigityakut.github.io/maziturkiye/ (repo `Yigityakut/maziturkiye`, güncelleme: `node web/pages.mjs` → `dist-pages/` içeriğini o repoya push). `public_web_url` ve EAS `EXPO_PUBLIC_WEB_URL` bu adres.

**Kullanıcı kapıları:** satın alma doğrulaması için RevenueCat secret key → Supabase `REVENUECAT_SECRET_KEY` ve Play servis hesabı JSON → RevenueCat (gizli değer yazımı ajana kapalı). Alan adı alınmayacak (kullanıcı kararı).

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
