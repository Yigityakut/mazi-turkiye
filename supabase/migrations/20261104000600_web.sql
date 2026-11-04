-- Mazi Türkiye · web bekleme listesi, iç çağrı doğrulaması, temizlik
create table public.waitlist (
  email text primary key check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;

create or replace function public.join_waitlist(p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare e text := lower(btrim(p_email));
begin
  -- Tablo kısıtıyla aynı kural; ham check_violation yerine istemcinin anlayacağı hata
  if e is null or char_length(e) > 254 or e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'bad_email'; end if;
  -- basit kötüye kullanım sınırı: dakikada en fazla 30 kayıt
  if (select count(*) from public.waitlist where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'rate_limited';
  end if;
  insert into public.waitlist(email) values (e) on conflict do nothing;
end $$;

-- Edge function'ların pg_cron/pg_net çağrılarını doğrulaması için (gizli değer sadece veritabanında üretilir)
insert into private.secrets(key, value) values ('internal_secret', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;
insert into private.secrets(key, value) values ('functions_url', 'https://ybhiddgwunzyquzrbzaf.supabase.co/functions/v1')
on conflict (key) do update set value = excluded.value;

create or replace function public.verify_internal_secret(p text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(auth.role() = 'service_role' and p = (select value from private.secrets where key = 'internal_secret'), false)
$$;

