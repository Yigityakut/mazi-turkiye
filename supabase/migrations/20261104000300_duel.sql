-- Mazi Türkiye · canlı 1v1, bot, admin bildirimi
create table private.provinces (
  plate int primary key, name text not null, region text not null, lat float8 not null, lng float8 not null
);

create table private.bot_names (name text primary key);
insert into private.bot_names(name) values
 ('poyraz34'),('lodos'),('vapurcu'),('kaşif_06'),('eskiplak'),('simitçi'),('ayvalıklı'),('kapadokya'),
 ('karayel'),('çınaraltı'),('gezgin35'),('fotoğrafçı'),('martı'),('yörük'),('kuzguncuk'),('salepçi'),
 ('anadolu07'),('karadenizli'),('bozcaada'),('mavi_tren'),('arşivci'),('dedektif'),('pusula'),('zamanyolcusu'),
 ('kartpostal'),('nostalji01'),('çaycı'),('dolmuş'),('haritacı'),('meraklı'),('hamsi61'),('Ece_K'),('Mert'),('Deniz'),('Elif'),('Can');

create table public.duel_queue (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  elo int not null,
  status text not null default 'waiting' check (status in ('waiting', 'matched', 'cancelled')),
  duel_id uuid,
  created_at timestamptz not null default now(),
  admin_notified_at timestamptz
);

create table public.duels (
  id uuid primary key default gen_random_uuid(),
  player_a uuid not null references public.profiles(id) on delete cascade,
  player_b uuid references public.profiles(id) on delete set null,
  opponent_kind text not null check (opponent_kind in ('player', 'admin', 'bot')),
  bot_name text,
  bot_elo int,
  bot_factor float8,
  state text not null default 'active' check (state in ('active', 'finished')),
  current_round smallint not null default 1,
  round_started_at timestamptz not null,
  round_deadline timestamptz not null,
  reveal_until timestamptz,
  score_a int not null default 0,
  score_b int not null default 0,
  winner text check (winner in ('a', 'b', 'draw')),
  elo_a_before int, elo_a_after int, elo_b_before int, elo_b_after int,
  wait_seconds int,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index duels_a on public.duels(player_a, created_at desc);
create index duels_b on public.duels(player_b, created_at desc);
create index duels_active on public.duels(state) where state = 'active';

create table public.duel_rounds (
  duel_id uuid not null references public.duels(id) on delete cascade,
  round smallint not null check (round between 1 and 5),
  photo_id uuid not null references public.photos(id),
  primary key (duel_id, round)
);

create table public.duel_guesses (
  duel_id uuid not null references public.duels(id) on delete cascade,
  round smallint not null,
  side text not null check (side in ('a', 'b')),
  lat float8, lng float8, year int,
  distance_km float8, year_diff int,
  score_location int not null default 0, score_year int not null default 0,
  visible_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (duel_id, round, side)
);

create table public.duel_seen (
  user_id uuid not null references public.profiles(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (user_id, photo_id)
);

alter table public.duel_queue enable row level security;
alter table public.duels enable row level security;
alter table public.duel_rounds enable row level security;
alter table public.duel_guesses enable row level security;
alter table public.duel_seen enable row level security;
-- Realtime için: katılımcılar kendi maç satırını ve kuyruk satırını görebilir (cevap bilgisi bu tablolarda yok)
create policy "duel participants" on public.duels for select to authenticated using (auth.uid() in (player_a, player_b));
create policy "own queue" on public.duel_queue for select to authenticated using (user_id = auth.uid());
alter publication supabase_realtime add table public.duels, public.duel_queue;

-- ---------- Admin bildirimi (Telegram, edge function üzerinden) ----------
create or replace function private.notify_admin(msg text, link text default null)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare url text; secret text;
begin
  select value into url from private.secrets where key = 'functions_url';
  select value into secret from private.secrets where key = 'internal_secret';
  if url is null or secret is null then return; end if;
  perform net.http_post(
    url := url || '/notify-admin',
    body := jsonb_build_object('text', msg, 'link', link),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', secret),
    timeout_milliseconds := 10000);
end $$;

create or replace function private.cfg_int(k text) returns int language sql stable as $$
  select (value #>> '{}')::int from public.app_config where key = k
$$;

create or replace function private.gauss() returns float8 language sql volatile as $$
  select sqrt(-2 * ln(greatest(random(), 1e-12))) * cos(2 * pi() * random())
$$;

-- ---------- Fotoğraf seçimi ----------
create or replace function private.pick_duel_photos(a uuid, b uuid) returns uuid[]
language plpgsql security definer set search_path = public as $$
declare ids uuid[];
begin
  select array_agg(id) into ids from (
    select p.id from public.photos p
     where p.status in ('onayli', 'yayinda')
       and (p.pool = 'duel' or exists (select 1 from public.day_photos dp where dp.photo_id = p.id and dp.day < public.game_day()))
     order by
       (exists (select 1 from public.duel_seen s where s.photo_id = p.id and s.user_id in (a, b))) ,  -- görülmeyenler önce
       (select max(seen_at) from public.duel_seen s where s.photo_id = p.id and s.user_id in (a, b)) nulls first,
       (p.pool = 'duel') desc,
       random()
     limit 5) s;
  if coalesce(array_length(ids, 1), 0) < 5 then raise exception 'duel_pool_empty'; end if;
  return ids;
end $$;

create or replace function private.player_skill(uid uuid) returns float8 language sql stable as $$
  -- son 40 tahminin ortalama fotoğraf puanı (0-1000)
  select coalesce(avg(s), 500) from (
    (select score_location + score_year as s from public.plays where user_id = uid order by created_at desc limit 40)
  ) x
$$;

-- ---------- Maç oluşturma ----------
create or replace function private.create_duel(a uuid, b uuid, kind text, waited int)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  did uuid;
  ids uuid[];
  i int;
  ea int; eb int;
  start_at timestamptz := now() + interval '4 seconds';
  skill float8;
begin
  ids := private.pick_duel_photos(a, b);
  select elo into ea from public.profiles where id = a;
  if kind = 'bot' then
    skill := private.player_skill(a);
    insert into public.duels(player_a, player_b, opponent_kind, bot_name, bot_elo, bot_factor,
                             round_started_at, round_deadline, elo_a_before, wait_seconds)
    values (a, null, 'bot', (select name from private.bot_names order by random() limit 1),
            ea + (floor(random() * 81) - 40)::int,
            least(greatest((1000 - skill) / 500.0, 0.35), 2.0),
            start_at, start_at + make_interval(secs => private.cfg_int('duel_round_seconds')), ea, waited)
    returning id into did;
  else
    select elo into eb from public.profiles where id = b;
    insert into public.duels(player_a, player_b, opponent_kind, round_started_at, round_deadline,
                             elo_a_before, elo_b_before, wait_seconds)
    values (a, b, kind, start_at, start_at + make_interval(secs => private.cfg_int('duel_round_seconds')), ea, eb, waited)
    returning id into did;
  end if;
  for i in 1..5 loop
    insert into public.duel_rounds(duel_id, round, photo_id) values (did, i, ids[i]);
  end loop;
  insert into public.duel_seen(user_id, photo_id) select a, unnest(ids) on conflict (user_id, photo_id) do update set seen_at = now();
  if b is not null then
    insert into public.duel_seen(user_id, photo_id) select b, unnest(ids) on conflict (user_id, photo_id) do update set seen_at = now();
  end if;
  if kind = 'bot' then perform private.bot_guess(did, 1); end if;
  update public.duel_queue set status = 'matched', duel_id = did where user_id in (a, b) and status = 'waiting';
  return did;
end $$;

-- Bot tahmini: doğru cevap + Gauss sapma (yıl ~±12, konum ~200 km; oyuncu becerisine göre ölçeklenir)
create or replace function private.bot_guess(did uuid, rnd int) returns void
language plpgsql security definer set search_path = public as $$
declare
  d public.duels; p public.photos;
  f float8; dlat float8; dlng float8; glat float8; glng float8; gyear int;
  near private.provinces; dkm float8; dy int;
begin
  select * into d from public.duels where id = did;
  select ph.* into p from public.duel_rounds r join public.photos ph on ph.id = r.photo_id where r.duel_id = did and r.round = rnd;
  f := d.bot_factor;
  dlat := private.gauss() * 200 * f / 111.0 / sqrt(2);
  dlng := private.gauss() * 200 * f / (111.0 * cos(radians(p.lat))) / sqrt(2);
  glat := least(greatest(p.lat + dlat, 36.0), 42.0);
  glng := least(greatest(p.lng + dlng, 26.0), 44.7);
  -- En yakın il merkezine oturt: tahmin her zaman karada/yurt içinde olur ve insan tahmini gibi görünür.
  -- (Eski kural sadece 45 km'den uzaksa oturtuyordu; kıyı illerinde 45 km içi deniz olabiliyordu.)
  select * into near from private.provinces pv order by public.haversine_km(glat, glng, pv.lat, pv.lng) limit 1;
  glat := near.lat; glng := near.lng;
  gyear := least(greatest(p.year + round(private.gauss() * 12 * f)::int, private.cfg_int('min_year')), extract(year from now())::int);
  dkm := public.haversine_km(glat, glng, p.lat, p.lng);
  dy := abs(gyear - p.year); if dy <= p.year_uncertainty then dy := 0; end if;
  insert into public.duel_guesses(duel_id, round, side, lat, lng, year, distance_km, year_diff, score_location, score_year, visible_at)
  values (did, rnd, 'b', glat, glng, gyear, dkm, dy, public.score_location(dkm), public.score_year(dy),
          d.round_started_at + make_interval(secs => 8 + floor(random() * 28)))
  on conflict do nothing;
end $$;

-- ---------- Maç durum makinesi ----------
create or replace function private.duel_advance(did uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  d public.duels;
  both_in boolean;
  reveal_secs int := private.cfg_int('duel_reveal_seconds');
  round_secs int := private.cfg_int('duel_round_seconds');
  -- duel_guess, süre bittikten sonra 2 sn'ye kadar gelen tahmini kabul eder (ağ gecikmesi). Tur bu tolerans
  -- bitmeden kapatılırsa (istemci 1,2 sn'de bir duel_state yokluyor) o tahminler round_closed ile kaybolur.
  grace interval := interval '2 seconds';
  ea float8; sa float8; k int := 32; rb int;
begin
  for i in 1..12 loop  -- birden fazla aşama geride kalmışsa yakala
    select * into d from public.duels where id = did for update;
    if not found or d.state <> 'active' then return; end if;
    if d.reveal_until is null then
      select count(*) = 2 into both_in from public.duel_guesses
       where duel_id = did and round = d.current_round and visible_at <= now();
      if now() < d.round_deadline + grace and not both_in then return; end if;
      -- tahmin etmeyen 0 puan alır
      insert into public.duel_guesses(duel_id, round, side, visible_at) values (did, d.current_round, 'a', d.round_deadline) on conflict do nothing;
      insert into public.duel_guesses(duel_id, round, side, visible_at) values (did, d.current_round, 'b', d.round_deadline) on conflict do nothing;
      update public.duels set
        reveal_until = least(now(), d.round_deadline + grace) + make_interval(secs => reveal_secs),
        score_a = (select coalesce(sum(score_location + score_year), 0) from public.duel_guesses where duel_id = did and side = 'a' and round <= d.current_round),
        score_b = (select coalesce(sum(score_location + score_year), 0) from public.duel_guesses where duel_id = did and side = 'b' and round <= d.current_round)
       where id = did;
    else
      if now() < d.reveal_until then return; end if;
      if d.current_round >= 5 then
        rb := coalesce(d.elo_b_before, d.bot_elo);
        sa := case when d.score_a > d.score_b then 1 when d.score_a < d.score_b then 0 else 0.5 end;
        ea := 1 / (1 + power(10, (rb - d.elo_a_before) / 400.0));
        update public.duels set state = 'finished', finished_at = now(),
          winner = case when sa = 1 then 'a' when sa = 0 then 'b' else 'draw' end,
          elo_a_after = d.elo_a_before + round(k * (sa - ea))::int,
          elo_b_after = case when d.player_b is null then null else d.elo_b_before + round(k * ((1 - sa) - (1 - ea)))::int end
         where id = did returning * into d;
        update public.profiles set elo = d.elo_a_after, duels_played = duels_played + 1 where id = d.player_a;
        if d.player_b is not null then
          update public.profiles set elo = d.elo_b_after, duels_played = duels_played + 1 where id = d.player_b;
        end if;
        return;
      end if;
      update public.duels set current_round = d.current_round + 1, round_started_at = d.reveal_until,
        round_deadline = d.reveal_until + make_interval(secs => round_secs), reveal_until = null
       where id = did;
      if d.opponent_kind = 'bot' then perform private.bot_guess(did, d.current_round + 1); end if;
    end if;
  end loop;
end $$;

-- Kuyruktaki bir kullanıcı için zaman aşımı kuralları: 60 sn admin bildirimi, 120 sn bot
create or replace function private.queue_timeouts(q public.duel_queue) returns void
language plpgsql security definer set search_path = public as $$
declare waited int; base text;
begin
  -- Güncel satırı kilitle: pg_cron tick'i ile istemcinin duel_queue_status yoklaması aynı anda çalışabilir;
  -- eski kopya ile karar verilirse iki bot maçı / iki Telegram bildirimi oluşur.
  select * into q from public.duel_queue where user_id = q.user_id for update;
  if not found or q.status <> 'waiting' then return; end if;
  waited := extract(epoch from now() - q.created_at)::int;
  if waited >= private.cfg_int('duel_admin_after_seconds') and q.admin_notified_at is null then
    update public.duel_queue set admin_notified_at = now() where user_id = q.user_id;
    select value #>> '{}' into base from public.app_config where key = 'public_web_url';
    perform private.notify_admin('⚔️ Rakip bekliyor (' || q.elo || ' derece, ' || waited || ' sn). Girmek için dokun.',
                                 base || '/d/' || q.token);
  end if;
  if waited >= private.cfg_int('duel_bot_after_seconds') then
    perform private.create_duel(q.user_id, null, 'bot', waited);
  end if;
end $$;

-- Kuyruktaki bir oyuncuyu bekleyen başka bir oyuncuyla eşleştirmeye çalışır. Derece penceresi, uzun bekleyenin
-- süresiyle genişler (200 + 10/sn). duel_find sadece çağrı anında eşleştirdiği için, aynı anda kuyruğa girenler
-- veya o an pencere dışında kalanlar daha sonra hiç eşleşmiyor, 120. saniyede bota düşüyordu.
create or replace function private.try_match(uid uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare me public.duel_queue; other public.duel_queue;
begin
  select * into me from public.duel_queue where user_id = uid and status = 'waiting' for update skip locked;
  if not found then return null; end if;
  select * into other from public.duel_queue q
   where q.status = 'waiting' and q.user_id <> uid
     and abs(q.elo - me.elo) <= 200 + 10 * extract(epoch from now() - least(q.created_at, me.created_at))
   order by q.created_at
   limit 1 for update skip locked;
  if not found then return null; end if;
  if other.created_at <= me.created_at then
    return private.create_duel(other.user_id, uid, 'player', extract(epoch from now() - other.created_at)::int);
  end if;
  return private.create_duel(uid, other.user_id, 'player', extract(epoch from now() - me.created_at)::int);
end $$;

create or replace function private.duel_tick() returns void
language plpgsql security definer set search_path = public as $$
declare q public.duel_queue; did uuid;
begin
  -- Her kayıt kendi alt işleminde: biri hata verirse (örn. duel_pool_empty) diğer kuyruklar ve maçlar durmaz.
  for q in select * from public.duel_queue where status = 'waiting' order by created_at loop
    begin
      if private.try_match(q.user_id) is null then
        perform private.queue_timeouts(q);
      end if;
    exception when others then
      raise warning 'duel_tick: queue % failed: %', q.user_id, sqlerrm;
    end;
  end loop;
  for did in select id from public.duels where state = 'active' loop
    begin
      perform private.duel_advance(did);
    exception when others then
      raise warning 'duel_tick: duel % failed: %', did, sqlerrm;
    end;
  end loop;
  update public.duel_queue set status = 'cancelled' where status = 'waiting' and created_at < now() - interval '10 minutes';
end $$;

-- ---------- İstemci RPC'leri ----------
create or replace function public.duel_find()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := private.require_user();
  me public.profiles;
  active uuid;
  other public.duel_queue;
  did uuid;
  today_count int;
begin
  insert into public.profiles(id) values (uid) on conflict do nothing;
  select * into me from public.profiles where id = uid;
  -- Kendi kuyruk satırını kilitle: aynı anda başka bir oturumun try_match'i bu oyuncuyu da eşleştirmesin
  perform 1 from public.duel_queue where user_id = uid for update;
  select id into active from public.duels where state = 'active' and uid in (player_a, player_b) limit 1;
  if active is not null then return jsonb_build_object('status', 'matched', 'duel_id', active); end if;

  select count(*) into today_count from public.duels
   where uid in (player_a, player_b) and public.game_day(created_at) = public.game_day();
  if not me.is_pro and today_count >= private.cfg_int('free_duels_per_day') then raise exception 'duel_limit'; end if;

  select * into other from public.duel_queue q
   where q.status = 'waiting' and q.user_id <> uid
     and abs(q.elo - me.elo) <= 200 + 10 * extract(epoch from now() - q.created_at)
   order by q.created_at
   limit 1 for update skip locked;

  if other.user_id is not null then
    did := private.create_duel(other.user_id, uid, 'player', extract(epoch from now() - other.created_at)::int);
    return jsonb_build_object('status', 'matched', 'duel_id', did);
  end if;

  insert into public.duel_queue(user_id, elo) values (uid, me.elo)
  on conflict (user_id) do update set status = 'waiting', duel_id = null, elo = excluded.elo,
     created_at = case when public.duel_queue.status = 'waiting' then public.duel_queue.created_at else now() end,
     admin_notified_at = case when public.duel_queue.status = 'waiting' then public.duel_queue.admin_notified_at else null end,
     token = case when public.duel_queue.status = 'waiting' then public.duel_queue.token else gen_random_uuid() end;
  return jsonb_build_object('status', 'waiting', 'waited', 0);
end $$;

create or replace function public.duel_queue_status()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := private.require_user(); q public.duel_queue;
begin
  select * into q from public.duel_queue where user_id = uid;
  if q.user_id is null then return jsonb_build_object('status', 'none'); end if;
  -- İstemci 2 sn'de bir yokluyor: önce bekleyen gerçek bir rakip ara, yoksa 60/120 sn kurallarını uygula
  if q.status = 'waiting' and private.try_match(uid) is null then
    perform private.queue_timeouts(q);
  end if;
  select * into q from public.duel_queue where user_id = uid;
  return jsonb_build_object('status', q.status, 'duel_id', q.duel_id, 'waited', extract(epoch from now() - q.created_at)::int);
end $$;

create or replace function public.duel_cancel()
returns void language sql security definer set search_path = public as $$
  update public.duel_queue set status = 'cancelled' where user_id = auth.uid() and status = 'waiting'
$$;

-- Admin, Telegram'daki linkle bekleyen oyuncuya katılır. Admin rakibe normal oyuncu gibi görünür.
create or replace function public.duel_admin_join(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := private.require_user(); q public.duel_queue; did uuid;
begin
  if not exists (select 1 from public.profiles where id = uid and is_admin) then raise exception 'not_admin'; end if;
  select * into q from public.duel_queue where token = p_token for update;
  if q.user_id is null or q.status <> 'waiting' then
    return jsonb_build_object('status', 'gone', 'duel_id', q.duel_id);
  end if;
  if q.user_id = uid then raise exception 'own_queue'; end if;
  did := private.create_duel(q.user_id, uid, 'admin', extract(epoch from now() - q.created_at)::int);
  return jsonb_build_object('status', 'matched', 'duel_id', did);
end $$;

create or replace function public.duel_guess(p_duel uuid, p_round int, p_lat float8, p_lng float8, p_year int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := private.require_user();
  d public.duels; p public.photos; side text; dkm float8; dy int;
begin
  perform private.duel_advance(p_duel);
  select * into d from public.duels where id = p_duel;
  if d.id is null then raise exception 'duel_not_found'; end if;
  side := case when d.player_a = uid then 'a' when d.player_b = uid then 'b' else null end;
  if side is null then raise exception 'not_participant'; end if;
  if d.state <> 'active' or d.current_round <> p_round or d.reveal_until is not null
     or now() > d.round_deadline + interval '2 seconds' or now() < d.round_started_at then
    raise exception 'round_closed';
  end if;
  -- submit_guess ile aynı girdi kuralları
  if p_lat is null or p_lng is null or p_lat not between 35.5 and 42.5 or p_lng not between 25.4 and 45.0 then
    raise exception 'out_of_bounds';
  end if;
  if p_year is null or p_year < private.cfg_int('min_year') or p_year > extract(year from now())::int then
    raise exception 'bad_year';
  end if;
  select ph.* into p from public.duel_rounds r join public.photos ph on ph.id = r.photo_id where r.duel_id = p_duel and r.round = p_round;
  dkm := public.haversine_km(p_lat, p_lng, p.lat, p.lng);
  dy := abs(p_year - p.year); if dy <= p.year_uncertainty then dy := 0; end if;
  insert into public.duel_guesses(duel_id, round, side, lat, lng, year, distance_km, year_diff, score_location, score_year)
  values (p_duel, p_round, side, p_lat, p_lng, p_year, dkm, dy, public.score_location(dkm), public.score_year(dy))
  on conflict do nothing;
  perform private.duel_advance(p_duel);
  return public.duel_state(p_duel);
end $$;

create or replace function public.duel_state(p_duel uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := private.require_user();
  d public.duels; me_side text; opp_side text; p public.photos;
  opp_name text; opp_elo int; mine public.duel_guesses; theirs public.duel_guesses;
  phase text; rounds jsonb;
begin
  perform private.duel_advance(p_duel);
  select * into d from public.duels where id = p_duel;
  if d.id is null then raise exception 'duel_not_found'; end if;
  me_side := case when d.player_a = uid then 'a' when d.player_b = uid then 'b' end;
  if me_side is null then raise exception 'not_participant'; end if;
  opp_side := case when me_side = 'a' then 'b' else 'a' end;

  if d.opponent_kind = 'bot' then opp_name := d.bot_name; opp_elo := d.bot_elo;
  else
    select private.display_name(pr), pr.elo into opp_name, opp_elo from public.profiles pr
     where pr.id = case when me_side = 'a' then d.player_b else d.player_a end;
  end if;

  phase := case when d.state = 'finished' then 'finished'
                when now() < d.round_started_at then 'countdown'
                when d.reveal_until is null then 'guessing' else 'reveal' end;

  select ph.* into p from public.duel_rounds r join public.photos ph on ph.id = r.photo_id where r.duel_id = p_duel and r.round = d.current_round;
  select * into mine from public.duel_guesses where duel_id = p_duel and round = d.current_round and side = me_side;
  select * into theirs from public.duel_guesses where duel_id = p_duel and round = d.current_round and side = opp_side and visible_at <= now();

  select jsonb_agg(jsonb_build_object('round', r.round,
           'me', (select score_location + score_year from public.duel_guesses g where g.duel_id = r.duel_id and g.round = r.round and g.side = me_side),
           'opp', (select score_location + score_year from public.duel_guesses g where g.duel_id = r.duel_id and g.round = r.round and g.side = opp_side)) order by r.round)
    into rounds from public.duel_rounds r
   where r.duel_id = p_duel and (r.round < d.current_round or (r.round = d.current_round and d.reveal_until is not null));

  return jsonb_build_object(
    'id', d.id, 'phase', phase, 'round', d.current_round, 'server_now', now(),
    'round_started_at', d.round_started_at, 'round_deadline', d.round_deadline, 'reveal_until', d.reveal_until,
    'opponent', jsonb_build_object('name', coalesce(opp_name, 'Rakip'), 'elo', opp_elo, 'guessed', theirs.duel_id is not null and theirs.lat is not null),
    'photo', case when phase = 'countdown' then null else jsonb_build_object('image_path', p.image_path, 'width', p.width, 'height', p.height) end,
    'my_guess', case when mine.duel_id is null or mine.lat is null then null else jsonb_build_object('lat', mine.lat, 'lng', mine.lng, 'year', mine.year) end,
    'reveal', case when d.reveal_until is null and d.state = 'active' then null else jsonb_build_object(
        'answer', private.photo_answer(p),
        'me', case when mine.lat is null then jsonb_build_object('score', 0) else jsonb_build_object('lat', mine.lat, 'lng', mine.lng, 'year', mine.year,
              'distance_km', round(mine.distance_km::numeric, 1), 'year_diff', mine.year_diff, 'score', mine.score_location + mine.score_year) end,
        'opp', (select case when g.lat is null then jsonb_build_object('score', 0) else jsonb_build_object('lat', g.lat, 'lng', g.lng, 'year', g.year,
              'distance_km', round(g.distance_km::numeric, 1), 'year_diff', g.year_diff, 'score', g.score_location + g.score_year) end
              from public.duel_guesses g where g.duel_id = p_duel and g.round = d.current_round and g.side = opp_side)) end,
    'score_me', case when me_side = 'a' then d.score_a else d.score_b end,
    'score_opp', case when me_side = 'a' then d.score_b else d.score_a end,
    'rounds', coalesce(rounds, '[]'::jsonb),
    'result', case when d.state <> 'finished' then null else jsonb_build_object(
        'outcome', case when d.winner = 'draw' then 'draw' when d.winner = me_side then 'win' else 'loss' end,
        'elo_before', case when me_side = 'a' then d.elo_a_before else d.elo_b_before end,
        'elo_after', case when me_side = 'a' then d.elo_a_after else d.elo_b_after end) end);
end $$;

-- ---------- Program ve operasyon ----------
create or replace function public.schedule_days(p_horizon int default 14)
returns int language plpgsql security definer set search_path = public as $$
declare
  d date;
  last_day date;
  created int := 0;
  picked uuid[];
  regions text[]; eras text[]; diffs text[];
  best uuid[]; best_score int; score int;
  cand record;
  attempt int;
  k int;
  slot int;
begin
  -- Sadece servis rolü (edge function) veya sunucu içi çağrı (pg_cron: JWT yok). İzin listesi: bilinmeyen roller de reddedilir.
  if auth.role() is not null and auth.role() <> 'service_role' then raise exception 'forbidden'; end if;
  select coalesce(max(day), public.game_day() - 1) into last_day from public.days;
  d := greatest(last_day + 1, public.game_day());
  while d <= public.game_day() + least(coalesce(p_horizon, 14), 60) loop
    -- Açgözlü seçim, her adımda öncelik sırası:
    --   1) henüz olmayan zorunlu zorluk (en az bir kolay ve en az bir zor),
    --   2) henüz olmayan bölge, 3) henüz olmayan dönem, 4) rastgele.
    -- Havuz yetmezse kurallar kendiliğinden gevşer. Rastgele eşitlik bozma yüzünden tek deneme köşeye
    -- sıkışabildiği için birkaç deneme yapılır, en iyisi alınır (kolay+zor > farklı bölge > farklı dönem).
    -- (Eski 3 geçişli döngüde 2. geçiş hiç gevşemiyordu ve kolay/zor şartı 2. geçişte tamamen düşüyordu.)
    best := null; best_score := -1;
    for attempt in 1..25 loop
      picked := '{}'; regions := '{}'; eras := '{}'; diffs := '{}';
      for k in 1..5 loop
        select p.id, p.region, public.era_of(p.year) as era, p.difficulty::text as difficulty into cand
          from public.photos p
         where p.pool = 'daily' and p.status = 'onayli' and p.scheduled_date is null
           and p.image_path is not null and p.id <> all(picked)
         order by
           (p.difficulty in ('kolay', 'zor') and not (p.difficulty::text = any(diffs))) desc,
           (p.region = any(regions)),
           (public.era_of(p.year) = any(eras)),
           random()
         limit 1;
        exit when not found;
        picked := picked || cand.id; regions := regions || cand.region; eras := eras || cand.era;
        diffs := diffs || cand.difficulty;
      end loop;
      exit when coalesce(array_length(picked, 1), 0) < 5;   -- havuz bitti (her denemede aynı)
      score := case when 'kolay' = any(diffs) then 1000 else 0 end + case when 'zor' = any(diffs) then 1000 else 0 end
             + 10 * (select count(distinct x) from unnest(regions) x) + (select count(distinct x) from unnest(eras) x);
      if score > best_score then best := picked; best_score := score; end if;
      exit when best_score = 2055;                          -- kolay + zor, 5 bölge, 5 dönem
    end loop;
    exit when best is null;                                 -- havuz bitti
    picked := best;

    insert into public.days(day, number) values (d, public.day_number(d));
    slot := 0;
    for cand in
      select p.id from public.photos p where p.id = any(picked)
       order by case p.difficulty when 'kolay' then 0 when 'orta' then 1 else 2 end, random()
    loop
      slot := slot + 1;
      insert into public.day_photos(day, slot, photo_id) values (d, slot, cand.id);
      update public.photos set status = 'yayinda', scheduled_date = d where id = cand.id;
    end loop;
    created := created + 1;
    d := d + 1;
  end loop;
  return created;
end $$;

create or replace function private.daily_ops() returns void
language plpgsql security definer set search_path = public as $$
declare ahead int; left_photos int;
begin
  perform public.schedule_days(14);
  select count(*) into ahead from public.days where day > public.game_day();
  select count(*) into left_photos from public.photos where pool = 'daily' and status = 'onayli' and scheduled_date is null;
  if ahead < 7 then
    perform private.notify_admin('📅 Program azaldı: ' || ahead || ' gün ileri planlı, ' || left_photos || ' onaylı fotoğraf kaldı.');
  end if;
end $$;

-- pg_cron: 01:00 UTC = 04:00 TSİ
select cron.schedule('daily-ops', '0 1 * * *', $$select private.daily_ops()$$);
select cron.schedule('duel-tick', '5 seconds', $$select private.duel_tick()$$);
