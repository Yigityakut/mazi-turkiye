# Mazi Türkiye — ajan notları

- İşe başlamadan önce `STATUS.md` (nerede kaldık, yarım işler), `HUMAN_TODO.md` (insan kapıları) ve `DECISIONS.md` (alınmış kararlar; tekrar tartışma) oku. Ürün planı: `Plan.md`.
- Kullanıcı tüm kararları ajana bıraktı: soru sorma, karar ver, `DECISIONS.md`'ye bir satır yaz. Oturum sonunda `STATUS.md`'yi güncelle.
- Supabase projesi: `timeguessr` (ref `ybhiddgwunzyquzrbzaf`, eu-central-1). Migration'lar `supabase/migrations/`; değişiklikten sonra `cd supabase/tests && npm test` (60 senaryo) yeşil olmalı. `20261104000100_core.sql` canlıda; değiştirme, yeni migration ekle.
- Uygulama `app/` (Expo SDK 58, expo-router). Değişiklikten sonra `npx tsc --noEmit`. Expo API'lerini hafızadan değil, kurulu paket tiplerinden ve docs.expo.dev'den doğrula (`app/AGENTS.md`).
- Gizli değerler repoya yazılmaz (`.env`, EAS env, Supabase secrets).
- Rakip app'lerin (TimeGuessr vb.) adı, görseli ve metni kullanılmaz; yapay zekâyla "eski fotoğraf" üretilmez; sahte kullanıcı sayısı veya yorum yazılmaz.
