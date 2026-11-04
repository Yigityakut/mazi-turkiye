import { Platform } from "react-native";
import { haversine, scoreLocation, scoreYear, type LatLng } from "./geo";
import type { Answer, Challenge, Day, DayPhoto, DuelGuess, DuelState, GuessResult, Leaderboard, Me, Play, Source, Stats } from "./types";

/**
 * Demo modu: mağaza ekran görüntüleri için sunucusuz, sabit verili oyun.
 * Sadece `EXPO_PUBLIC_DEMO=1` ile yapılan derlemede açılır. Üretimde `DEMO` derleme anında `false` olur ve
 * buradaki hiçbir kod çalışmaz (api.ts, supabase.ts, appState.tsx ve birkaç ekran sadece `if (DEMO)` ile bakar).
 *
 * Fotoğraf künyeleri `store/screenshots/fixtures.json` dosyasından gelir; `store/screenshots/prepare.mjs`
 * bu dosyayı ve fotoğrafları `app/public/demo/` altına koyar, web derlemesinde `/demo/...` adresinden sunulur.
 * Bu yüzden demo modu web içindir.
 *
 * Web'de ekran durumu adres satırıyla sabitlenir (ekran görüntüleri her seferinde aynı çıksın diye):
 *   /?demo_state=done                         ana ekran, bugünün turu bitmiş
 *   /play?demo_state=guess                    3. fotoğraf, iğne bırakılmış ve yıl seçilmiş
 *   /play?demo_state=reveal                   aynı tahminin açılımı
 *   /play?demo_state=fresh                    günün ilk fotoğrafı, boş harita
 *   /summary?demo_state=done&challenge=MZ7K2Q gün özeti + meydan okuma karşılaştırması
 *   /duel/demo?phase=countdown|guessing|reveal|finished
 *   /stats, /leaderboard, /pro, /sources      sabit veriyle
 *   &demo_pro=1                               kullanıcıyı Pro göster
 * Zamanla ilgili her şey `Date.now()`'a göre hesaplanır; ekran görüntüsü aracı saati sabitler.
 */
export const DEMO = process.env.EXPO_PUBLIC_DEMO === "1";

export type DemoFixture = {
  file: string; commons_url?: string; year: number; location_name: string; province: string | null; region: string;
  lat: number; lng: number; author: string; source_name: string; license_code: string; license_url?: string | null;
  source_url?: string; title: string | null; story: string | null; width?: number; height?: number;
};

const CHALLENGE_CODE = "MZ7K2Q";
const DAY_NUMBER = 38;
const ME_NAME = "Deniz";
const OPPONENT = { name: "Çağla", elo: 1212 };
const FRIEND = "Ayşe";
const HOUR = 3600_000;

/** Günün 5 fotoğrafı için tahminlerin doğru cevaptan sapması (km, yıl). Puanlar gerçek formülle hesaplanır. */
const DAY_MISS: { km: number; years: number }[] = [
  { km: 12, years: 1 }, { km: 64, years: 6 }, { km: 27, years: -2 }, { km: 110, years: 4 }, { km: 8, years: 0 },
];
/** Arkadaşın (meydan okuyan) aynı 5 fotoğraftaki puanları */
const FRIEND_SCORES = [760, 702, 655, 498, 897];
/** 1v1: önceki iki turun puanları ve açılan turdaki sapmalar */
const DUEL_PREV = [{ me: 742, opp: 655 }, { me: 610, opp: 701 }];
const DUEL_ME = { km: 41, years: 3, bearing: 0 };
const DUEL_OPP = { km: 160, years: -12, bearing: 100 };
const DUEL_LATER = [{ me: 688, opp: 604 }, { me: 815, opp: 590 }];

// ---------------------------------------------------------------- yardımcılar

export function demoParam(name: string): string | null {
  if (Platform.OS !== "web" || typeof location === "undefined") return null;
  return new URLSearchParams(location.search).get(name);
}
const demoState = () => demoParam("demo_state");

let fixtures: DemoFixture[] = [];
let loading: Promise<DemoFixture[]> | null = null;
function loadFixtures() {
  loading ??= fetch("/demo/fixtures.json")
    .then((r) => { if (!r.ok) throw new Error(`demo fixtures: ${r.status}`); return r.json() as Promise<DemoFixture[]>; })
    .then((list) => { if (list.length < 6) throw new Error("demo fixtures: en az 6 fotoğraf gerekir"); fixtures = list; return list; })
    .catch((e) => { loading = null; throw e; });
  return loading;
}

/** Türkiye'nin ortasına (39°K, 35°D) doğru `km` kadar kaydırılmış nokta: tahminler denize düşmesin diye içeri doğru. */
function shift(at: LatLng, km: number, bearingOffsetDeg = 0): LatLng {
  const toward = { lat: 39.0 - at.lat, lng: (35.0 - at.lng) * Math.cos((at.lat * Math.PI) / 180) };
  const base = Math.atan2(toward.lng, toward.lat);
  const b = base + (bearingOffsetDeg * Math.PI) / 180;
  const dLat = (km / 111.2) * Math.cos(b);
  const dLng = (km / (111.2 * Math.cos((at.lat * Math.PI) / 180))) * Math.sin(b);
  return { lat: at.lat + dLat, lng: at.lng + dLng };
}

function answerOf(f: DemoFixture, id: string): Answer {
  const file = f.commons_url ? decodeURIComponent(f.commons_url.split("/").pop() ?? "") : "";
  return {
    photo_id: id, lat: f.lat, lng: f.lng, year: f.year, year_uncertainty: 0,
    location_name: f.location_name, province: f.province, region: f.region, title: f.title, story: f.story,
    author: f.author, source_name: f.source_name,
    source_url: f.source_url ?? (file ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}` : "https://commons.wikimedia.org"),
    license_code: f.license_code, license_url: f.license_url ?? null,
    image_path: f.file, width: f.width ?? 1600, height: f.height ?? 1067, difficulty: "orta",
  };
}

function score(answer: Answer, guess: LatLng, year: number) {
  const distance_km = haversine(guess, { lat: answer.lat, lng: answer.lng });
  const year_diff = Math.abs(year - answer.year);
  return { distance_km, year_diff, score_location: scoreLocation(distance_km), score_year: scoreYear(year_diff) };
}

function dayGuess(slot: number) {
  const a = answerOf(fixtures[slot - 1], `demo-${slot}`);
  const miss = DAY_MISS[slot - 1];
  return { answer: a, pin: shift(a, miss.km), year: a.year + miss.years };
}

function playFor(slot: number): Play {
  const g = dayGuess(slot);
  const s = score(g.answer, g.pin, g.year);
  return { guess_lat: g.pin.lat, guess_lng: g.pin.lng, guess_year: g.year, ...s, hint_location: false, hint_year: false, answer: g.answer };
}

function clock() {
  const now = Date.now();
  // Gün İstanbul saatiyle 04:00'te döner (UTC+3, yaz saati yok)
  const tr = new Date(now + 3 * HOUR);
  const today = tr.toISOString().slice(0, 10);
  let rollover = Date.UTC(tr.getUTCFullYear(), tr.getUTCMonth(), tr.getUTCDate(), 1, 0, 0);
  if (rollover <= now) rollover += 24 * HOUR;
  return { now, today, next_rollover: new Date(rollover).toISOString() };
}

// ---------------------------------------------------------------- oturum içi durum

/** Bu oturumda oynanan fotoğraflar; ilk yüklemede adres satırındaki duruma göre doldurulur. */
let played: Map<number, Play> | null = null;
function playedSlots() {
  if (!played) {
    played = new Map();
    const st = demoState();
    const pre = st === "done" ? 5 : st === "fresh" ? 0 : 2;
    for (let s = 1; s <= pre; s++) played.set(s, playFor(s));
  }
  return played;
}

/**
 * Oyun ekranı için hazır tahmin (`?demo_state=guess|reveal`). `reveal` ise ekran tahmini kendisi gönderir.
 * Sadece api.day() yüklendikten sonra çağrılır.
 */
export function demoGuess(slot: number): { pin: LatLng; year: number; reveal: boolean } | null {
  const st = demoState();
  if (!DEMO || (st !== "guess" && st !== "reveal") || !fixtures[slot - 1]) return null;
  const g = dayGuess(slot);
  return { pin: g.pin, year: g.year, reveal: st === "reveal" };
}

// ---------------------------------------------------------------- RPC karşılıkları

function me(): Me {
  const c = clock();
  // Ana ekran tek başına açıldıysa bugün hiç oynanmamış görünür; oyun ekranından dönülünce o anki ilerleme.
  const pl = played ?? (demoState() === "done" ? playedSlots() : null);
  const n = pl?.size ?? 0;
  const done = n === 5;
  const total = pl ? [...pl.values()].reduce((s, p) => s + p.score_location + p.score_year, 0) : 0;
  return {
    id: "00000000-0000-4000-8000-00000000d3e0", nickname: ME_NAME, is_pro: demoParam("demo_pro") === "1", is_admin: false,
    elo: 1184, show_on_leaderboard: true, reminder_hour: 20,
    streak: { current: done ? 13 : 12, best: 19, played_today: done },
    today: c.today, today_number: DAY_NUMBER, next_rollover: c.next_rollover,
    today_result: done ? { total } : null, today_played: n,
    duels_today: 0, free_duels_per_day: 3, days_completed: 31,
  };
}

function day(challenge: string | null): Day {
  const c = clock();
  const pl = playedSlots();
  const photos: DayPhoto[] = [1, 2, 3, 4, 5].map((slot) => {
    const f = fixtures[slot - 1];
    return { slot, image_path: f.file, width: f.width ?? 1600, height: f.height ?? 1067, play: pl.get(slot) ?? null, hints: [] };
  });
  const total = [...pl.values()].reduce((s, p) => s + p.score_location + p.score_year, 0);
  return {
    day: c.today, number: DAY_NUMBER, mode: challenge ? "challenge" : "daily", is_today: true, next_rollover: c.next_rollover,
    min_year: 1880, max_year: 2025, photos, result: pl.size === 5 ? { total, used_hint: false } : null,
  };
}

function guess(a: Record<string, unknown>): GuessResult {
  const slot = Number(a.p_slot);
  const answer = answerOf(fixtures[slot - 1], `demo-${slot}`);
  const pin = { lat: Number(a.p_lat), lng: Number(a.p_lng) };
  const year = Number(a.p_year);
  const s = score(answer, pin, year);
  const pl = playedSlots();
  pl.set(slot, { guess_lat: pin.lat, guess_lng: pin.lng, guess_year: year, ...s, hint_location: false, hint_year: false, answer });
  const day_total = [...pl.values()].reduce((x, p) => x + p.score_location + p.score_year, 0);
  return { slot, ...s, score: s.score_location + s.score_year, hint_location: false, hint_year: false, answer,
    day_complete: pl.size === 5, day_total, played: pl.size };
}

function stats(): Stats {
  const totals = [3120, 3480, 2950, 3710, 4105, 3390, 2870, 3655, 3940, 3205, 4420, 3580, 3815, 4705];
  const c = clock();
  return {
    days: 31, avg_total: 3412, best_total: 4705, streak: { current: 12, best: 19, played_today: false }, full: true,
    recent: totals.map((total, i) => ({
      day: new Date(Date.parse(c.today) - (totals.length - i) * 24 * HOUR).toISOString().slice(0, 10),
      number: DAY_NUMBER - totals.length + i, total,
    })),
    by_era: [
      { key: "1880-1919", count: 22, avg_year_diff: 11.4, avg_score_year: 212 },
      { key: "1920-1949", count: 34, avg_year_diff: 7.9, avg_score_year: 268 },
      { key: "1950-1979", count: 51, avg_year_diff: 4.2, avg_score_year: 362 },
      { key: "1980-1999", count: 29, avg_year_diff: 3.1, avg_score_year: 391 },
      { key: "2000-", count: 19, avg_year_diff: 2.2, avg_score_year: 431 },
    ],
    by_region: [
      { key: "Marmara", count: 41, avg_km: 38, avg_score_location: 402 },
      { key: "Ege", count: 27, avg_km: 61, avg_score_location: 344 },
      { key: "İç Anadolu", count: 22, avg_km: 84, avg_score_location: 301 },
      { key: "Akdeniz", count: 18, avg_km: 97, avg_score_location: 286 },
      { key: "Karadeniz", count: 15, avg_km: 118, avg_score_location: 248 },
      { key: "Güneydoğu Anadolu", count: 18, avg_km: 142, avg_score_location: 221 },
      { key: "Doğu Anadolu", count: 14, avg_km: 171, avg_score_location: 192 },
    ],
  };
}

function leaderboard(scope: string): Leaderboard {
  // Ekran görüntülerinde toplam oyuncu sayısı gösterilmez (uydurma kullanıcı sayısı yok): "bugün" ve "hafta"da `me` boş.
  const rows = [
    { name: FRIEND, total: 4120 }, { name: ME_NAME, total: 3889, is_me: true }, { name: "Mert", total: 3640 },
    { name: "Gökçe", total: 3512, used_hint: true }, { name: "İlker", total: 3305 }, { name: "Şule", total: 2980 },
  ].map((r, i) => ({ rank: i + 1, name: r.name, total: r.total, used_hint: !!r.used_hint, is_me: !!r.is_me }));
  return scope === "friends"
    ? { scope, rows, me: { rank: 2, total: 3889 }, players: rows.length }
    : { scope, rows: rows.map((r) => ({ ...r, is_me: false })), me: null, players: 0 };
}

function challenge(code: string): Challenge {
  const pl = playedSlots();
  const mine = pl.size === 5 ? [...pl.values()].reduce((s, p) => s + p.score_location + p.score_year, 0) : null;
  return {
    code, day: clock().today, number: DAY_NUMBER, creator_name: FRIEND, creator_total: FRIEND_SCORES.reduce((a, b) => a + b, 0),
    is_mine: false, my_total: mine,
    slots: FRIEND_SCORES.map((creator, i) => {
      const p = pl.get(i + 1);
      return { slot: i + 1, creator, me: p ? p.score_location + p.score_year : null };
    }),
  };
}

let duelMyGuess: { lat: number; lng: number; year: number } | null = null;
function duelState(id: string): DuelState {
  const now = Date.now();
  const phase = (demoParam("phase") ?? demoParam("demo_state") ?? "guessing") as DuelState["phase"];
  const f = fixtures[5];
  const answer = answerOf(f, "demo-duel");
  const at = { lat: f.lat, lng: f.lng };
  const mk = (m: { km: number; years: number; bearing: number }): DuelGuess => {
    const p = shift(at, m.km, m.bearing);
    const s = score(answer, p, f.year + m.years);
    return { lat: p.lat, lng: p.lng, year: f.year + m.years, distance_km: s.distance_km, year_diff: s.year_diff, score: s.score_location + s.score_year };
  };
  const meG = mk(DUEL_ME), oppG = mk(DUEL_OPP);
  const prevMe = DUEL_PREV.reduce((s, r) => s + r.me, 0), prevOpp = DUEL_PREV.reduce((s, r) => s + r.opp, 0);
  const iso = (t: number) => new Date(t).toISOString();
  const base: DuelState = {
    id, phase, round: 3, server_now: iso(now), round_started_at: iso(now - 17_000), round_deadline: iso(now + 28_000), reveal_until: null,
    opponent: { name: OPPONENT.name, elo: OPPONENT.elo, guessed: phase === "guessing" },
    photo: { image_path: f.file, width: f.width ?? 1600, height: f.height ?? 1067 },
    my_guess: phase === "guessing" ? duelMyGuess : null, reveal: null,
    score_me: prevMe, score_opp: prevOpp,
    rounds: [...DUEL_PREV.map((r, i) => ({ round: i + 1, ...r })), { round: 3, me: null, opp: null }],
    result: null,
  };
  if (phase === "countdown") return { ...base, round: 1, round_started_at: iso(now + 3_000), round_deadline: iso(now + 48_000), photo: null, score_me: 0, score_opp: 0, rounds: [] };
  if (phase === "reveal") {
    return { ...base, reveal_until: iso(now + 6_000), photo: null, reveal: { answer, me: meG, opp: oppG },
      score_me: prevMe + meG.score, score_opp: prevOpp + oppG.score,
      rounds: [...DUEL_PREV.map((r, i) => ({ round: i + 1, ...r })), { round: 3, me: meG.score, opp: oppG.score }] };
  }
  if (phase === "finished") {
    const rounds = [...DUEL_PREV, { me: meG.score, opp: oppG.score }, ...DUEL_LATER].map((r, i) => ({ round: i + 1, ...r }));
    return { ...base, round: 5, photo: null, score_me: rounds.reduce((s, r) => s + r.me, 0), score_opp: rounds.reduce((s, r) => s + r.opp, 0),
      rounds, result: { outcome: "win", elo_before: 1184, elo_after: 1203 } };
  }
  return base;
}

function sources(): Source[] {
  const c = clock();
  return fixtures.map((f, i) => {
    const a = answerOf(f, `demo-${i + 1}`);
    return { day: c.today, number: DAY_NUMBER, slot: i + 1, title: f.title, location_name: f.location_name, year: f.year, author: f.author,
      source_name: f.source_name, source_url: a.source_url, license_code: f.license_code, license_url: a.license_url, image_path: f.file };
  });
}

/** api.ts'deki `rpc()`'nin demo karşılığı. Ağ yok, oturum yok. */
export async function demoRpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  await loadFixtures();
  const r = ((): unknown => {
    switch (fn) {
      case "get_me": return me();
      case "get_day": return day((args.p_challenge as string | null) ?? null);
      case "submit_guess": return guess(args);
      case "use_hint": {
        const f = fixtures[Number(args.p_slot) - 1];
        const d = Math.floor(f.year / 10) * 10;
        return { kind: args.p_kind, text: args.p_kind === "year" ? `${d}'${[0, 20, 50, 70, 80].includes(d % 100) ? "ler" : "lar"}` : `${f.region} Bölgesi` };
      }
      case "get_stats": return stats();
      case "leaderboard": return leaderboard(String(args.p_scope));
      case "create_challenge": {
        const d = day(null);
        return { code: CHALLENGE_CODE, url: `https://maziturkiye.com/m/${CHALLENGE_CODE}`, number: DAY_NUMBER, total: d.result?.total ?? 0 };
      }
      case "get_challenge": return challenge(String(args.p_code ?? CHALLENGE_CODE));
      case "list_sources": return Number(args.p_offset ?? 0) > 0 ? [] : sources();
      case "duel_find": return { status: "matched", duel_id: "demo" };
      case "duel_queue_status": return { status: "matched", duel_id: "demo", waited: 4 };
      case "duel_admin_join": return { status: "matched", duel_id: "demo" };
      case "duel_state": return duelState(String(args.p_duel));
      case "duel_guess": {
        duelMyGuess = { lat: Number(args.p_lat), lng: Number(args.p_lng), year: Number(args.p_year) };
        return duelState(String(args.p_duel));
      }
      case "update_profile": case "report_photo": case "duel_cancel": return null;
      case "create_merge_ticket": return "demo";
      case "redeem_merge_ticket": return { moved: 0 };
      default: throw new Error(`demo: ${fn} desteklenmiyor`);
    }
  })();
  return r as T;
}
