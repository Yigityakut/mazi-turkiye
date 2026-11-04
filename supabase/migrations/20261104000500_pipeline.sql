-- Mazi Türkiye · fotoğraf toplama hattı aday tablosu
create table public.photo_candidates (
  source_key text primary key,              -- örn. commons:File:Galata_Bridge_1965.jpg
  source_name text not null,                -- Wikimedia Commons, Kongre Kütüphanesi...
  page_url text not null,
  image_url text not null,                  -- indirilecek (küçültülmüş) görsel
  hash_url text,                            -- algısal hash için küçük görsel
  width int, height int,
  year int, year_source text,
  lat float8, lng float8, coord_kind text,  -- camera / object
  province text, region text,
  license_code text, license_url text,
  author text, credit text,
  title text, description text, categories text[],
  query text,
  status text not null default 'new' check (status in ('new', 'rejected', 'approved', 'ingested')),
  reject_reason text,
  -- Ajanın inceleme sonucu (ingest bunları photos tablosuna taşır)
  location_name text, title_tr text, story_tr text, difficulty public.difficulty, pool public.photo_pool,
  photo_id uuid references public.photos(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index photo_candidates_status on public.photo_candidates(status);
alter table public.photo_candidates enable row level security;

create table public.pipeline_runs (
  id bigint generated always as identity primary key,
  kind text not null,
  params jsonb,
  result jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
alter table public.pipeline_runs enable row level security;

-- Edge function'ları SQL'den (pg_cron) tetiklemek için
create or replace function private.call_function(fn text, body jsonb default '{}'::jsonb, timeout_ms int default 5000)
returns bigint language plpgsql security definer set search_path = public, extensions as $$
declare url text; secret text;
begin
  select value into url from private.secrets where key = 'functions_url';
  select value into secret from private.secrets where key = 'internal_secret';
  if url is null or secret is null then return null; end if;
  return net.http_post(url := url || '/' || fn, body := body,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', secret),
    timeout_milliseconds := timeout_ms);
end $$;

-- Haftalık: pazartesi 03:00 TSİ aday topla; her gün 03:30 onaylıları işle; 23:00 TSİ seri hatırlatması
select cron.schedule('pipeline-harvest-weekly', '0 0 * * 1', $$select private.call_function('pipeline-harvest', '{"mode":"weekly"}')$$);
select cron.schedule('pipeline-ingest-daily', '30 0 * * *', $$select private.call_function('pipeline-ingest', '{"limit":40}')$$);
select cron.schedule('streak-danger', '0 20 * * *', $$select private.call_function('push-notify', '{"kind":"streak_danger"}')$$);
select cron.schedule('weekly-report', '0 6 * * 1', $$select private.call_function('weekly-report', '{}')$$);

-- ---------- Sadece servis rolünün çağırabildiği RPC'ler ----------
create or replace function private.require_service() returns void language plpgsql stable as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'forbidden'; end if;
end $$;

-- Bugün oynamamış, serisi 2+ gün, push token'ı olan kullanıcılar
create or replace function public.streak_danger_targets()
returns table(push_token text, streak int) language plpgsql stable security definer set search_path = public as $$
begin
  perform private.require_service();
  return query
    select p.push_token, (private.streak_of(p.id)->>'current')::int
      from public.profiles p
     where p.push_token is not null
       and not exists (select 1 from public.day_results r where r.user_id = p.id and r.day = public.game_day())
       and exists (select 1 from public.day_results r where r.user_id = p.id and r.day = public.game_day() - 1)
       and (private.streak_of(p.id)->>'current')::int >= 2;
end $$;

create or replace function public.weekly_kpis()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare t date := public.game_day();
begin
  perform private.require_service();
  return jsonb_build_object(
    'active_7d', (select count(distinct user_id) from public.plays where created_at > now() - interval '7 days'),
    'active_prev', (select count(distinct user_id) from public.plays where created_at between now() - interval '14 days' and now() - interval '7 days'),
    'completions_7d', (select count(*) from public.day_results where completed_at > now() - interval '7 days'),
    'challenges_7d', (select count(*) from public.challenges where created_at > now() - interval '7 days'),
    'challenge_plays_7d', (select count(*) from public.day_results where challenge_code is not null and completed_at > now() - interval '7 days'),
    'duels_7d', (select count(*) from public.duels where created_at > now() - interval '7 days'),
    'bot_duels_7d', (select count(*) from public.duels where opponent_kind = 'bot' and created_at > now() - interval '7 days'),
    'pro_total', (select count(*) from public.profiles where is_pro),
    'pro_7d', (select count(*) from public.profiles where is_pro and pro_since > now() - interval '7 days'),
    'days_ahead', (select count(*) from public.days where day > t),
    'photos_left', (select count(*) from public.photos where pool = 'daily' and status = 'onayli'));
end $$;
