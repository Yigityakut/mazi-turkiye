-- Mazi Türkiye · çekirdek şema
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- ---------- Yardımcılar ----------
create or replace function public.game_day(ts timestamptz default now())
returns date language sql stable as $$
  select ((ts at time zone 'Europe/Istanbul') - interval '4 hours')::date
$$;

-- Bir sonraki gün dönüşü (04:00 TSİ) anı
create or replace function public.next_rollover(ts timestamptz default now())
returns timestamptz language sql stable as $$
  select ((public.game_day(ts) + 1)::timestamp + interval '4 hours') at time zone 'Europe/Istanbul'
$$;

create or replace function public.haversine_km(lat1 float8, lng1 float8, lat2 float8, lng2 float8)
returns float8 language sql immutable as $$
  select 2 * 6371.0 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ))
$$;

-- Puan: konum 500·e^(-d/150), yıl 500·e^(-|Δy|/10). 1 km altı ve tam yıl 500'e tamamlanır.
-- İpucu kullanılan bölümün tavanı %30 düşer.
create or replace function public.score_location(d_km float8, hinted boolean default false)
returns int language sql immutable as $$
  select round((case when d_km < 1 then 500 else 500 * exp(-d_km / 150.0) end) * (case when hinted then 0.7 else 1 end))::int
$$;

create or replace function public.score_year(dy int, hinted boolean default false)
returns int language sql immutable as $$
  select round((case when dy = 0 then 500 else 500 * exp(-abs(dy) / 10.0) end) * (case when hinted then 0.7 else 1 end))::int
$$;

-- ---------- Ayarlar ----------
create table public.app_config (
  key text primary key,
  value jsonb not null
);
insert into public.app_config(key, value) values
  ('min_year', '1880'),
  ('free_duels_per_day', '3'),
  ('duel_round_seconds', '45'),
  ('duel_reveal_seconds', '7'),
  ('duel_admin_after_seconds', '60'),
  ('duel_bot_after_seconds', '120'),
  ('public_web_url', '"https://maziturkiye.com"');

-- ---------- Fotoğraflar ----------
create type public.photo_status as enum ('aday', 'onayli', 'yayinda', 'emekli');
create type public.photo_pool as enum ('daily', 'duel', 'bonus');
create type public.difficulty as enum ('kolay', 'orta', 'zor');

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  image_path text,                         -- Storage: photos/<uuid>.jpg
  width int, height int,
  year int not null,
  year_uncertainty smallint not null default 0 check (year_uncertainty in (0, 1)),
  lat float8 not null, lng float8 not null,
  location_name text not null,
  province text,
  region text not null check (region in ('Marmara','Ege','Akdeniz','İç Anadolu','Karadeniz','Doğu Anadolu','Güneydoğu Anadolu')),
  difficulty public.difficulty not null default 'orta',
  story_tr text,
  title_tr text,
  source_name text not null,
  source_url text not null,
  author text not null,
  license_code text not null,
  license_url text,
  pool public.photo_pool not null default 'daily',
  scheduled_date date unique nulls distinct,
  status public.photo_status not null default 'aday',
  phash text,
  report_count int not null default 0,
  created_at timestamptz not null default now(),
  constraint photos_in_turkey check (lat between 35.7 and 42.2 and lng between 25.5 and 45.0)
);
create index photos_pool_status on public.photos(pool, status);

-- Günlük setler: her günün numarası ve 5 fotoğrafı
create table public.days (
  day date primary key,
  number int not null unique,
  theme text,                               -- tematik gün etiketi (örn. "29 Ekim")
  created_at timestamptz not null default now()
);

create table public.day_photos (
  day date not null references public.days(day) on delete cascade,
  slot smallint not null check (slot between 1 and 5),
  photo_id uuid not null references public.photos(id),
  primary key (day, slot),
  unique (photo_id)
);

-- ---------- Profiller ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text check (nickname is null or char_length(nickname) between 2 and 20),
  is_admin boolean not null default false,
  is_pro boolean not null default false,
  pro_since timestamptz,
  elo int not null default 1200,
  duels_played int not null default 0,
  show_on_leaderboard boolean not null default true,
  push_token text,
  reminder_hour smallint,
  streak_freeze_month text,                -- 'YYYY-MM': bu ay seri koruyucu kullanıldı
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Tahminler ----------
create type public.play_mode as enum ('daily', 'challenge', 'archive');

create table public.plays (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null references public.days(day),
  slot smallint not null,
  photo_id uuid not null references public.photos(id),
  mode public.play_mode not null default 'daily',
  guess_lat float8 not null, guess_lng float8 not null,
  guess_year int not null,
  distance_km float8 not null,
  year_diff int not null,
  score_location int not null,
  score_year int not null,
  hint_location boolean not null default false,
  hint_year boolean not null default false,
  duration_ms int,
  created_at timestamptz not null default now(),
  unique (user_id, day, slot)
);

create table public.hints (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null, slot smallint not null,
  kind text not null check (kind in ('year', 'location')),
  created_at timestamptz not null default now(),
  primary key (user_id, day, slot, kind)
);

create table public.day_results (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null references public.days(day),
  mode public.play_mode not null,
  total int not null,
  used_hint boolean not null default false,
  on_time boolean not null,                 -- günün kendisinde mi oynandı (seri için)
  started_at timestamptz,
  completed_at timestamptz not null default now(),
  challenge_code text,
  primary key (user_id, day)
);
create index day_results_day_total on public.day_results(day, total desc);

-- ---------- Meydan okuma ve arkadaşlar ----------
create table public.challenges (
  code text primary key check (code ~ '^[A-Z2-9]{6}$'),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  day date not null references public.days(day),
  creator_total int not null,
  created_at timestamptz not null default now(),
  unique (creator_id, day)
);

create table public.friendships (
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

-- ---------- Bildirme ----------
create table public.photo_reports (
  photo_id uuid not null references public.photos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('yil', 'konum', 'uygunsuz', 'telif', 'diger')),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  primary key (photo_id, user_id)
);

-- ---------- Birleştirme biletleri (anonim -> giriş) ----------
create table public.merge_tickets (
  ticket uuid primary key default gen_random_uuid(),
  anon_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------- RLS: istemci tablolara doğrudan erişmez, RPC kullanır ----------
alter table public.app_config enable row level security;
alter table public.photos enable row level security;
alter table public.days enable row level security;
alter table public.day_photos enable row level security;
alter table public.profiles enable row level security;
alter table public.plays enable row level security;
alter table public.hints enable row level security;
alter table public.day_results enable row level security;
alter table public.challenges enable row level security;
alter table public.friendships enable row level security;
alter table public.photo_reports enable row level security;
alter table public.merge_tickets enable row level security;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own plays read" on public.plays for select to authenticated using (user_id = auth.uid());
create policy "own results read" on public.day_results for select to authenticated using (user_id = auth.uid());
