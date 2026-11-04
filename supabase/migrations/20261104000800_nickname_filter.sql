-- Mazi Türkiye · takma ad içerik denetimi sunucuda (QA O7; App Store 1.2, Play UGC)
-- İstemcideki süzgecin (app/src/lib/nickname.ts) birebir kopyası: istemci atlanırsa da kaba ad kaydedilemez.
-- Liste değişirse İKİ yer birlikte güncellenir (bu fonksiyon + nickname.ts); test: supabase/tests "nickname filter".
--
-- Normalleştirme: Türkçe büyük harfler önce küçüğe (I→ı, İ→i; veritabanı yereline bağlı kalmasın), sonra
-- ı→i, ş→s, ğ→g, ü→u, ö→o, ç→c, â/î/û, 0→o, 1→i, 3→e, 4→a, 5→s, 7→t, @→a, $→s, !→i, |→i.
-- Uzatılmış harfler kısaltılır ("fuuuck" → "fuck"); çift harfli kökler için üç+ tekrar ikiye indirilir ("yarrrak" → "yarrak").
-- ANYWHERE kökleri adın içinde herhangi bir yerde, WHOLE kökleri yalnızca tam kelime / adın tamamı olarak aranır
-- ("Işık", "Nigar", "Amina", "fukara" geçer).

create or replace function private.nick_fold(t text, w text) returns text
language sql immutable set search_path = '' as $$
  select case when w ~ '(.)\1'
    then regexp_replace(t, '(.)\1{2,}', '\1\1', 'g')
    else regexp_replace(t, '(.)\1+', '\1', 'g') end
$$;

create or replace function private.is_offensive_nickname(name text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  anywhere constant text[] := array[
    -- Türkçe
    'orospu', 'orosbu', 'siktir', 'sikerim', 'sikeyim', 'yarrak', 'amcik', 'aminako', 'aminak', 'pezevenk', 'kahpe',
    'kaltak', 'yavsak', 'serefsiz', 'gavat', 'ibne', 'dalyarak', 'gotveren', 'gotlek', 'fahise', 'surtuk', 'kancik',
    -- İngilizce
    'fuck', 'shit', 'bitch', 'cunt', 'nigger', 'faggot', 'whore', 'slut', 'pussy', 'porn', 'hitler'];
  whole constant text[] := array[
    'am', 'amk', 'aq', 'mk', 'sik', 'sikik', 'sikis', 'got', 'oc', 'pic', 'pust', 'yarak', 'tasak',
    'fag', 'dick', 'cock', 'rape', 'nazi', 'sex', 'seks', 'cum', 'kys'];
  norm text;
  joined text;
  words text[];
  w text;
  x text;
begin
  if name is null then return false; end if;
  norm := pg_catalog.translate(
    pg_catalog.lower(pg_catalog.translate(pg_catalog.btrim(name), 'IİŞĞÜÖÇÂÎÛ', 'ıişğüöçâîû')),
    'ışğüöçâîû013457@$!|', 'isguocaiuoieastasii');
  joined := pg_catalog.regexp_replace(norm, '[^a-z]', '', 'g');
  if joined = '' then return false; end if;
  words := pg_catalog.array_remove(pg_catalog.regexp_split_to_array(norm, '[^a-z]+'), '');
  foreach w in array anywhere loop
    if pg_catalog.strpos(private.nick_fold(joined, w), w) > 0 then return true; end if;
  end loop;
  foreach w in array whole loop
    if private.nick_fold(joined, w) = w then return true; end if;
    foreach x in array words loop
      if private.nick_fold(x, w) = w then return true; end if;
    end loop;
  end loop;
  return false;
end $$;

revoke all on function private.nick_fold(text, text) from public;
revoke all on function private.is_offensive_nickname(text) from public;

-- update_profile: 20261104000200_game.sql'deki gövde + kaba kelime denetimi (bad_nickname_word).
-- İstemci `ERRORS.bad_nickname_word` ile "Bu takma ad kullanılamıyor…" gösterir.
create or replace function public.update_profile(p jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := private.require_user();
  nick text;
begin
  if p is null or jsonb_typeof(p) <> 'object' then raise exception 'bad_profile'; end if;
  if p ? 'nickname' then
    -- Doğrulama kırpılmış değer üzerinde yapılır (" a " kırpılınca 1 karakter kalır → check ihlali yerine bad_nickname)
    nick := nullif(btrim(p->>'nickname'), '');
    if nick is not null and nick !~ '^[[:alnum:]çğıöşüÇĞİÖŞÜ _.\-]{2,20}$' then
      raise exception 'bad_nickname';
    end if;
    if nick is not null and private.is_offensive_nickname(nick) then
      raise exception 'bad_nickname_word';
    end if;
    update public.profiles set nickname = nick where id = uid;
  end if;
  if p ? 'push_token' then
    if jsonb_typeof(p->'push_token') not in ('string', 'null') or char_length(p->>'push_token') > 255 then
      raise exception 'bad_push_token';
    end if;
    update public.profiles set push_token = nullif(p->>'push_token', '') where id = uid;
  end if;
  if p ? 'reminder_hour' then
    if jsonb_typeof(p->'reminder_hour') <> 'null' and coalesce(p->>'reminder_hour', '') !~ '^\d{1,2}$' then
      raise exception 'bad_reminder_hour';
    end if;
    -- null = hatırlatma kapalı (greatest(null, 9) = 9 olduğundan null ayrıca ele alınır)
    update public.profiles set reminder_hour = case when p->>'reminder_hour' is not null
      then least(greatest((p->>'reminder_hour')::int, 9), 23) end where id = uid;
  end if;
  if p ? 'show_on_leaderboard' then
    if jsonb_typeof(p->'show_on_leaderboard') <> 'boolean' then raise exception 'bad_show_on_leaderboard'; end if;
    update public.profiles set show_on_leaderboard = (p->>'show_on_leaderboard')::boolean where id = uid;
  end if;
end $$;
