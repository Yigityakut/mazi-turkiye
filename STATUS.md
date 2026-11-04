# Durum

_Son güncelleme: 2026-11-04 (oturum 1, devam ediyor)_

## Biten
- İsim kararı: **Mazi Türkiye** (DECISIONS.md)
- Türkiye harita verisi (Natural Earth, kamu malı) → `app/src/data/turkeyMap.json`, `supabase/functions/_shared/geo.json`
- Supabase `core` migration'ı uygulandı (tablolar, puanlama fonksiyonları, RLS)

## Yarım
- `game` migration'ı (RPC'ler) uygulanırken Supabase onay sorusu yanıtsız kaldı; dosya hazır: `supabase/migrations/20261104000200_game.sql`
- `duel` ve `seed_geo_storage` migration'ları yazıldı, henüz uygulanmadı

## Sıradaki 5 adım
1. `game`, `duel`, `seed_geo_storage` migration'larını uygula
2. Edge function'lar: pipeline-harvest, pipeline-ingest, notify-admin, revenuecat-webhook, push-notify
3. Fotoğraf hattını çalıştır, ilk 200 fotoğrafı onayla, 14 günü programla
4. Expo uygulaması
5. Web sitesi, mağaza metinleri ve görselleri, pazarlama içerikleri

## Engeller
- Konteynerin ağ izni kısıtlı: commons.wikimedia.org, upload.wikimedia.org, loc.gov, europeana, supabase.co, expo.dev, apps.apple.com, play.google.com erişilemiyor.
