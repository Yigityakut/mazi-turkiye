-- Mazi Türkiye · `duel_matched` analitik olayı sunucudan (QA D11, Plan 10.2)
-- Rakip türü (player/admin/bot) istemciye açılmadığı için olay maç oluşturulurken veritabanından gönderilir:
-- duels insert → pg_net → edge function `track-event` → PostHog (POSTHOG_KEY yoksa fonksiyon atlar).
-- distinct_id = Supabase kullanıcı kimliği (istemcideki PostHog identify ile aynı kişi).

create or replace function private.track_events(events jsonb)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare url text; secret text;
begin
  if events is null or jsonb_array_length(events) = 0 then return; end if;
  select value into url from private.secrets where key = 'functions_url';
  select value into secret from private.secrets where key = 'internal_secret';
  if url is null or secret is null then return; end if;
  perform net.http_post(
    url := url || '/track-event',
    body := jsonb_build_object('events', events),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', secret),
    timeout_milliseconds := 5000);
end $$;
revoke all on function private.track_events(jsonb) from public;

create or replace function private.duels_track_matched()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ev jsonb;
  b_wait int;
begin
  ev := jsonb_build_array(jsonb_build_object(
    'distinct_id', new.player_a, 'event', 'duel_matched',
    'properties', jsonb_build_object('opponent_type', new.opponent_kind, 'wait_s', coalesce(new.wait_seconds, 0))));
  -- İkinci oyuncu: gerçek oyuncu eşleşmesinde onun için de olay; admin maçında admin'in kendisi sayılmaz
  if new.player_b is not null and new.opponent_kind = 'player' then
    select extract(epoch from now() - created_at)::int into b_wait
      from public.duel_queue where user_id = new.player_b and status = 'waiting';
    ev := ev || jsonb_build_array(jsonb_build_object(
      'distinct_id', new.player_b, 'event', 'duel_matched',
      'properties', jsonb_build_object('opponent_type', 'player', 'wait_s', coalesce(b_wait, 0))));
  end if;
  perform private.track_events(ev);
  return null;
exception when others then
  -- Analitik maç oluşturmayı asla bozmaz
  raise warning 'duels_track_matched: %', sqlerrm;
  return null;
end $$;
revoke all on function private.duels_track_matched() from public;

create trigger duels_track_matched after insert on public.duels
  for each row when (new.state = 'active') execute function private.duels_track_matched();
