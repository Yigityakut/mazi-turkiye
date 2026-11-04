-- Mazi Türkiye · core düzeltmesi (20261104000100_core.sql üretimde uygulandı; o dosya değiştirilmez)
--
-- photos.scheduled_date core'da `unique` tanımlı, oysa her günün 5 fotoğrafı aynı tarihi taşır. Kısıtı düşürmek yerine
-- (DROP ifadesi Supabase MCP'de insan onayı istiyor) sütun artık kullanılmıyor: hangi fotoğrafın hangi güne ait olduğu
-- day_photos'ta (unique(photo_id)), yayın durumu photos.status'ta tutulur. scheduled_date her zaman null kalır.
--
-- days.number core'da unique: gün numarası her yerde launch_date'ten hesaplanır (public.day_number). İlk gün
-- programlandıktan sonra launch_date DEĞİŞTİRİLMEZ (DECISIONS.md); değişirse çakışma olabilir.

-- Program en erken TestFlight testinin başladığı günden başlar (lansman 24 Kasım; test ~14 Kasım).
insert into public.app_config(key, value) values ('schedule_start', '"2026-11-14"') on conflict (key) do nothing;
