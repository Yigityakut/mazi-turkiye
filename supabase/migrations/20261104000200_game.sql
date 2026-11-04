-- Mazi Türkiye · günlük oyun, ipucu, istatistik, sıralama, meydan okuma
create schema if not exists private;
-- private şeması anon/authenticated rollerine açık değildir (varsayılan yetki yok)

-- Sunucu içi gizli değerler (değerler migration'da değil, ayrı SQL ile yazılır)
create table private.secrets (key text primary key, value text not null);

insert into public.app_config(key, value) values ('launch_date', '"2026-11-24"') on conflict do nothing;

create or replace function public.era_of(y int) returns text language sql immutable as $$
  select case when y < 1920 then '1880-1919' when y < 1950 then '1920-1949' when y < 1980 then '1950-1979'
              when y < 2000 then '1980-1999' else '2000-' end
$$;

-- Türkçe ünlü uyumuyla on yıl etiketi: 1960'lar, 1970'ler, 2000'ler
create or replace function public.decade_label(y int) returns text language sql immutable as $$
  select (y / 10 * 10)::text || case when (y / 10 * 10) % 100 in (0, 20, 50, 70, 80) then '''ler' else '''lar' end
$$;

create or replace function public.day_number(d date) returns int language sql stable as $$
  select (d - (select (value #>> '{}')::date from public.app_config where key = 'launch_date')) + 1
$$;

create or replace function private.require_user() returns uuid language plpgsql stable as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'auth_required' using errcode = '28000'; end if;
  return uid;
end $$;

create or replace function private.is_pro(uid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_pro from public.profiles where id = uid), false)
$$;

-- Bir kullanıcının belirli bir günü oynama hakkı var mı?
-- Bugün: herkes. Geçmiş gün: Pro (arşiv) veya o gün için geçerli bir meydan okuma kodu.
create or replace function private.can_play_day(uid uuid, d date, challenge text) returns public.play_mode
language plpgsql stable security definer set search_path = public as $$
begin
  if d > public.game_day() then raise exception 'day_locked'; end if;
  if not exists (select 1 from public.days where day = d) then raise exception 'day_not_found'; end if;
  if challenge is not null then
    if exists (select 1 from public.challenges where code = upper(challenge) and day = d) then
      return 'challenge';
    end if;
    raise exception 'challenge_not_found';
  end if;
  if d = public.game_day() then return 'daily'; end if;
  if private.is_pro(uid) then return 'archive'; end if;
  raise exception 'pro_required';
end $$;

create or replace function private.photo_answer(p public.photos) returns jsonb language sql stable as $$
  select jsonb_build_object(
    'photo_id', p.id, 'lat', p.lat, 'lng', p.lng, 'year', p.year, 'year_uncertainty', p.year_uncertainty,
    'location_name', p.location_name, 'province', p.province, 'region', p.region, 'title', p.title_tr,
    'story', p.story_tr, 'author', p.author, 'source_name', p.source_name, 'source_url', p.source_url,
    'license_code', p.license_code, 'license_url', p.license_url, 'image_path', p.image_path,
    'width', p.width, 'height', p.height, 'difficulty', p.difficulty)
$$;

-- ---------- Günü getir ----------
create or replace function public.get_day(p_day date default null, p_challenge text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := private.require_user();
  d date := coalesce(p_day, public.game_day());
  mode public.play_mode;
  photos jsonb;
  res public.day_results;
begin
  mode := private.can_play_day(uid, d, p_challenge);
  select jsonb_agg(jsonb_build_object(
      'slot', dp.slot,
      'image_path', p.image_path, 'width', p.width, 'height', p.height,
      'play', case when pl.id is null then null else jsonb_build_object(
          'guess_lat', pl.guess_lat, 'guess_lng', pl.guess_lng, 'guess_year', pl.guess_year,
          'distance_km', round(pl.distance_km::numeric, 1), 'year_diff', pl.year_diff,
          'score_location', pl.score_location, 'score_year', pl.score_year,
          'hint_location', pl.hint_location, 'hint_year', pl.hint_year,
          'answer', private.photo_answer(p)) end,
      'hints', (select coalesce(jsonb_agg(h.kind), '[]'::jsonb) from public.hints h
                where h.user_id = uid and h.day = d and h.slot = dp.slot)
    ) order by dp.slot)
  into photos
  from public.day_photos dp
  join public.photos p on p.id = dp.photo_id
  left join public.plays pl on pl.user_id = uid and pl.day = d and pl.slot = dp.slot
  where dp.day = d;

  select * into res from public.day_results where user_id = uid and day = d;

  return jsonb_build_object(
    'day', d, 'number', public.day_number(d), 'mode', mode,
    'is_today', d = public.game_day(),
    'next_rollover', public.next_rollover(),
    'min_year', (select (value #>> '{}')::int from public.app_config where key = 'min_year'),
    'max_year', extract(year from now())::int,
    'photos', coalesce(photos, '[]'::jsonb),
    'result', case when res.user_id is null then null else jsonb_build_object('total', res.total, 'used_hint', res.used_hint) end
  );
end $$;

-- ---------- İpucu (Pro) ----------
create or replace function public.use_hint(p_day date, p_slot int, p_kind text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := private.require_user();
  p public.photos;
begin
  if not private.is_pro(uid) then raise exception 'pro_required'; end if;
  if p_kind not in ('year', 'location') then raise exception 'bad_kind'; end if;
  if p_day > public.game_day() then raise exception 'day_locked'; end if;
  if exists (select 1 from public.plays where user_id = uid and day = p_day and slot = p_slot) then
    raise exception 'already_played';
  end if;
  select ph.* into p from public.day_photos dp join public.photos ph on ph.id = dp.photo_id
   where dp.day = p_day and dp.slot = p_slot;
  if p.id is null then raise exception 'photo_not_found'; end if;
  insert into public.hints(user_id, day, slot, kind) values (uid, p_day, p_slot, p_kind) on conflict do nothing;
  return jsonb_build_object('kind', p_kind, 'text',
    case when p_kind = 'year' then
      public.decade_label(p.year)
    else p.region || ' Bölgesi' end);
end $$;

-- ---------- Tahmin gönder ----------
create or replace function public.submit_guess(
  p_day date, p_slot int, p_lat float8, p_lng float8, p_year int,
  p_duration_ms int default null, p_challenge text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := private.require_user();
  mode public.play_mode;
  p public.photos;
  d_km float8; dy int; s_loc int; s_year int;
  h_loc boolean; h_year boolean;
  done int; total int; any_hint boolean;
  ch public.challenges;
  min_y int := (select (value #>> '{}')::int from public.app_config where key = 'min_year');
begin
  mode := private.can_play_day(uid, p_day, p_challenge);
  if p_lat not between 35.5 and 42.5 or p_lng not between 25.4 and 45.0 then raise exception 'out_of_bounds'; end if;
  if p_year < min_y or p_year > extract(year from now())::int then raise exception 'bad_year'; end if;

  select ph.* into p from public.day_photos dp join public.photos ph on ph.id = dp.photo_id
   where dp.day = p_day and dp.slot = p_slot;
  if p.id is null then raise exception 'photo_not_found'; end if;

  h_loc := exists (select 1 from public.hints where user_id = uid and day = p_day and slot = p_slot and kind = 'location');
  h_year := exists (select 1 from public.hints where user_id = uid and day = p_day and slot = p_slot and kind = 'year');

  d_km := public.haversine_km(p_lat, p_lng, p.lat, p.lng);
  dy := abs(p_year - p.year);
  if dy <= p.year_uncertainty then dy := 0; end if;
  s_loc := public.score_location(d_km, h_loc);
  s_year := public.score_year(dy, h_year);

  begin
    insert into public.plays(user_id, day, slot, photo_id, mode, guess_lat, guess_lng, guess_year,
                             distance_km, year_diff, score_location, score_year, hint_location, hint_year, duration_ms)
    values (uid, p_day, p_slot, p.id, mode, p_lat, p_lng, p_year, d_km, dy, s_loc, s_year, h_loc, h_year,
            least(greatest(p_duration_ms, 0), 3600000));
  exception when unique_violation then
    raise exception 'already_played';
  end;

  select count(*), sum(score_location + score_year), bool_or(hint_location or hint_year)
    into done, total, any_hint
    from public.plays where user_id = uid and day = p_day;

  if done = 5 then
    insert into public.day_results(user_id, day, mode, total, used_hint, on_time, started_at, challenge_code)
    select uid, p_day, mode, total, any_hint, p_day = public.game_day(), min(created_at), upper(p_challenge)
      from public.plays where user_id = uid and day = p_day
    on conflict (user_id, day) do nothing;

    if p_challenge is not null then
      select * into ch from public.challenges where code = upper(p_challenge);
      if ch.creator_id is not null and ch.creator_id <> uid then
        insert into public.friendships(user_a, user_b)
        values (least(uid, ch.creator_id), greatest(uid, ch.creator_id)) on conflict do nothing;
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'slot', p_slot, 'distance_km', round(d_km::numeric, 1), 'year_diff', dy,
    'score_location', s_loc, 'score_year', s_year, 'score', s_loc + s_year,
    'hint_location', h_loc, 'hint_year', h_year,
    'answer', private.photo_answer(p),
    'day_complete', done = 5, 'day_total', total, 'played', done);
end $$;

-- ---------- Seri ----------
create or replace function public.streak_of(uid uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  today date := public.game_day();
  d date;
  cur int := 0; best int := 0; run int := 0;
  pro boolean := private.is_pro(uid);
  freezes text[] := '{}';
  played date[];
  prev date;
  r date;
begin
  select array_agg(day order by day desc) into played from public.day_results where user_id = uid and on_time;
  if played is null then return jsonb_build_object('current', 0, 'best', 0, 'played_today', false); end if;

  -- Güncel seri: bugünden (oynanmadıysa dünden) geriye
  d := case when played[1] = today then today else today - 1 end;
  loop
    if d = any(played) then
      cur := cur + 1;
    elsif pro and not (to_char(d, 'YYYY-MM') = any(freezes)) and (d - 1) = any(played) then
      freezes := freezes || to_char(d, 'YYYY-MM');   -- Pro: ayda 1 gün kaçırma affı
    else
      exit;
    end if;
    d := d - 1;
  end loop;

  -- En iyi seri (affı saymadan, basit)
  prev := null;
  foreach r in array (select array_agg(x order by x) from unnest(played) x) loop
    if prev is not null and r = prev + 1 then run := run + 1; else run := 1; end if;
    best := greatest(best, run);
    prev := r;
  end loop;

  return jsonb_build_object('current', cur, 'best', greatest(best, cur), 'played_today', played[1] = today);
end $$;

-- ---------- Profil ----------
create or replace function public.get_me()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := private.require_user();
  pr public.profiles;
  today date := public.game_day();
  duels_today int;
begin
  insert into public.profiles(id) values (uid) on conflict do nothing;
  select * into pr from public.profiles where id = uid;
  select count(*) into duels_today from public.duels
   where (player_a = uid or player_b = uid) and public.game_day(created_at) = today;
  return jsonb_build_object(
    'id', uid, 'nickname', pr.nickname, 'is_pro', pr.is_pro, 'is_admin', pr.is_admin, 'elo', pr.elo,
    'show_on_leaderboard', pr.show_on_leaderboard, 'reminder_hour', pr.reminder_hour,
    'streak', public.streak_of(uid),
    'today', today, 'today_number', public.day_number(today), 'next_rollover', public.next_rollover(),
    'today_result', (select jsonb_build_object('total', total) from public.day_results where user_id = uid and day = today),
    'today_played', (select count(*) from public.plays where user_id = uid and day = today),
    'duels_today', duels_today,
    'free_duels_per_day', (select (value #>> '{}')::int from public.app_config where key = 'free_duels_per_day'),
    'days_completed', (select count(*) from public.day_results where user_id = uid));
end $$;

create or replace function public.update_profile(p jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := private.require_user();
begin
  if p ? 'nickname' then
    if (p->>'nickname') is not null and (p->>'nickname') !~ '^[[:alnum:]çğıöşüÇĞİÖŞÜ _.\-]{2,20}$' then
      raise exception 'bad_nickname';
    end if;
    update public.profiles set nickname = nullif(trim(p->>'nickname'), '') where id = uid;
  end if;
  if p ? 'push_token' then update public.profiles set push_token = p->>'push_token' where id = uid; end if;
  if p ? 'reminder_hour' then
    update public.profiles set reminder_hour = least(greatest((p->>'reminder_hour')::int, 9), 23) where id = uid;
  end if;
  if p ? 'show_on_leaderboard' then
    update public.profiles set show_on_leaderboard = (p->>'show_on_leaderboard')::boolean where id = uid;
  end if;
end $$;

-- ---------- İstatistik ----------
create or replace function public.get_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := private.require_user();
  pro boolean := private.is_pro(uid);
  base jsonb; by_era jsonb; by_region jsonb; recent jsonb;
begin
  select jsonb_build_object(
      'days', count(*), 'avg_total', coalesce(round(avg(total)), 0), 'best_total', coalesce(max(total), 0))
    into base from public.day_results where user_id = uid;

  select coalesce(jsonb_agg(x order by x->>'key'), '[]') into by_era from (
    select jsonb_build_object('key', public.era_of(p.year), 'count', count(*),
           'avg_year_diff', round(avg(pl.year_diff), 1), 'avg_score_year', round(avg(pl.score_year))) x
      from public.plays pl join public.photos p on p.id = pl.photo_id
     where pl.user_id = uid group by public.era_of(p.year)) s;

  select coalesce(jsonb_agg(x order by x->>'key'), '[]') into by_region from (
    select jsonb_build_object('key', p.region, 'count', count(*),
           'avg_km', round(avg(pl.distance_km)), 'avg_score_location', round(avg(pl.score_location))) x
      from public.plays pl join public.photos p on p.id = pl.photo_id
     where pl.user_id = uid group by p.region) s;

  select coalesce(jsonb_agg(jsonb_build_object('day', day, 'number', public.day_number(day), 'total', total) order by day), '[]')
    into recent from (select day, total from public.day_results where user_id = uid order by day desc limit 30) s;

  return base || jsonb_build_object('streak', public.streak_of(uid), 'recent', recent, 'full', pro,
    'by_era', case when pro then by_era else '[]'::jsonb end,
    'by_region', case when pro then by_region else '[]'::jsonb end);
end $$;

-- ---------- Sıralama ----------
create or replace function private.display_name(pr public.profiles) returns text language sql immutable as $$
  select coalesce(pr.nickname, 'Oyuncu ' || upper(substr(replace(pr.id::text, '-', ''), 1, 4)))
$$;

create or replace function public.leaderboard(p_scope text default 'today', p_limit int default 50)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := private.require_user();
  today date := public.game_day();
  rows jsonb; me jsonb; total_players int;
begin
  if p_scope not in ('today', 'week', 'friends') then raise exception 'bad_scope'; end if;
  with base as (
    select r.user_id, sum(r.total)::int as total, bool_or(r.used_hint) as used_hint
      from public.day_results r
     where r.on_time
       and case when p_scope = 'week' then r.day > today - 7 else r.day = today end
       and (p_scope <> 'friends' or r.user_id = uid or exists (
             select 1 from public.friendships f
              where (f.user_a = uid and f.user_b = r.user_id) or (f.user_b = uid and f.user_a = r.user_id)))
     group by r.user_id
  ), ranked as (
    select b.*, rank() over (order by b.total desc) as rnk, private.display_name(pr) as name,
           pr.show_on_leaderboard as visible
      from base b join public.profiles pr on pr.id = b.user_id
  )
  select
    (select coalesce(jsonb_agg(jsonb_build_object('rank', rnk, 'name', case when visible or user_id = uid then name else 'Gizli oyuncu' end,
             'total', total, 'used_hint', used_hint, 'is_me', user_id = uid) order by rnk), '[]')
       from (select * from ranked order by rnk limit p_limit) t),
    (select jsonb_build_object('rank', rnk, 'total', total) from ranked where user_id = uid),
    (select count(*) from ranked)
  into rows, me, total_players;
  return jsonb_build_object('scope', p_scope, 'rows', rows, 'me', me, 'players', total_players);
end $$;

-- ---------- Meydan okuma ----------
create or replace function public.create_challenge(p_day date default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := private.require_user();
  d date := coalesce(p_day, public.game_day());
  res public.day_results;
  c text;
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  select * into res from public.day_results where user_id = uid and day = d;
  if res.user_id is null then raise exception 'finish_day_first'; end if;
  select code into c from public.challenges where creator_id = uid and day = d;
  if c is null then
    loop
      c := '';
      for i in 1..6 loop c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
      begin
        insert into public.challenges(code, creator_id, day, creator_total) values (c, uid, d, res.total);
        exit;
      exception when unique_violation then
        if exists (select 1 from public.challenges where creator_id = uid and day = d) then
          select code into c from public.challenges where creator_id = uid and day = d; exit;
        end if;
      end;
    end loop;
  end if;
  return jsonb_build_object('code', c, 'day', d, 'number', public.day_number(d), 'total', res.total,
    'url', (select value #>> '{}' from public.app_config where key = 'public_web_url') || '/m/' || c);
end $$;

create or replace function public.get_challenge(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := private.require_user();
  ch public.challenges;
  creator public.profiles;
  slots jsonb;
begin
  select * into ch from public.challenges where code = upper(trim(p_code));
  if ch.code is null then raise exception 'challenge_not_found'; end if;
  select * into creator from public.profiles where id = ch.creator_id;
  select jsonb_agg(jsonb_build_object('slot', a.slot,
           'creator', a.score_location + a.score_year,
           'me', case when m.id is null then null else m.score_location + m.score_year end) order by a.slot)
    into slots
    from public.plays a left join public.plays m on m.user_id = uid and m.day = a.day and m.slot = a.slot
   where a.user_id = ch.creator_id and a.day = ch.day;
  return jsonb_build_object('code', ch.code, 'day', ch.day, 'number', public.day_number(ch.day),
    'creator_name', private.display_name(creator), 'creator_total', ch.creator_total,
    'is_mine', ch.creator_id = uid,
    'my_total', (select total from public.day_results where user_id = uid and day = ch.day),
    'slots', case when exists (select 1 from public.day_results where user_id = uid and day = ch.day) then slots else null end);
end $$;

-- Web sayfası için (giriş gerektirmez): sadece isim, skor ve gün numarası
create or replace function public.public_challenge(p_code text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('code', c.code, 'number', public.day_number(c.day), 'creator_name', private.display_name(p),
                            'creator_total', c.creator_total)
    from public.challenges c join public.profiles p on p.id = c.creator_id
   where c.code = upper(trim(p_code))
$$;

-- ---------- Fotoğraf bildirme ----------
create or replace function public.report_photo(p_photo_id uuid, p_reason text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := private.require_user(); n int;
begin
  if not exists (select 1 from public.plays where user_id = uid and photo_id = p_photo_id)
     and not exists (select 1 from public.duel_rounds r join public.duels d on d.id = r.duel_id
                      where r.photo_id = p_photo_id and (d.player_a = uid or d.player_b = uid)) then
    raise exception 'not_seen';
  end if;
  insert into public.photo_reports(photo_id, user_id, reason, note) values (p_photo_id, uid, p_reason, left(p_note, 500))
  on conflict do nothing;
  update public.photos set report_count = (select count(*) from public.photo_reports where photo_id = p_photo_id)
   where id = p_photo_id returning report_count into n;
  if n = 3 or p_reason = 'telif' then
    perform private.notify_admin('⚠️ Fotoğraf bildirildi (' || p_reason || ', toplam ' || n || '): ' || p_photo_id);
  end if;
end $$;

-- ---------- Kaynaklar (yayınlanmış fotoğraflar) ----------
create or replace function public.list_sources(p_limit int default 100, p_offset int default 0)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x), '[]') from (
    select jsonb_build_object('day', dp.day, 'number', public.day_number(dp.day), 'slot', dp.slot,
             'title', p.title_tr, 'location_name', p.location_name, 'year', p.year, 'author', p.author,
             'source_name', p.source_name, 'source_url', p.source_url, 'license_code', p.license_code,
             'license_url', p.license_url, 'image_path', p.image_path) x
      from public.day_photos dp join public.photos p on p.id = dp.photo_id
     where dp.day < public.game_day()
     order by dp.day desc, dp.slot
     limit least(p_limit, 500) offset p_offset) s
$$;

-- ---------- Hesap ----------
-- Hesap silme: `delete-account` edge function'ı (auth.admin.deleteUser) yapar; profiles ve bağlı satırlar cascade ile silinir.
alter table public.merge_tickets add column if not exists used_at timestamptz;

create or replace function public.create_merge_ticket()
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := private.require_user(); t uuid;
begin
  insert into public.merge_tickets(anon_user_id) values (uid) returning ticket into t;
  return t;
end $$;

-- Anonim hesabın verisini giriş yapılan hesaba taşır. Çakışan günlerde girişli hesabın verisi kalır.
create or replace function public.redeem_merge_ticket(p_ticket uuid)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  uid uuid := private.require_user();
  old uuid;
  moved int;
begin
  update public.merge_tickets set used_at = now()
   where ticket = p_ticket and used_at is null and created_at > now() - interval '1 hour'
  returning anon_user_id into old;
  if old is null or old = uid then return jsonb_build_object('moved', 0); end if;
  if not exists (select 1 from auth.users where id = old and is_anonymous) then raise exception 'not_anonymous'; end if;

  insert into public.profiles(id) values (uid) on conflict do nothing;
  update public.plays set user_id = uid
   where user_id = old and day not in (select day from public.plays where user_id = uid);
  get diagnostics moved = row_count;
  update public.hints set user_id = uid where user_id = old and day not in (select day from public.hints where user_id = uid);
  update public.day_results set user_id = uid where user_id = old and day not in (select day from public.day_results where user_id = uid);
  update public.challenges set creator_id = uid where creator_id = old and day not in (select day from public.challenges where creator_id = uid);
  insert into public.friendships(user_a, user_b)
    select least(uid, other), greatest(uid, other) from (
      select case when user_a = old then user_b else user_a end as other from public.friendships where old in (user_a, user_b)) s
     where other <> uid on conflict do nothing;
  update public.profiles np set
      is_pro = np.is_pro or op.is_pro,
      pro_since = coalesce(np.pro_since, op.pro_since),
      nickname = coalesce(np.nickname, op.nickname),
      elo = case when np.duels_played >= op.duels_played then np.elo else op.elo end,
      duels_played = np.duels_played + op.duels_played,
      reminder_hour = coalesce(np.reminder_hour, op.reminder_hour),
      push_token = coalesce(op.push_token, np.push_token)
    from public.profiles op where np.id = uid and op.id = old;
  -- Boşalan anonim hesap, Supabase'in anonim kullanıcı temizliğine bırakılır.
  return jsonb_build_object('moved', moved);
end $$;
