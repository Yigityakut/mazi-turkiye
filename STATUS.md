# Durum

_Son güncelleme: 2026-11-04 (oturum 1 — Faz 1: mağazaya yüklemeye hazırlık)_

## Biten
- **İsim:** Mazi Türkiye (DECISIONS.md). İkon, adaptive ikon, splash, bildirim ikonu: `store/brand/`, `app/assets/`.
- **Uygulama (Expo SDK 58, `app/`):** tüm Plan 5.3 ekranları — karşılama (3 adım + meydan okuma kodu), ana ekran (seri, bugünün kartı, geri sayım, 1v1, meydan okuma), oyun (fotoğraf + gömülü SVG Türkiye haritası + yıl kaydırıcısı + Pro ipuçları), açılım (çizgi animasyonu, yıl sayacı, puan sayacı, hikaye, atıf, "Bu bilgi yanlış mı?", fotoğrafı tekrar aç), gün özeti (paylaşım, meydan okuma, sıralama, bildirim izni, puan isteme), 1v1 arama/maç/sonuç, sıralama, arşiv, istatistik, Pro, ayarlar (hesap silme, Apple/Google giriş, hatırlatıcı saati), kaynaklar. `tsc` temiz, web export çalışıyor.
- **Backend (`supabase/`):** 7 migration (şema, puanlama, gün dönüşü, seri, meydan okuma, sıralama, 1v1 + bot + admin bildirimi, program, hat, bekleme listesi, temizlik), 7 edge function (notify-admin, delete-account, revenuecat-webhook, push-notify, weekly-report, pipeline-harvest, pipeline-ingest). Sadece `core` migration'ı canlıda.
- **Fotoğraf hattı:** `pipeline/harvest.mjs` + GitHub Actions (`pipeline.yml`), lisans/yıl/konum/içerik filtreleri, Türkiye sınır testi, yıl başına kota, inceleme panoları.
- **Web (`web/`):** landing (bekleme listesi), gizlilik (TR+EN), KVKK, koşullar (bot maddesi dahil), kaynaklar (canlı liste), destek/SSS, hesap silme, meydan okuma sayfası (`/m/KOD`), admin linki (`/d/token`), `.well-known` dosyaları, `vercel.json`.
- **Mağaza (`store/`):** TR/EN metinler (karakter sınırları kontrol edildi), anahtar kelimeler, inceleme notu, App Privacy + Data safety cevapları, yaş anketi, IAP tanımı.
- **Pazarlama (`marketing/`):** profiller, testçi kiti, basın bülteni, Reddit, mikro hesap mesajı, SALT izin e-postası, HyperFrames "Bil bakalım" video şablonu (render test edildi).

## Yarım / sürüyor
- Fotoğraf adayları GitHub Actions'ta toplanıyor → panolar incelenecek → ~200 fotoğraf seçilip hikayeleri yazılacak → Supabase'e yüklenecek.
- Alt ajanlar: mağaza ekran görüntüsü hattı (demo modu + render + CI), pazarlama takvimi/görselleri/basın kiti, SQL migration testleri (PGlite), yayın belgeleri + QA raporu.
- Migration'lar canlıya uygulanmadı (Supabase onay sorusu yanıtsız kaldı) → HUMAN_TODO #1.

## Sıradaki 5 adım
1. SQL testleri yeşil olunca kalan migration'ları uygula; edge function'ları deploy et.
2. Fotoğraf panolarını incele, 200 fotoğraf seç (dağılım: Plan 3.2), hikayeleri yaz, `pipeline-ingest` ile yükle, 14 günü programla.
3. Seçilen 6 fotoğrafla ekran görüntüsü CI'ını çalıştır; mağaza görsellerini son haline getir.
4. İlk 3 "bil bakalım" videosunu render et (bonus havuzdan).
5. İnsan kapıları açıldıkça: EAS projesi, TestFlight build, Play kapalı test.

## Engeller
- Konteyner ağı: commons.wikimedia.org, upload.wikimedia.org, *.supabase.co, expo.dev, apps.apple.com, play.google.com erişilemiyor (GitHub Actions ile aşılıyor).
- Supabase MCP `apply_migration` onay sorusu → kullanıcı onayı.
- Hesaplar (Apple, Google Play, Expo, RevenueCat, PostHog, Telegram, alan adı) → HUMAN_TODO.
