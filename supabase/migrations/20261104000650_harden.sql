-- Güvenlik danışmanı: search_path'i sabitlenmemiş yardımcı fonksiyonlar
alter function public.game_day(timestamptz) set search_path = public;
alter function public.next_rollover(timestamptz) set search_path = public;
alter function public.haversine_km(float8, float8, float8, float8) set search_path = public;
alter function public.score_location(float8, boolean) set search_path = public;
alter function public.score_year(int, boolean) set search_path = public;
alter function public.era_of(int) set search_path = public;
alter function public.decade_label(int) set search_path = public;
alter function public.day_number(date) set search_path = public;
alter function private.require_user() set search_path = public;
alter function private.photo_answer(public.photos) set search_path = public;
alter function private.display_name(public.profiles) set search_path = public;
alter function private.cfg_int(text) set search_path = public;
alter function private.gauss() set search_path = public;
alter function private.player_skill(uuid) set search_path = public;
alter function private.require_service() set search_path = public;
