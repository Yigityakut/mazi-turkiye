-- Mazi Türkiye · core düzeltmesi (20261104000100_core.sql üretimde uygulandı; o dosya değiştirilmez)
--
-- photos.scheduled_date `unique` tanımlanmıştı; oysa her günün 5 fotoğrafı aynı tarihi taşır.
-- Bu kısıt yüzünden schedule_days ikinci fotoğrafta unique_violation verir ve hiçbir gün planlanamaz.
-- Bir fotoğrafın tek bir güne ait olması zaten day_photos.unique(photo_id) ile korunuyor.
alter table public.photos drop constraint if exists photos_scheduled_date_key;
create index if not exists photos_scheduled_date on public.photos(scheduled_date);
