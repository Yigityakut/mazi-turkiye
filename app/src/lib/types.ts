export type Answer = {
  photo_id: string; lat: number; lng: number; year: number; year_uncertainty: number;
  location_name: string; province: string | null; region: string; title: string | null; story: string | null;
  author: string; source_name: string; source_url: string; license_code: string; license_url: string | null;
  image_path: string; width: number; height: number; difficulty: "kolay" | "orta" | "zor";
};
export type Play = {
  guess_lat: number; guess_lng: number; guess_year: number; distance_km: number; year_diff: number;
  score_location: number; score_year: number; hint_location: boolean; hint_year: boolean; answer: Answer;
};
export type DayPhoto = { slot: number; image_path: string; width: number; height: number; play: Play | null; hints: ("year" | "location")[] };
export type Day = {
  day: string; number: number; mode: "daily" | "challenge" | "archive"; is_today: boolean; next_rollover: string;
  min_year: number; max_year: number; photos: DayPhoto[]; result: { total: number; used_hint: boolean } | null;
};
export type GuessResult = {
  slot: number; distance_km: number; year_diff: number; score_location: number; score_year: number; score: number;
  hint_location: boolean; hint_year: boolean; answer: Answer; day_complete: boolean; day_total: number; played: number;
};
export type Streak = { current: number; best: number; played_today: boolean };
export type Me = {
  id: string; nickname: string | null; is_pro: boolean; is_admin: boolean; elo: number; show_on_leaderboard: boolean;
  reminder_hour: number | null; streak: Streak; today: string; today_number: number; next_rollover: string;
  today_result: { total: number } | null; today_played: number; duels_today: number; free_duels_per_day: number;
  days_completed: number;
};
export type LeaderRow = { rank: number; name: string; total: number; used_hint: boolean; is_me: boolean };
export type Leaderboard = { scope: string; rows: LeaderRow[]; me: { rank: number; total: number } | null; players: number };
export type Stats = {
  days: number; avg_total: number; best_total: number; streak: Streak; full: boolean;
  recent: { day: string; number: number; total: number }[];
  by_era: { key: string; count: number; avg_year_diff: number; avg_score_year: number }[];
  by_region: { key: string; count: number; avg_km: number; avg_score_location: number }[];
};
export type Challenge = {
  code: string; day: string; number: number; creator_name: string; creator_total: number; is_mine: boolean;
  my_total: number | null; slots: { slot: number; creator: number; me: number | null }[] | null;
};
export type DuelGuess = { lat?: number; lng?: number; year?: number; distance_km?: number; year_diff?: number; score: number };
export type DuelState = {
  id: string; phase: "countdown" | "guessing" | "reveal" | "finished"; round: number; server_now: string;
  round_started_at: string; round_deadline: string; reveal_until: string | null;
  opponent: { name: string; elo: number | null; guessed: boolean };
  photo: { image_path: string; width: number; height: number } | null;
  my_guess: { lat: number; lng: number; year: number } | null;
  reveal: { answer: Answer; me: DuelGuess; opp: DuelGuess } | null;
  score_me: number; score_opp: number;
  rounds: { round: number; me: number | null; opp: number | null }[];
  result: { outcome: "win" | "loss" | "draw"; elo_before: number; elo_after: number } | null;
};
export type Source = {
  day: string; number: number; slot: number; title: string | null; location_name: string; year: number; author: string;
  source_name: string; source_url: string; license_code: string; license_url: string | null; image_path: string;
};
