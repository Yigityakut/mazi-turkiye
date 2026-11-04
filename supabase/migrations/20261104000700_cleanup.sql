-- Mazi Türkiye · saklama süresi temizliği (ayrı migration: silme ifadesi içerir, onay gerektirebilir)
-- Gizlilik politikası: 24 ay işlem yapılmayan anonim hesaplar silinir; bekleme listesi lansmandan 6 ay sonra temizlenir.
create or replace function private.cleanup() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  perform private.notify_admin('🧹 Aylık temizlik: ' ||
    (select count(*) from auth.users u where u.is_anonymous and coalesce(u.last_sign_in_at, u.created_at) < now() - interval '24 months')
    || ' eski anonim hesap siliniyor.');
  -- silme işlemi tek ifade ile (cascade)
  execute 'delete from auth.users u where u.is_anonymous and coalesce(u.last_sign_in_at, u.created_at) < now() - interval ''24 months''';
  execute 'delete from public.waitlist where created_at < (select (value #>> ''{}'')::date from public.app_config where key = ''launch_date'') + interval ''6 months'' and now() > (select (value #>> ''{}'')::date from public.app_config where key = ''launch_date'') + interval ''6 months''';
end $$;
select cron.schedule('monthly-cleanup', '0 2 1 * *', $$select private.cleanup()$$);
