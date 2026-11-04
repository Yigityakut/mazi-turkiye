// Mazi Türkiye · Supabase migration scenario tests
// Usage:  cd supabase/tests && npm install && npm test        (add -- -v for the function inventory)
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { applyMigrations, as, createDb, migrationFiles, rpc, rpcRows } from "./harness.mjs";

const VERBOSE = process.argv.includes("-v") || process.argv.includes("--verbose");

// ---------------------------------------------------------------------------
// Tiny test runner
// ---------------------------------------------------------------------------
const results = [];
function section(name) { console.log(`\n## ${name}`); }
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ok    ${name}`);
  } catch (e) {
    results.push({ name, ok: false, e });
    console.log(`  FAIL  ${name}\n        ${String(e.message).split("\n").join("\n        ")}`);
  }
}
async function rejects(promise, re) {
  try { await promise; } catch (e) {
    if (!re.test(e.message)) throw new Error(`expected error ${re}, got: ${e.message}`);
    return e;
  }
  throw new Error(`expected error ${re}, but the call succeeded`);
}

// ---------------------------------------------------------------------------
// DB + helpers
// ---------------------------------------------------------------------------
console.log(`Migrations: ${migrationFiles().join(", ")}`);
const db = await createDb();
await applyMigrations(db, { log: (m) => console.log(`  ${m}`) });
// Testler bugünden itibaren programlar; üretimdeki schedule_start (TestFlight başlangıcı) testte devre dışı.
await db.exec(`update public.app_config set value = '"2000-01-01"' where key = 'schedule_start'`);

const q = async (sql, params) => (await db.query(sql, params)).rows;
const one = async (sql, params) => (await q(sql, params))[0];
const val = async (sql, params) => { const r = await one(sql, params); return r ? Object.values(r)[0] : undefined; };

const ANON = { role: "anon" };
const SERVICE = { role: "service_role" };
const POSTGRES = null; // pg_cron / SQL editor

const R = 6371.0, rad = (x) => (x * Math.PI) / 180;
const hav = (lat1, lng1, lat2, lng2) => 2 * R * Math.asin(Math.sqrt(
  Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2));
const scoreLoc = (d, h = false) => Math.round((d < 1 ? 500 : 500 * Math.exp(-d / 150)) * (h ? 0.7 : 1));
const scoreYear = (dy, h = false) => Math.round((dy === 0 ? 500 : 500 * Math.exp(-Math.abs(dy) / 10)) * (h ? 0.7 : 1));
const decade = (y) => { const d = Math.floor(y / 10) * 10; return `${d}'${[0, 20, 50, 70, 80].includes(d % 100) ? "ler" : "lar"}`; };
const addDays = (iso, n) => { const t = new Date(`${iso}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

const TODAY = await val(`select public.game_day()::text`);
const YESTERDAY = addDays(TODAY, -1);
const CUR_YEAR = new Date().getUTCFullYear();
const notifyCount = () => val(`select count(*)::int from net.http_request_log where url like '%/notify-admin'`);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
const U = {};
async function mkUser(name, { anonymous = false, pro = false, admin = false, elo = null, created = null } = {}) {
  const id = randomUUID();
  await q(`insert into auth.users(id, is_anonymous, email, created_at) values ($1, $2, $3, coalesce($4::timestamptz, now()))`,
    [id, anonymous, anonymous ? null : `${name}@test.local`, created]);
  if (pro) await q(`update public.profiles set is_pro = true, pro_since = now() where id = $1`, [id]);
  if (admin) await q(`update public.profiles set is_admin = true where id = $1`, [id]);
  if (elo) await q(`update public.profiles set elo = $2 where id = $1`, [id, elo]);
  U[name] = { id, who: { role: "authenticated", sub: id } };
  return U[name];
}
for (const n of ["alice", "bob", "dave", "frank", "grace", "henry", "ivan", "judy", "nobody"]) await mkUser(n);
await mkUser("carol", { pro: true });
await mkUser("erin", { anonymous: true });
await mkUser("admin", { admin: true });
await q(`update public.profiles set elo = 1500 where id = $1`, [U.ivan.id]);

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------
const REGIONS = ["Marmara", "Ege", "Akdeniz", "İç Anadolu", "Karadeniz", "Doğu Anadolu", "Güneydoğu Anadolu"];
const ERA_YEARS = [1895, 1932, 1964, 1987, 2009];
const DIFFS = ["kolay", "orta", "zor"];
const provinces = await q(`select name, region, lat, lng from private.provinces order by plate`);
let photoN = 0;
async function mkPhoto({ region, year, difficulty, pool = "daily", status = "onayli", image = true, k = 0, yearUnc = 0, scheduled = null }) {
  const provs = provinces.filter((p) => p.region === region);
  const pv = provs[k % provs.length];
  const id = randomUUID();
  const n = ++photoN;
  await q(
    `insert into public.photos(id, image_path, width, height, year, year_uncertainty, lat, lng, location_name, province, region,
       difficulty, story_tr, title_tr, source_name, source_url, author, license_code, pool, status, scheduled_date)
     values ($1, $2, 1600, 1067, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Wikimedia Commons', 'https://commons.wikimedia.org/x',
             'Yazar', 'CC BY 4.0', $13, $14, $15)`,
    [id, image ? `${id}.jpg` : null, year, yearUnc, +(pv.lat + 0.03).toFixed(5), +(pv.lng - 0.02).toFixed(5),
     `SECRET-LOC-${n}`, pv.name, region, difficulty, `SECRET-STORY-${n}`, `SECRET-TITLE-${n}`, pool, status, scheduled]);
  return id;
}
const photo = (id) => one(`select * from public.photos where id = $1`, [id]);
const dayPhotos = (d) => q(`select dp.slot, p.* from public.day_photos dp join public.photos p on p.id = dp.photo_id
                             where dp.day = $1 order by dp.slot`, [d]);

// 45 approved daily photos spread over regions / eras / difficulties
for (let i = 0; i < 45; i++) {
  await mkPhoto({ region: REGIONS[i % 7], year: ERA_YEARS[i % 5] + (i % 4), difficulty: DIFFS[i % 3], k: i });
}
// 10 duel-pool photos
for (let i = 0; i < 10; i++) await mkPhoto({ region: REGIONS[(i + 3) % 7], year: 1900 + i * 11, difficulty: DIFFS[i % 3], pool: "duel", k: i + 2 });
// Not eligible for scheduling
const candidatePhoto = await mkPhoto({ region: "Ege", year: 1950, difficulty: "kolay", status: "aday" });
const noImagePhoto = await mkPhoto({ region: "Ege", year: 1951, difficulty: "zor", image: false });

// ---------------------------------------------------------------------------
section("Platform / migrations");
// ---------------------------------------------------------------------------
await test("all migrations applied (incl. 0150 fix_core between core and game)", async () => {
  const files = migrationFiles();
  assert.ok(files.includes("20261104000150_fix_core.sql"), "missing 20261104000150_fix_core.sql");
  assert.deepEqual(files, [...files].sort());
});

await test("cron jobs registered with valid schedules", async () => {
  const jobs = Object.fromEntries((await q(`select jobname, schedule from cron.job`)).map((j) => [j.jobname, j.schedule]));
  for (const n of ["daily-ops", "duel-tick", "pipeline-harvest-weekly", "pipeline-ingest-daily", "streak-danger", "weekly-report", "monthly-cleanup"]) {
    assert.ok(jobs[n], `cron job ${n} missing`);
  }
  assert.equal(jobs["duel-tick"], "5 seconds");
});

await test("storage bucket + realtime publication + province seed", async () => {
  assert.equal(await val(`select count(*)::int from storage.buckets where id = 'photos' and public`), 1);
  const pub = (await q(`select tablename from pg_publication_tables where pubname = 'supabase_realtime' order by 1`)).map((r) => r.tablename);
  assert.deepEqual(pub, ["duel_queue"]); // duels satırı istemciye açılmaz
  assert.equal(await val(`select count(*)::int from private.provinces`), 81);
  assert.equal(await val(`select count(*)::int from private.secrets where key in ('internal_secret', 'functions_url')`), 2);
});

// ---------------------------------------------------------------------------
section("Scoring helpers");
// ---------------------------------------------------------------------------
await test("score_location / score_year follow 500·e^(−d/150), 500·e^(−|Δy|/10), hint = ×0.7", async () => {
  for (const d of [0, 0.4, 0.99, 1, 12.5, 150, 600, 1500]) {
    assert.equal(await val(`select public.score_location($1::float8)`, [d]), scoreLoc(d), `d=${d}`);
    assert.equal(await val(`select public.score_location($1::float8, true)`, [d]), scoreLoc(d, true), `hinted d=${d}`);
  }
  for (const dy of [0, 1, 5, 10, 37, 120]) {
    assert.equal(await val(`select public.score_year($1::int)`, [dy]), scoreYear(dy), `dy=${dy}`);
    assert.equal(await val(`select public.score_year($1::int, true)`, [dy]), scoreYear(dy, true), `hinted dy=${dy}`);
  }
  assert.equal(await val(`select public.decade_label(1965)`), "1960'lar");
  assert.equal(await val(`select public.decade_label(1978)`), "1970'ler");
  assert.equal(await val(`select public.decade_label(2003)`), "2000'ler");
});

await test("game_day / next_rollover use Europe/Istanbul −4h", async () => {
  assert.equal(await val(`select public.game_day('2026-11-04 00:59:59+00')::text`), "2026-11-03"); // 03:59 TSİ
  assert.equal(await val(`select public.game_day('2026-11-04 01:00:00+00')::text`), "2026-11-04"); // 04:00 TSİ
  assert.equal(await val(`select public.next_rollover('2026-11-04 12:00:00+00') = '2026-11-05 01:00:00+00'::timestamptz`), true);
});

// ---------------------------------------------------------------------------
section("schedule_days");
// ---------------------------------------------------------------------------
// An already-published past day (yesterday) + a few older days for streak history
const yesterdayIds = [];
for (let i = 0; i < 5; i++) {
  yesterdayIds.push(await mkPhoto({ region: REGIONS[i], year: ERA_YEARS[i] + 2, difficulty: DIFFS[i % 3], status: "yayinda", k: i + 5 }));
}
await test("past day with 5 photos can be stored (schedule lives in day_photos)", async () => {
  await q(`insert into public.days(day, number) select d::date, public.day_number(d::date)
             from generate_series($1::date - 6, $1::date - 1, interval '1 day') d`, [TODAY]);
  for (let i = 0; i < 5; i++) {
    await q(`insert into public.day_photos(day, slot, photo_id) values ($1, $2, $3)`, [YESTERDAY, i + 1, yesterdayIds[i]]);
  }
});

await test("schedule_days refuses anon and authenticated callers", async () => {
  await rejects(rpc(db, ANON, "schedule_days", { p_horizon: 3 }), /forbidden/);
  await rejects(rpc(db, U.alice.who, "schedule_days", { p_horizon: 3 }), /forbidden/);
  await rejects(rpc(db, U.erin.who, "schedule_days", { p_horizon: 3 }), /forbidden/);
});

let scheduled = 0;
await test("schedule_days as service_role schedules today..today+5", async () => {
  scheduled = await rpc(db, SERVICE, "schedule_days", { p_horizon: 5 });
  assert.equal(scheduled, 6);
  const days = (await q(`select day::text as d from public.days where day >= $1 order by day`, [TODAY])).map((r) => r.d);
  assert.deepEqual(days, Array.from({ length: 6 }, (_, i) => addDays(TODAY, i)));
});

await test("each scheduled day: 5 approved daily photos, ≥1 kolay, ≥1 zor, distinct regions & eras, easy→hard order", async () => {
  for (let i = 0; i < 6; i++) {
    const d = addDays(TODAY, i);
    const ps = await dayPhotos(d);
    assert.equal(ps.length, 5, `${d}: ${ps.length} photos`);
    assert.ok(ps.every((p) => p.pool === "daily" && p.status === "yayinda" && p.image_path), `${d}: pool/status`);
    assert.ok(ps.every((p) => p.scheduled_date == null), `${d}: scheduled_date must stay null (core unique constraint)`);
    assert.ok(ps.some((p) => p.difficulty === "kolay"), `${d}: no kolay`);
    assert.ok(ps.some((p) => p.difficulty === "zor"), `${d}: no zor`);
    assert.equal(new Set(ps.map((p) => p.region)).size, 5, `${d}: regions ${ps.map((p) => p.region)}`);
    const eras = await q(`select public.era_of(year) e from public.photos where id = any($1::uuid[])`, [ps.map((p) => p.id)]);
    assert.equal(new Set(eras.map((e) => e.e)).size, 5, `${d}: eras not distinct`);
    const rank = { kolay: 0, orta: 1, zor: 2 };
    for (let s = 1; s < 5; s++) assert.ok(rank[ps[s - 1].difficulty] <= rank[ps[s].difficulty], `${d}: slot order`);
  }
  for (const id of [candidatePhoto, noImagePhoto]) {
    assert.equal(await val(`select count(*)::int from public.day_photos where photo_id = $1`, [id]), 0, "ineligible photo was scheduled");
  }
});

await test("schedule_days as postgres (pg_cron) keeps filling until the pool runs out, then is idempotent", async () => {
  const more = await val(`select public.schedule_days(14)`);
  assert.equal(more, 3); // 45 photos = 9 days
  assert.equal(await val(`select public.schedule_days(14)`), 0);
  assert.equal(await val(`select count(*)::int from public.photos p where pool = 'daily' and status = 'onayli' and not exists (select 1 from public.day_photos x where x.photo_id = p.id)`), 1);
});

await test("private.daily_ops runs (schedule + low-stock notify)", async () => {
  const before = await notifyCount();
  await q(`select private.daily_ops()`);
  // 8 days ahead -> no low-stock notification
  assert.equal(await notifyCount(), before);
});

// ---------------------------------------------------------------------------
section("Security: catalog checks");
// ---------------------------------------------------------------------------
await test("RLS enabled on every public table", async () => {
  const bad = await q(`select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
                        where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity`);
  assert.deepEqual(bad, []);
});

await test("every SECURITY DEFINER function pins search_path", async () => {
  const bad = await q(`select n.nspname || '.' || p.proname as f from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                        where n.nspname in ('public', 'private') and p.prosecdef
                          and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')`);
  assert.deepEqual(bad, []);
});

await test("API roles cannot use the private schema", async () => {
  for (const r of ["anon", "authenticated"]) {
    assert.equal(await val(`select has_schema_privilege($1, 'private', 'usage')`, [r]), false);
  }
  await rejects(as(db, ANON, (tx) => tx.query(`select * from private.secrets`)), /permission denied/);
  await rejects(as(db, U.alice.who, (tx) => tx.query(`select private.notify_admin('x')`)), /permission denied/);
  await rejects(as(db, U.alice.who, (tx) => tx.query(`select private.create_duel($1, null, 'bot', 0)`, [U.alice.id])), /permission denied/);
});

await test("clients cannot read answers or other users' rows directly", async () => {
  for (const who of [ANON, U.alice.who]) {
    for (const t of ["photos", "day_photos", "days", "duel_rounds", "duel_guesses", "hints", "app_config", "photo_reports",
      "merge_tickets", "challenges", "friendships", "waitlist", "photo_candidates", "pipeline_runs"]) {
      const n = await as(db, who, (tx) => tx.query(`select count(*)::int n from public.${t}`));
      assert.equal(n.rows[0].n, 0, `${t} readable by ${who.role}`);
    }
  }
  const profs = await as(db, U.alice.who, (tx) => tx.query(`select id from public.profiles`));
  assert.deepEqual(profs.rows.map((r) => r.id), [U.alice.id]);
  // no self-upgrade to Pro / admin
  await as(db, U.alice.who, (tx) => tx.query(`update public.profiles set is_pro = true, is_admin = true where id = $1`, [U.alice.id]));
  assert.equal(await val(`select is_pro or is_admin from public.profiles where id = $1`, [U.alice.id]), false);
  await rejects(as(db, U.alice.who, (tx) => tx.query(
    `insert into public.day_results(user_id, day, mode, total, on_time) values ($1, $2, 'daily', 5000, true)`, [U.alice.id, TODAY])), /row-level security/);
});

const DUMMY = "00000000-0000-0000-0000-000000000000";
const FN_POLICY = {
  // pure helpers (no table access)
  game_day: "pure", next_rollover: "pure", haversine_km: "pure", score_location: "pure", score_year: "pure",
  era_of: "pure", decade_label: "pure", day_number: "pure",
  handle_new_user: "trigger",
  // intentionally public
  public_challenge: "anon", join_waitlist: "anon", list_sources: "anon", verify_internal_secret: "anon",
  // signed-in (incl. anonymous sign-in) users
  get_day: { p_day: null }, use_hint: { p_day: TODAY, p_slot: 1, p_kind: "year" },
  submit_guess: { p_day: TODAY, p_slot: 1, p_lat: 39, p_lng: 35, p_year: 1950 }, get_me: {}, update_profile: { p: {} },
  get_stats: {}, leaderboard: {}, create_challenge: {}, get_challenge: { p_code: "ABCDEF" },
  report_photo: { p_photo_id: DUMMY, p_reason: "yil" }, create_merge_ticket: {}, redeem_merge_ticket: { p_ticket: DUMMY },
  duel_find: {}, duel_queue_status: {}, duel_cancel: "noop", duel_admin_join: { p_token: DUMMY },
  duel_guess: { p_duel: DUMMY, p_round: 1, p_lat: 39, p_lng: 35, p_year: 1950 }, duel_state: { p_duel: DUMMY },
  // service only
  schedule_days: "service", streak_danger_targets: "service", weekly_kpis: "service",
  // internal helper: must not be callable through the API
  streak_of: "internal",
};

await test("public function inventory: every function is classified and safe for anon", async () => {
  const fns = await q(`select p.proname, pg_get_function_identity_arguments(p.oid) args, p.prosecdef,
                              has_function_privilege('anon', p.oid, 'execute') anon_x,
                              has_function_privilege('authenticated', p.oid, 'execute') auth_x
                         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                        where n.nspname = 'public' order by 1`);
  if (VERBOSE) console.table(fns.map((f) => ({ fn: `${f.proname}(${f.args})`, definer: f.prosecdef, anon: f.anon_x, auth: f.auth_x, policy: typeof FN_POLICY[f.proname] === "string" ? FN_POLICY[f.proname] : "user" })));
  const unknown = fns.filter((f) => !(f.proname in FN_POLICY)).map((f) => f.proname);
  assert.deepEqual(unknown, [], "unclassified public functions (review them, then add to FN_POLICY)");
  for (const f of fns) {
    const pol = FN_POLICY[f.proname];
    if (pol === "internal") {
      assert.equal(f.anon_x || f.auth_x, false, `${f.proname} is executable by API roles`);
    } else if (typeof pol === "object") {
      await rejects(rpc(db, ANON, f.proname, pol), /auth_required/);
    } else if (pol === "service") {
      await rejects(f.proname === "streak_danger_targets" ? rpcRows(db, ANON, f.proname) : rpc(db, ANON, f.proname), /forbidden/);
    }
  }
  // the only function taking a user id must be internal
  const uidFns = fns.filter((f) => /\b(uid|p_uid|user_id|p_user\w*|p_player\w*)\s+uuid\b/.test(f.args)).map((f) => f.proname);
  assert.deepEqual(uidFns, ["streak_of"]);
});

await test("duel_cancel as anon is a no-op; verify_internal_secret is false for non-service callers", async () => {
  await rpc(db, ANON, "duel_cancel");
  const secret = await val(`select value from private.secrets where key = 'internal_secret'`);
  assert.equal(secret.length, 64);
  assert.equal(await rpc(db, ANON, "verify_internal_secret", { p: secret }), false);
  assert.equal(await rpc(db, U.alice.who, "verify_internal_secret", { p: secret }), false);
  assert.equal(await rpc(db, SERVICE, "verify_internal_secret", { p: secret }), true);
  assert.equal(await rpc(db, SERVICE, "verify_internal_secret", { p: "nope" }), false);
});

// ---------------------------------------------------------------------------
section("get_day / submit_guess");
// ---------------------------------------------------------------------------
// today's slot 3 photo is dated "±1 year" (year_uncertainty = 1)
await q(`update public.photos set year_uncertainty = 1 where id = (select photo_id from public.day_photos where day = $1 and slot = 3)`, [TODAY]);
const todays = await dayPhotos(TODAY);
const SECRET_KEYS = ["lat", "lng", "year", "location_name", "answer", "story", "title", "region", "province", "difficulty", "photo_id"];
const allKeys = (o, acc = new Set()) => {
  if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) { if (!Array.isArray(o)) acc.add(k); allKeys(v, acc); }
  return acc;
};
function assertNoLeak(day, playedSlots = []) {
  for (const ph of day.photos) {
    assert.deepEqual(Object.keys(ph).sort(), ["height", "hints", "image_path", "play", "slot", "width"]);
    assert.ok(ph.hints.every((h) => h === "year" || h === "location"), "hints must only list kinds");
    if (!playedSlots.includes(ph.slot)) {
      assert.equal(ph.play, null, `slot ${ph.slot} has play data`);
      const s = JSON.stringify(ph);
      assert.ok(!/SECRET-/.test(s), `slot ${ph.slot} leaks answer text`);
      const keys = allKeys(ph);
      for (const k of SECRET_KEYS) assert.ok(!keys.has(k), `slot ${ph.slot} leaks key ${k}`);
    }
  }
  // top level carries no answer data either
  assert.ok(!/SECRET-/.test(JSON.stringify({ ...day, photos: day.photos.filter((p) => !playedSlots.includes(p.slot)) })));
}

await test("get_day (today) returns 5 photos without any answer data", async () => {
  const day = await rpc(db, U.alice.who, "get_day");
  assert.equal(day.day, TODAY);
  assert.equal(day.mode, "daily");
  assert.equal(day.is_today, true);
  assert.equal(day.photos.length, 5);
  assert.equal(day.result, null);
  assert.equal(day.max_year, CUR_YEAR);
  assertNoLeak(day);
});

await test("get_day refuses future days, unknown days and (for free users) past days", async () => {
  await rejects(rpc(db, U.alice.who, "get_day", { p_day: addDays(TODAY, 1) }), /day_locked/);
  await rejects(rpc(db, U.alice.who, "get_day", { p_day: YESTERDAY }), /pro_required/);
  await rejects(rpc(db, U.carol.who, "get_day", { p_day: "2020-01-01" }), /day_not_found/);
  const arch = await rpc(db, U.carol.who, "get_day", { p_day: YESTERDAY });
  assert.equal(arch.mode, "archive");
  assertNoLeak(arch);
});

const aliceScores = [];
await test("submit_guess scoring matches the formula (exact, <1 km, offsets, year_uncertainty)", async () => {
  const p1 = todays[0];
  const r1 = await rpc(db, U.alice.who, "submit_guess", { p_day: TODAY, p_slot: 1, p_lat: p1.lat, p_lng: p1.lng, p_year: p1.year, p_duration_ms: 12000 });
  assert.equal(r1.score_location, 500); assert.equal(r1.score_year, 500); assert.equal(r1.score, 1000);
  assert.equal(r1.answer.lat, p1.lat); assert.equal(r1.answer.year, p1.year); assert.equal(r1.answer.photo_id, p1.id);
  assert.equal(r1.played, 1); assert.equal(r1.day_complete, false);
  aliceScores.push(r1.score);

  const p2 = todays[1];
  const g2 = { lat: p2.lat + 0.6, lng: p2.lng - 0.4, year: p2.year + 7 };
  const r2 = await rpc(db, U.alice.who, "submit_guess", { p_day: TODAY, p_slot: 2, p_lat: g2.lat, p_lng: g2.lng, p_year: g2.year });
  const d2 = hav(g2.lat, g2.lng, p2.lat, p2.lng);
  assert.equal(r2.score_location, scoreLoc(d2)); assert.equal(r2.score_year, scoreYear(7)); assert.equal(r2.year_diff, 7);
  assert.equal(Number(r2.distance_km), Math.round(d2 * 10) / 10);
  aliceScores.push(r2.score);

  const p3 = todays[2];
  const r3 = await rpc(db, U.alice.who, "submit_guess", { p_day: TODAY, p_slot: 3, p_lat: p3.lat + 0.004, p_lng: p3.lng, p_year: p3.year - 2 });
  assert.equal(r3.score_location, 500, "within 1 km must be 500");
  assert.equal(p3.year_uncertainty, 1);
  assert.equal(r3.score_year, scoreYear(2)); assert.equal(r3.year_diff, 2); // ±1 tolerance does not stretch to 2
  aliceScores.push(r3.score);

  const p4 = todays[3];
  const r4 = await rpc(db, U.alice.who, "submit_guess", { p_day: TODAY, p_slot: 4, p_lat: 36.0, p_lng: 44.5, p_year: 1880 });
  assert.equal(r4.score_location, scoreLoc(hav(36.0, 44.5, p4.lat, p4.lng)));
  assert.equal(r4.score_year, scoreYear(p4.year - 1880 <= p4.year_uncertainty ? 0 : p4.year - 1880));
  aliceScores.push(r4.score);
});

await test("year_uncertainty = 1 gives full year score for ±1 (and normal scoring beyond)", async () => {
  const p = todays[2];
  assert.equal(p.year_uncertainty, 1);
  const r = await rpc(db, U.judy.who, "submit_guess", { p_day: TODAY, p_slot: 3, p_lat: p.lat, p_lng: p.lng, p_year: p.year + 1 });
  assert.equal(r.score_year, 500); assert.equal(r.year_diff, 0);
});

await test("submit_guess input validation", async () => {
  await rejects(rpc(db, U.alice.who, "submit_guess", { p_day: TODAY, p_slot: 1, p_lat: 39, p_lng: 35, p_year: 1950 }), /already_played/);
  await rejects(rpc(db, U.alice.who, "submit_guess", { p_day: TODAY, p_slot: 5, p_lat: 50, p_lng: 35, p_year: 1950 }), /out_of_bounds/);
  await rejects(rpc(db, U.alice.who, "submit_guess", { p_day: TODAY, p_slot: 5, p_lat: 39, p_lng: 35, p_year: 1800 }), /bad_year/);
  await rejects(rpc(db, U.alice.who, "submit_guess", { p_day: TODAY, p_slot: 5, p_lat: 39, p_lng: 35, p_year: CUR_YEAR + 1 }), /bad_year/);
  await rejects(rpc(db, U.alice.who, "submit_guess", { p_day: TODAY, p_slot: 9, p_lat: 39, p_lng: 35, p_year: 1950 }), /photo_not_found/);
  await rejects(rpc(db, U.alice.who, "submit_guess", { p_day: addDays(TODAY, 1), p_slot: 1, p_lat: 39, p_lng: 35, p_year: 1950 }), /day_locked/);
  await rejects(rpc(db, U.alice.who, "submit_guess", { p_day: YESTERDAY, p_slot: 1, p_lat: 39, p_lng: 35, p_year: 1950 }), /pro_required/);
});

await test("get_day after 4 guesses: answers only for played slots", async () => {
  const day = await rpc(db, U.alice.who, "get_day");
  assertNoLeak(day, [1, 2, 3, 4]);
  for (const s of [1, 2, 3, 4]) assert.ok(day.photos[s - 1].play?.answer?.lat, `slot ${s} answer missing`);
  assert.equal(day.photos[4].play, null);
  assert.equal(await val(`select duration_ms from public.plays where user_id = $1 and slot = 1`, [U.alice.id]), 12000);
  assert.equal(await val(`select duration_ms from public.plays where user_id = $1 and slot = 2`, [U.alice.id]), null, "null duration should stay null");
});

await test("finishing 5 photos writes day_results and starts a streak", async () => {
  const p5 = todays[4];
  const r5 = await rpc(db, U.alice.who, "submit_guess", { p_day: TODAY, p_slot: 5, p_lat: p5.lat, p_lng: p5.lng, p_year: p5.year });
  aliceScores.push(r5.score);
  const total = aliceScores.reduce((a, b) => a + b, 0);
  assert.equal(r5.day_complete, true); assert.equal(r5.played, 5); assert.equal(r5.day_total, total);
  const res = await one(`select * from public.day_results where user_id = $1 and day = $2`, [U.alice.id, TODAY]);
  assert.ok(res, "no day_results row");
  assert.equal(res.total, total); assert.equal(res.on_time, true); assert.equal(res.mode, "daily"); assert.equal(res.used_hint, false);
  assert.equal((await val(`select public.streak_of($1)`, [U.alice.id])).current, 1);
  const me = await rpc(db, U.alice.who, "get_me");
  assert.equal(me.streak.current, 1); assert.equal(me.streak.played_today, true);
  assert.equal(me.today_result.total, total); assert.equal(me.today_played, 5); assert.equal(me.days_completed, 1);
  const day = await rpc(db, U.alice.who, "get_day");
  assert.equal(day.result.total, total);
});

// ---------------------------------------------------------------------------
section("Hints (Pro)");
// ---------------------------------------------------------------------------
await test("use_hint requires Pro and validates input", async () => {
  await rejects(rpc(db, U.bob.who, "use_hint", { p_day: TODAY, p_slot: 1, p_kind: "year" }), /pro_required/);
  await rejects(rpc(db, U.carol.who, "use_hint", { p_day: TODAY, p_slot: 1, p_kind: "photo" }), /bad_kind/);
  await rejects(rpc(db, U.carol.who, "use_hint", { p_day: addDays(TODAY, 1), p_slot: 1, p_kind: "year" }), /day_locked/);
  await rejects(rpc(db, U.carol.who, "use_hint", { p_day: TODAY, p_slot: 7, p_kind: "year" }), /photo_not_found/);
});

const carolScores = [];
await test("hints return decade/region and cap that part at 70%", async () => {
  const p1 = todays[0];
  const hy = await rpc(db, U.carol.who, "use_hint", { p_day: TODAY, p_slot: 1, p_kind: "year" });
  assert.deepEqual(hy, { kind: "year", text: decade(p1.year) });
  const hl = await rpc(db, U.carol.who, "use_hint", { p_day: TODAY, p_slot: 1, p_kind: "location" });
  assert.deepEqual(hl, { kind: "location", text: `${p1.region} Bölgesi` });
  const day = await rpc(db, U.carol.who, "get_day");
  assert.deepEqual(day.photos[0].hints.sort(), ["location", "year"]);
  assertNoLeak(day);
  const r1 = await rpc(db, U.carol.who, "submit_guess", { p_day: TODAY, p_slot: 1, p_lat: p1.lat, p_lng: p1.lng, p_year: p1.year });
  assert.equal(r1.score_location, 350); assert.equal(r1.score_year, 350);
  assert.equal(r1.hint_location, true); assert.equal(r1.hint_year, true);
  carolScores.push(r1.score);
  const p2 = todays[1];
  await rpc(db, U.carol.who, "use_hint", { p_day: TODAY, p_slot: 2, p_kind: "year" });
  const g = { lat: p2.lat - 0.3, lng: p2.lng + 0.2 };
  const r2 = await rpc(db, U.carol.who, "submit_guess", { p_day: TODAY, p_slot: 2, p_lat: g.lat, p_lng: g.lng, p_year: p2.year + 5 });
  assert.equal(r2.score_year, scoreYear(5, true));
  assert.equal(r2.score_location, scoreLoc(hav(g.lat, g.lng, p2.lat, p2.lng)));
  carolScores.push(r2.score);
  await rejects(rpc(db, U.carol.who, "use_hint", { p_day: TODAY, p_slot: 1, p_kind: "year" }), /already_played/);
  for (const s of [3, 4, 5]) {
    const p = todays[s - 1];
    carolScores.push((await rpc(db, U.carol.who, "submit_guess", { p_day: TODAY, p_slot: s, p_lat: p.lat + 0.2, p_lng: p.lng, p_year: p.year + 1 })).score);
  }
  const res = await one(`select * from public.day_results where user_id = $1 and day = $2`, [U.carol.id, TODAY]);
  assert.equal(res.used_hint, true); assert.equal(res.total, carolScores.reduce((a, b) => a + b, 0));
});

// ---------------------------------------------------------------------------
section("Streaks");
// ---------------------------------------------------------------------------
async function addResult(user, day, { on_time = true, total = 2500, mode = "daily" } = {}) {
  await q(`insert into public.day_results(user_id, day, mode, total, on_time) values ($1, $2, $3, $4, $5)`, [user, day, mode, total, on_time]);
}
await test("streak counts consecutive on-time days (archive days don't count)", async () => {
  await addResult(U.alice.id, YESTERDAY, { total: 3000 });
  await addResult(U.alice.id, addDays(TODAY, -2), { on_time: false, mode: "archive", total: 4000 });
  await addResult(U.alice.id, addDays(TODAY, -3), { total: 3500 });
  await addResult(U.alice.id, addDays(TODAY, -4), { total: 3500 });
  const s = (await rpc(db, U.alice.who, "get_me")).streak;
  assert.equal(s.current, 2); assert.equal(s.best, 2); assert.equal(s.played_today, true);
});

await test("streak from yesterday when today not yet played; Pro gets one missed day per month", async () => {
  // grace: free user, played -1 and -2
  await addResult(U.grace.id, YESTERDAY); await addResult(U.grace.id, addDays(TODAY, -2));
  const g = (await rpc(db, U.grace.who, "get_me")).streak;
  assert.equal(g.current, 2); assert.equal(g.played_today, false);
  // carol (Pro): today, -1, (missed -2), -3, -4
  await addResult(U.carol.id, YESTERDAY, { total: 3100 }); await addResult(U.carol.id, addDays(TODAY, -3)); await addResult(U.carol.id, addDays(TODAY, -4));
  assert.equal((await rpc(db, U.carol.who, "get_me")).streak.current, 4);
  // same pattern for a free user breaks at the gap
  await addResult(U.judy.id, YESTERDAY); await addResult(U.judy.id, addDays(TODAY, -3)); await addResult(U.judy.id, addDays(TODAY, -4));
  const j = (await rpc(db, U.judy.who, "get_me")).streak;
  assert.equal(j.current, 1); assert.equal(j.best, 2);
});

// ---------------------------------------------------------------------------
section("Challenges & friends");
// ---------------------------------------------------------------------------
let CODE = null, CODE_Y = null;
await test("create_challenge requires a finished day; code is stable", async () => {
  await rejects(rpc(db, U.bob.who, "create_challenge"), /finish_day_first/);
  const c = await rpc(db, U.alice.who, "create_challenge");
  assert.match(c.code, /^[A-Z2-9]{6}$/);
  assert.equal(c.url, `https://maziturkiye.com/m/${c.code}`);
  assert.equal(c.day, TODAY);
  CODE = c.code;
  assert.equal((await rpc(db, U.alice.who, "create_challenge")).code, CODE);
});

await test("public_challenge works for anon, returns no answers", async () => {
  const pc = await rpc(db, ANON, "public_challenge", { p_code: ` ${CODE.toLowerCase()} ` });
  assert.equal(pc.code, CODE); assert.equal(pc.creator_total, aliceScores.reduce((a, b) => a + b, 0));
  assert.ok(pc.creator_name.startsWith("Oyuncu "));
  assert.deepEqual(Object.keys(pc).sort(), ["code", "creator_name", "creator_total", "number"]);
  assert.equal(await rpc(db, ANON, "public_challenge", { p_code: "ZZZZZZ" }), null);
});

await test("friend plays via challenge -> friendship + challenge result", async () => {
  await rejects(rpc(db, ANON, "get_challenge", { p_code: CODE }), /auth_required/);
  const before = await rpc(db, U.bob.who, "get_challenge", { p_code: CODE.toLowerCase() });
  assert.equal(before.is_mine, false); assert.equal(before.slots, null); assert.equal(before.my_total, null);
  const day = await rpc(db, U.bob.who, "get_day", { p_challenge: CODE });
  assert.equal(day.mode, "challenge");
  assertNoLeak(day);
  await rejects(rpc(db, U.bob.who, "get_day", { p_challenge: "ABCDEF" }), /challenge_not_found/);
  for (let s = 1; s <= 5; s++) {
    const p = todays[s - 1];
    await rpc(db, U.bob.who, "submit_guess", { p_day: TODAY, p_slot: s, p_lat: p.lat + 0.1 * s, p_lng: p.lng, p_year: p.year + s, p_challenge: CODE.toLowerCase() });
  }
  const res = await one(`select * from public.day_results where user_id = $1 and day = $2`, [U.bob.id, TODAY]);
  assert.equal(res.mode, "challenge"); assert.equal(res.challenge_code, CODE); assert.equal(res.on_time, true);
  const [a, b] = [U.alice.id, U.bob.id].sort();
  assert.equal(await val(`select count(*)::int from public.friendships where user_a = $1 and user_b = $2`, [a, b]), 1);
  const after = await rpc(db, U.bob.who, "get_challenge", { p_code: CODE });
  assert.equal(after.slots.length, 5);
  assert.ok(after.slots.every((s) => typeof s.creator === "number" && typeof s.me === "number"));
  assert.equal(after.my_total, res.total);
});

await test("past-day challenge lets a free user play that day (not counted as on-time)", async () => {
  for (let s = 1; s <= 5; s++) {
    const p = await photo(yesterdayIds[s - 1]);
    await rpc(db, U.carol.who, "submit_guess", { p_day: YESTERDAY, p_slot: s, p_lat: p.lat, p_lng: p.lng + 0.05, p_year: p.year });
  }
  // carol already had an on-time result for yesterday from the streak test: keep it
  CODE_Y = (await rpc(db, U.carol.who, "create_challenge", { p_day: YESTERDAY })).code;
  await rejects(rpc(db, U.dave.who, "get_day", { p_day: YESTERDAY }), /pro_required/);
  await rejects(rpc(db, U.dave.who, "get_day", { p_day: YESTERDAY, p_challenge: CODE }), /challenge_not_found/);
  const d = await rpc(db, U.dave.who, "get_day", { p_day: YESTERDAY, p_challenge: CODE_Y });
  assert.equal(d.mode, "challenge"); assertNoLeak(d);
  for (let s = 1; s <= 5; s++) {
    const p = await photo(yesterdayIds[s - 1]);
    await rpc(db, U.dave.who, "submit_guess", { p_day: YESTERDAY, p_slot: s, p_lat: p.lat, p_lng: p.lng, p_year: p.year + 3, p_challenge: CODE_Y });
  }
  const res = await one(`select * from public.day_results where user_id = $1 and day = $2`, [U.dave.id, YESTERDAY]);
  assert.equal(res.on_time, false); assert.equal(res.mode, "challenge");
  const [a, b] = [U.carol.id, U.dave.id].sort();
  assert.equal(await val(`select count(*)::int from public.friendships where user_a = $1 and user_b = $2`, [a, b]), 1);
});

// ---------------------------------------------------------------------------
section("Leaderboard / stats / profile");
// ---------------------------------------------------------------------------
await test("leaderboard today / week / friends", async () => {
  const today = await rpc(db, U.alice.who, "leaderboard", { p_scope: "today" });
  assert.equal(today.players, 3); // alice, bob (challenge, on time), carol
  const totals = today.rows.map((r) => r.total);
  assert.deepEqual(totals, [...totals].sort((x, y) => y - x));
  assert.equal(today.rows.filter((r) => r.is_me).length, 1);
  assert.equal(today.me.total, aliceScores.reduce((a, b) => a + b, 0));
  assert.equal(today.rows.find((r) => r.total === today.me.total && r.is_me).rank, today.me.rank);
  assert.equal(today.rows.find((r) => r.used_hint === true)?.total, carolScores.reduce((a, b) => a + b, 0));

  const week = await rpc(db, U.alice.who, "leaderboard", { p_scope: "week" });
  // alice on-time: today + yesterday + -3 + -4 (the -2 archive result does not count)
  assert.equal(week.me.total, aliceScores.reduce((a, b) => a + b, 0) + 3000 + 3500 + 3500);

  const fr = await rpc(db, U.alice.who, "leaderboard", { p_scope: "friends" });
  assert.equal(fr.players, 2);
  const frDave = await rpc(db, U.dave.who, "leaderboard", { p_scope: "friends" });
  assert.equal(frDave.players, 1); assert.equal(frDave.me, null);

  await rejects(rpc(db, U.alice.who, "leaderboard", { p_scope: "all" }), /bad_scope/);
  assert.equal((await rpc(db, U.alice.who, "leaderboard", { p_scope: "today", p_limit: 1 })).rows.length, 1);
});

await test("hidden players are anonymised for others but not for themselves", async () => {
  await rpc(db, U.bob.who, "update_profile", { p: { nickname: "Bobo", show_on_leaderboard: false } });
  const forAlice = await rpc(db, U.alice.who, "leaderboard", { p_scope: "today" });
  assert.ok(!forAlice.rows.some((r) => r.name === "Bobo"));
  assert.ok(forAlice.rows.some((r) => r.name === "Gizli oyuncu"));
  const forBob = await rpc(db, U.bob.who, "leaderboard", { p_scope: "today" });
  assert.ok(forBob.rows.some((r) => r.name === "Bobo" && r.is_me));
});

await test("get_stats: free users get the basic set, Pro gets era/region breakdown", async () => {
  const s = await rpc(db, U.alice.who, "get_stats");
  assert.equal(s.full, false); assert.deepEqual(s.by_era, []); assert.deepEqual(s.by_region, []);
  assert.equal(s.days, 5); assert.equal(s.best_total, 4000); assert.equal(s.streak.current, 2);
  assert.equal(s.recent.length, 5); assert.equal(s.recent.at(-1).day, TODAY);
  const c = await rpc(db, U.carol.who, "get_stats");
  assert.equal(c.full, true);
  assert.ok(c.by_era.length >= 2 && c.by_era.every((e) => e.key && e.count > 0 && e.avg_score_year !== undefined));
  assert.ok(c.by_region.length >= 2 && c.by_region.every((e) => e.key && e.count > 0));
  const empty = await rpc(db, U.nobody.who, "get_stats");
  assert.equal(empty.days, 0); assert.equal(empty.avg_total, 0); assert.deepEqual(empty.recent, []);
});

await test("update_profile validation", async () => {
  const nick = () => val(`select nickname from public.profiles where id = $1`, [U.alice.id]);
  await rpc(db, U.alice.who, "update_profile", { p: { nickname: "Çağrı Öz_34" } });
  assert.equal(await nick(), "Çağrı Öz_34");
  await rpc(db, U.alice.who, "update_profile", { p: { nickname: "  Ayşe K.  " } });
  assert.equal(await nick(), "Ayşe K.");
  for (const bad of ["a", "x".repeat(21), "<b>hi</b>", "  a  ", "ab;drop", "a\nb"]) {
    await rejects(rpc(db, U.alice.who, "update_profile", { p: { nickname: bad } }), /bad_nickname/);
  }
  assert.equal(await nick(), "Ayşe K.");
  await rpc(db, U.alice.who, "update_profile", { p: { nickname: "     " } }); // blank clears
  assert.equal(await nick(), null);
  await rpc(db, U.alice.who, "update_profile", { p: { nickname: "Ayşe" } });
  await rpc(db, U.alice.who, "update_profile", { p: { nickname: null } });
  assert.equal(await nick(), null);
  await rejects(rpc(db, U.alice.who, "update_profile", { p: ["nickname"] }), /bad_profile/);
  await rpc(db, U.alice.who, "update_profile", { p: { nickname: "Ayşe" } });
  await rpc(db, U.alice.who, "update_profile", { p: { reminder_hour: 3 } });
  assert.equal(await val(`select reminder_hour from public.profiles where id = $1`, [U.alice.id]), 9);
  await rpc(db, U.alice.who, "update_profile", { p: { reminder_hour: 30 } });
  assert.equal(await val(`select reminder_hour from public.profiles where id = $1`, [U.alice.id]), 23);
  await rpc(db, U.alice.who, "update_profile", { p: { reminder_hour: null } });
  assert.equal(await val(`select reminder_hour from public.profiles where id = $1`, [U.alice.id]), null);
  await rejects(rpc(db, U.alice.who, "update_profile", { p: { reminder_hour: "sabah" } }), /bad_reminder_hour/);
  await rejects(rpc(db, U.alice.who, "update_profile", { p: { show_on_leaderboard: null } }), /bad_show_on_leaderboard/);
  await rejects(rpc(db, U.alice.who, "update_profile", { p: { show_on_leaderboard: "belki" } }), /bad_show_on_leaderboard/);
  await rejects(rpc(db, U.alice.who, "update_profile", { p: { push_token: "x".repeat(300) } }), /bad_push_token/);
  await rpc(db, U.alice.who, "update_profile", { p: { push_token: "ExponentPushToken[alice]", is_pro: true, is_admin: true, elo: 3000 } });
  const pr = await one(`select * from public.profiles where id = $1`, [U.alice.id]);
  assert.equal(pr.push_token, "ExponentPushToken[alice]");
  assert.equal(pr.is_pro, false); assert.equal(pr.is_admin, false); assert.equal(pr.elo, 1200);
});

// ---------------------------------------------------------------------------
section("Photo reports");
// ---------------------------------------------------------------------------
await test("report_photo requires having seen the photo; notifies admin once per trigger", async () => {
  const p = todays[0].id;
  await rejects(rpc(db, U.nobody.who, "report_photo", { p_photo_id: p, p_reason: "yil" }), /not_seen/);
  await rejects(rpc(db, U.alice.who, "report_photo", { p_photo_id: todays[0].id, p_reason: "kotu" }), /check constraint|bad_reason/);
  const n0 = await notifyCount();
  await rpc(db, U.alice.who, "report_photo", { p_photo_id: p, p_reason: "yil", p_note: "x".repeat(800) });
  assert.equal((await photo(p)).report_count, 1);
  assert.equal(await val(`select char_length(note) from public.photo_reports where photo_id = $1 and user_id = $2`, [p, U.alice.id]), 500);
  await rpc(db, U.bob.who, "report_photo", { p_photo_id: p, p_reason: "konum" });
  assert.equal(await notifyCount(), n0);
  await rpc(db, U.carol.who, "report_photo", { p_photo_id: p, p_reason: "diger" });
  assert.equal((await photo(p)).report_count, 3);
  assert.equal(await notifyCount(), n0 + 1, "3rd report should notify admin");
  // repeated report by the same user: no new row, no new notification
  await rpc(db, U.carol.who, "report_photo", { p_photo_id: p, p_reason: "diger" });
  assert.equal(await notifyCount(), n0 + 1, "repeat report re-notified admin");
  const p2 = todays[1].id;
  await rpc(db, U.alice.who, "report_photo", { p_photo_id: p2, p_reason: "telif" });
  assert.equal(await notifyCount(), n0 + 2, "telif should notify admin");
  for (let i = 0; i < 3; i++) await rpc(db, U.alice.who, "report_photo", { p_photo_id: p2, p_reason: "telif" });
  assert.equal(await notifyCount(), n0 + 2, "repeated telif report spams admin");
  const call = await one(`select * from net.http_request_log where url like '%/notify-admin' order by id desc limit 1`);
  assert.equal(call.url, "https://ybhiddgwunzyquzrbzaf.supabase.co/functions/v1/notify-admin");
  assert.equal(call.headers["x-internal-secret"], await val(`select value from private.secrets where key = 'internal_secret'`));
});

// ---------------------------------------------------------------------------
section("Merge tickets (anonymous -> signed in)");
// ---------------------------------------------------------------------------
await test("anonymous user's data moves to the signed-in account; conflicting days stay", async () => {
  // erin (anonymous): plays yesterday via challenge (full) and today (full); sets a nickname
  for (let s = 1; s <= 5; s++) {
    const py = await photo(yesterdayIds[s - 1]);
    await rpc(db, U.erin.who, "submit_guess", { p_day: YESTERDAY, p_slot: s, p_lat: py.lat, p_lng: py.lng, p_year: py.year, p_challenge: CODE_Y });
    const pt = todays[s - 1];
    await rpc(db, U.erin.who, "submit_guess", { p_day: TODAY, p_slot: s, p_lat: pt.lat, p_lng: pt.lng, p_year: pt.year });
  }
  await rpc(db, U.erin.who, "update_profile", { p: { nickname: "Erin" } });
  // frank (signed in) already played today's slot 1 on another device
  const p1 = todays[0];
  await rpc(db, U.frank.who, "submit_guess", { p_day: TODAY, p_slot: 1, p_lat: p1.lat + 1, p_lng: p1.lng, p_year: p1.year + 10 });
  const ticket = await rpc(db, U.erin.who, "create_merge_ticket");
  assert.match(ticket, /^[0-9a-f-]{36}$/);
  const r = await rpc(db, U.frank.who, "redeem_merge_ticket", { p_ticket: ticket });
  assert.equal(r.moved, 5);
  const cnt = (u, d, t = "plays") => val(`select count(*)::int from public.${t} where user_id = $1 and day = $2`, [u, d]);
  assert.equal(await cnt(U.frank.id, YESTERDAY), 5);
  assert.equal(await cnt(U.frank.id, YESTERDAY, "day_results"), 1);
  assert.equal(await cnt(U.frank.id, TODAY), 1, "frank's own today plays must be kept as-is");
  assert.equal(await cnt(U.frank.id, TODAY, "day_results"), 0, "today's result moved without its plays");
  assert.equal(await cnt(U.erin.id, TODAY), 5);
  const [a, b] = [U.carol.id, U.frank.id].sort();
  assert.equal(await val(`select count(*)::int from public.friendships where user_a = $1 and user_b = $2`, [a, b]), 1);
  assert.equal(await val(`select nickname from public.profiles where id = $1`, [U.frank.id]), "Erin");
  // single use
  assert.equal((await rpc(db, U.frank.who, "redeem_merge_ticket", { p_ticket: ticket })).moved, 0);
  // frank can still finish today on his own
  for (let s = 2; s <= 5; s++) {
    const p = todays[s - 1];
    await rpc(db, U.frank.who, "submit_guess", { p_day: TODAY, p_slot: s, p_lat: p.lat, p_lng: p.lng, p_year: p.year });
  }
  const own = await val(`select sum(score_location + score_year)::int from public.plays where user_id = $1 and day = $2`, [U.frank.id, TODAY]);
  assert.equal(await val(`select total from public.day_results where user_id = $1 and day = $2`, [U.frank.id, TODAY]), own);
});

await test("merge tickets: expired and non-anonymous tickets move nothing", async () => {
  const t1 = await rpc(db, U.erin.who, "create_merge_ticket");
  await q(`update public.merge_tickets set created_at = now() - interval '2 hours' where ticket = $1`, [t1]);
  assert.equal((await rpc(db, U.frank.who, "redeem_merge_ticket", { p_ticket: t1 })).moved, 0);
  const t2 = await rpc(db, U.alice.who, "create_merge_ticket");
  await rejects(rpc(db, U.bob.who, "redeem_merge_ticket", { p_ticket: t2 }), /not_anonymous/);
  assert.equal(await val(`select count(*)::int from public.plays where user_id = $1`, [U.alice.id]), 5);
});

// ---------------------------------------------------------------------------
section("1v1 duels");
// ---------------------------------------------------------------------------
const duel = (id) => one(`select * from public.duels where id = $1`, [id]);
const roundPhoto = (id, r) => one(`select p.* from public.duel_rounds dr join public.photos p on p.id = dr.photo_id
                                     where dr.duel_id = $1 and dr.round = $2`, [id, r]);
const startRoundNow = (id) => q(`update public.duels set round_started_at = now() - interval '1 second',
                                    round_deadline = now() + interval '44 seconds' where id = $1`, [id]);
const endReveal = (id) => q(`update public.duels set reveal_until = now() - interval '1 second' where id = $1 and reveal_until is not null`, [id]);
const expireRound = (id) => q(`update public.duels set round_deadline = now() - interval '5 seconds' where id = $1`, [id]);
const guess = (u, id, r, lat, lng, year) => rpc(db, u.who, "duel_guess", { p_duel: id, p_round: r, p_lat: lat, p_lng: lng, p_year: year });

let D1 = null;
await test("duel_find matches two waiting players", async () => {
  const a = await rpc(db, U.alice.who, "duel_find");
  assert.equal(a.status, "waiting");
  assert.equal((await rpc(db, U.alice.who, "duel_queue_status")).status, "waiting");
  const b = await rpc(db, U.bob.who, "duel_find");
  assert.equal(b.status, "matched");
  D1 = b.duel_id;
  const qa = await rpc(db, U.alice.who, "duel_queue_status");
  assert.equal(qa.status, "matched"); assert.equal(qa.duel_id, D1);
  const d = await duel(D1);
  assert.equal(d.player_a, U.alice.id); assert.equal(d.player_b, U.bob.id); assert.equal(d.opponent_kind, "player");
  assert.equal((await rpc(db, U.alice.who, "duel_find")).duel_id, D1, "active duel should be returned again");
});

await test("duel photos are 5 distinct duel/past-day photos, never today's or future daily photos", async () => {
  const rows = await q(`select dr.round, p.pool, (select max(day) from public.day_photos dp where dp.photo_id = p.id)::text as day
                          from public.duel_rounds dr join public.photos p on p.id = dr.photo_id where dr.duel_id = $1`, [D1]);
  assert.equal(rows.length, 5);
  for (const r of rows) assert.ok(r.pool === "duel" || (r.day && r.day < TODAY), `round ${r.round} uses a live daily photo`);
});

await test("duel_state hides the answer until reveal, and only for participants", async () => {
  const s0 = await rpc(db, U.alice.who, "duel_state", { p_duel: D1 });
  assert.equal(s0.phase, "countdown"); assert.equal(s0.photo, null); assert.equal(s0.reveal, null);
  await rejects(rpc(db, U.carol.who, "duel_state", { p_duel: D1 }), /not_participant/);
  await rejects(rpc(db, U.carol.who, "duel_guess", { p_duel: D1, p_round: 1, p_lat: 39, p_lng: 35, p_year: 1950 }), /not_participant/);
  await rejects(rpc(db, U.carol.who, "duel_state", { p_duel: randomUUID() }), /duel_not_found/);
  await rejects(rpc(db, U.carol.who, "duel_guess", { p_duel: randomUUID(), p_round: 1, p_lat: 39, p_lng: 35, p_year: 1950 }), /duel_not_found/);
  await startRoundNow(D1);
  const s1 = await rpc(db, U.alice.who, "duel_state", { p_duel: D1 });
  assert.equal(s1.phase, "guessing"); assert.equal(s1.round, 1);
  assert.deepEqual(Object.keys(s1.photo).sort(), ["height", "image_path", "width"]);
  assert.equal(s1.reveal, null); assert.ok(!/SECRET-/.test(JSON.stringify(s1)));
  assert.equal(s1.opponent.elo, 1200);
});

const duelPts = { a: 0, b: 0 };
await test("duel round 1: both guess -> reveal with scores", async () => {
  const p = await roundPhoto(D1, 1);
  await rejects(guess(U.alice, D1, 2, p.lat, p.lng, p.year), /round_closed/);
  await rejects(guess(U.alice, D1, 1, 55, 35, p.year), /out_of_bounds/);
  await rejects(guess(U.alice, D1, 1, p.lat, p.lng, 1500), /bad_year/);
  const sa = await guess(U.alice, D1, 1, p.lat, p.lng, p.year);
  assert.equal(sa.phase, "guessing"); assert.deepEqual(sa.my_guess, { lat: p.lat, lng: p.lng, year: p.year });
  assert.equal(sa.opponent.guessed, false);
  const sb0 = await rpc(db, U.bob.who, "duel_state", { p_duel: D1 });
  assert.equal(sb0.opponent.guessed, true); assert.equal(sb0.reveal, null);
  assert.ok(!JSON.stringify(sb0).includes(String(p.lat)), "opponent's guess (= answer) leaked before reveal");
  const g = { lat: p.lat + 0.5, lng: p.lng, year: p.year + 3 };
  const sb = await guess(U.bob, D1, 1, g.lat, g.lng, g.year);
  assert.equal(sb.phase, "reveal");
  assert.equal(sb.reveal.answer.photo_id, p.id);
  const bobScore = scoreLoc(hav(g.lat, g.lng, p.lat, p.lng)) + scoreYear(3);
  assert.equal(sb.reveal.me.score, bobScore); assert.equal(sb.reveal.opp.score, 1000);
  assert.equal(sb.score_me, bobScore); assert.equal(sb.score_opp, 1000);
  duelPts.a += 1000; duelPts.b += bobScore;
  await rejects(guess(U.alice, D1, 1, p.lat, p.lng, p.year), /round_closed/);
});

await test("duel guess within the 2 s grace after the deadline is accepted", async () => {
  await endReveal(D1);
  const s = await rpc(db, U.alice.who, "duel_state", { p_duel: D1 });
  assert.equal(s.round, 2); assert.equal(s.phase, "guessing");
  assert.deepEqual(s.rounds.map((r) => r.round), [1]);
  await q(`update public.duels set round_deadline = now() - interval '1 second' where id = $1`, [D1]);
  const p = await roundPhoto(D1, 2);
  const sa = await guess(U.alice, D1, 2, p.lat, p.lng, p.year);
  assert.equal(sa.my_guess?.year, p.year, "late (in-grace) guess was dropped");
  duelPts.a += 1000;
});

await test("duel rounds 2-5: timeouts give 0, finish updates Elo (K=32)", async () => {
  await expireRound(D1);
  let s = await rpc(db, U.bob.who, "duel_state", { p_duel: D1 });
  assert.equal(s.phase, "reveal"); assert.equal(s.reveal.me.score, 0);
  for (let r = 3; r <= 5; r++) {
    await endReveal(D1);
    s = await rpc(db, U.alice.who, "duel_state", { p_duel: D1 });
    assert.equal(s.round, r); assert.equal(s.phase, "guessing");
    const p = await roundPhoto(D1, r);
    await guess(U.alice, D1, r, p.lat, p.lng, p.year);
    duelPts.a += 1000;
    await expireRound(D1);
    s = await rpc(db, U.alice.who, "duel_state", { p_duel: D1 });
    assert.equal(s.phase, "reveal");
  }
  await endReveal(D1);
  s = await rpc(db, U.alice.who, "duel_state", { p_duel: D1 });
  assert.equal(s.phase, "finished");
  assert.equal(s.score_me, duelPts.a); assert.equal(s.score_opp, duelPts.b);
  assert.deepEqual(s.result, { outcome: "win", elo_before: 1200, elo_after: 1216 });
  const sb = await rpc(db, U.bob.who, "duel_state", { p_duel: D1 });
  assert.deepEqual(sb.result, { outcome: "loss", elo_before: 1200, elo_after: 1184 });
  assert.equal(sb.rounds.length, 5);
  const pa = await one(`select elo, duels_played from public.profiles where id = $1`, [U.alice.id]);
  const pb = await one(`select elo, duels_played from public.profiles where id = $1`, [U.bob.id]);
  assert.deepEqual(pa, { elo: 1216, duels_played: 1 }); assert.deepEqual(pb, { elo: 1184, duels_played: 1 });
  // idempotent
  await q(`select private.duel_tick()`);
  assert.equal(await val(`select elo from public.profiles where id = $1`, [U.alice.id]), 1216);
  assert.equal((await rpc(db, U.alice.who, "get_me")).duels_today, 1);
});

await test("report_photo accepts a photo seen in a duel", async () => {
  const p = await roundPhoto(D1, 3);
  await rpc(db, U.bob.who, "report_photo", { p_photo_id: p.id, p_reason: "konum" });
  assert.equal((await photo(p.id)).report_count, 1);
});

let D2 = null;
await test("queue: admin Telegram notify at 60 s (once), bot opponent at 120 s", async () => {
  assert.equal((await rpc(db, U.carol.who, "duel_find")).status, "waiting");
  const n0 = await notifyCount();
  await q(`select private.duel_tick()`);
  assert.equal(await notifyCount(), n0, "notified too early");
  await q(`update public.duel_queue set created_at = now() - interval '65 seconds' where user_id = $1`, [U.carol.id]);
  await q(`select private.duel_tick()`);
  assert.equal(await notifyCount(), n0 + 1, "admin not notified at 60 s");
  const qr = await one(`select * from public.duel_queue where user_id = $1`, [U.carol.id]);
  assert.ok(qr.admin_notified_at); assert.equal(qr.status, "waiting");
  const call = await one(`select * from net.http_request_log order by id desc limit 1`);
  assert.ok(call.url.endsWith("/notify-admin"));
  assert.equal(call.body.link, `https://maziturkiye.com/d/${qr.token}`);
  assert.match(call.body.text, /Rakip bekliyor/);
  await q(`select private.duel_tick()`);
  await rpc(db, U.carol.who, "duel_queue_status");
  assert.equal(await notifyCount(), n0 + 1, "admin notified twice");
  await q(`update public.duel_queue set created_at = now() - interval '130 seconds' where user_id = $1`, [U.carol.id]);
  await q(`select private.queue_timeouts(q) from public.duel_queue q where user_id = $1`, [U.carol.id]);
  const st = await rpc(db, U.carol.who, "duel_queue_status");
  assert.equal(st.status, "matched"); D2 = st.duel_id;
  const d = await duel(D2);
  assert.equal(d.opponent_kind, "bot"); assert.equal(d.player_b, null);
  assert.ok(await val(`select count(*)::int from private.bot_names where name = $1`, [d.bot_name]));
  assert.ok(d.bot_elo >= 1160 && d.bot_elo <= 1240, `bot_elo ${d.bot_elo}`);
  assert.ok(d.bot_factor >= 0.35 && d.bot_factor <= 2.0);
  assert.ok(d.wait_seconds >= 130);
  // a second tick must not create another bot duel
  await q(`select private.duel_tick()`);
  assert.equal(await val(`select count(*)::int from public.duels where player_a = $1`, [U.carol.id]), 1);
});

await test("bot guesses: Gaussian offset snapped to a province centroid, visible 8-35 s into the round", async () => {
  const g = await one(`select * from public.duel_guesses where duel_id = $1 and round = 1 and side = 'b'`, [D2]);
  assert.ok(g, "bot guess for round 1 missing");
  const d = await duel(D2);
  const dt = (g.visible_at - d.round_started_at) / 1000;
  assert.ok(dt >= 8 && dt <= 35, `bot visible after ${dt}s`);
  const near = await one(`select name, public.haversine_km($1, $2, lat, lng) km from private.provinces order by 2 limit 1`, [g.lat, g.lng]);
  assert.ok(near.km < 1e-6, `bot guess not on a province centroid (nearest ${near.name} at ${near.km} km)`);
  assert.ok(g.year >= 1880 && g.year <= CUR_YEAR);
  const p = await roundPhoto(D2, 1);
  assert.equal(g.score_location, scoreLoc(hav(g.lat, g.lng, p.lat, p.lng)));
  // statistical sanity over many samples: bot errors are centred on the truth
  const stats = await one(`
    with s as (select private.gauss() * 12 as dy from generate_series(1, 4000))
    select avg(dy)::float8 as mean, stddev(dy)::float8 as sd from s`);
  assert.ok(Math.abs(stats.mean) < 1.2 && Math.abs(stats.sd - 12) < 1.5, `gauss mean ${stats.mean} sd ${stats.sd}`);
});

await test("bot duel plays 5 rounds and finishes with Elo vs bot_elo", async () => {
  let d = await duel(D2);
  await startRoundNow(D2);
  for (let r = 1; r <= 5; r++) {
    let s = await rpc(db, U.carol.who, "duel_state", { p_duel: D2 });
    assert.equal(s.round, r); assert.equal(s.phase, "guessing");
    const bg = await one(`select * from public.duel_guesses where duel_id = $1 and round = $2 and side = 'b'`, [D2, r]);
    assert.ok(bg, `bot guess for round ${r} missing`);
    if (r > 1) {
      const near = await val(`select min(public.haversine_km($1, $2, lat, lng)) from private.provinces`, [bg.lat, bg.lng]);
      assert.ok(near < 1e-6, `round ${r} bot guess not on a centroid`);
    }
    assert.ok(!JSON.stringify(s).includes(String(bg.lat)), "bot guess leaked before it is visible");
    await q(`update public.duel_guesses set visible_at = now() - interval '1 second' where duel_id = $1 and round = $2 and side = 'b'`, [D2, r]);
    const p = await roundPhoto(D2, r);
    s = await guess(U.carol, D2, r, p.lat, p.lng, p.year);
    assert.equal(s.phase, "reveal", `round ${r} did not reveal after both guesses`);
    assert.equal(s.reveal.opp.score, bg.score_location + bg.score_year);
    await endReveal(D2);
  }
  const s = await rpc(db, U.carol.who, "duel_state", { p_duel: D2 });
  assert.equal(s.phase, "finished");
  d = await duel(D2);
  const ea = 1 / (1 + 10 ** ((d.bot_elo - 1200) / 400));
  const sa = d.score_a > d.score_b ? 1 : d.score_a < d.score_b ? 0 : 0.5;
  assert.equal(d.elo_a_after, 1200 + Math.round(32 * (sa - ea)));
  assert.equal(d.elo_b_after, null);
  assert.equal(await val(`select elo from public.profiles where id = $1`, [U.carol.id]), d.elo_a_after);
  assert.equal(s.opponent.name, d.bot_name);
});

await test("admin joins a waiting player through the Telegram link", async () => {
  assert.equal((await rpc(db, U.dave.who, "duel_find")).status, "waiting");
  const token = await val(`select token from public.duel_queue where user_id = $1`, [U.dave.id]);
  await rejects(rpc(db, U.alice.who, "duel_admin_join", { p_token: token }), /not_admin/);
  const j = await rpc(db, U.admin.who, "duel_admin_join", { p_token: token });
  assert.equal(j.status, "matched");
  const d = await duel(j.duel_id);
  assert.equal(d.opponent_kind, "admin"); assert.equal(d.player_a, U.dave.id); assert.equal(d.player_b, U.admin.id);
  assert.equal((await rpc(db, U.admin.who, "duel_admin_join", { p_token: token })).status, "gone");
  const s = await rpc(db, U.dave.who, "duel_state", { p_duel: j.duel_id });
  assert.match(s.opponent.name, /^Oyuncu /);
  // the admin cannot join their own queue entry
  await q(`update public.duels set state = 'finished' where id = $1`, [j.duel_id]);
  await rpc(db, U.admin.who, "duel_find");
  const own = await val(`select token from public.duel_queue where user_id = $1`, [U.admin.id]);
  await rejects(rpc(db, U.admin.who, "duel_admin_join", { p_token: own }), /own_queue|not_admin|gone/);
  await rpc(db, U.admin.who, "duel_cancel");
});

await test("free users are limited to 3 duels per day, Pro is not", async () => {
  await q(`insert into public.duels(player_a, opponent_kind, state, round_started_at, round_deadline)
           select $1, 'bot', 'finished', now(), now() from generate_series(1, 2)`, [U.dave.id]);
  await rejects(rpc(db, U.dave.who, "duel_find"), /duel_limit/);
  await q(`insert into public.duels(player_a, opponent_kind, state, round_started_at, round_deadline)
           select $1, 'bot', 'finished', now(), now() from generate_series(1, 3)`, [U.carol.id]);
  assert.equal((await rpc(db, U.carol.who, "duel_find")).status, "waiting");
  await rpc(db, U.carol.who, "duel_cancel");
  assert.equal((await rpc(db, U.carol.who, "duel_queue_status")).status, "cancelled");
});

await test("the Elo window widens while waiting (players already in the queue get paired)", async () => {
  assert.equal((await rpc(db, U.henry.who, "duel_find")).status, "waiting");  // 1200
  assert.equal((await rpc(db, U.ivan.who, "duel_find")).status, "waiting");   // 1500: too far apart right now
  await q(`update public.duel_queue set created_at = now() - interval '15 seconds' where user_id = $1`, [U.henry.id]);
  const st = await rpc(db, U.ivan.who, "duel_queue_status");
  assert.equal(st.status, "matched", "waiting players were never re-matched");
  const hs = await rpc(db, U.henry.who, "duel_queue_status");
  assert.equal(hs.duel_id, st.duel_id);
});

await test("two waiting players are paired by the cron tick too", async () => {
  await q(`update public.duels set state = 'finished' where state = 'active'`);
  await q(`delete from public.duel_queue`);
  await q(`update public.profiles set elo = 1300 where id = $1`, [U.judy.id]);
  // simulate a race: both rows inserted without seeing each other
  await q(`insert into public.duel_queue(user_id, elo) values ($1, 1300), ($2, 1250)`, [U.judy.id, U.grace.id]);
  await q(`select private.duel_tick()`);
  const rows = await q(`select status, duel_id from public.duel_queue where user_id in ($1, $2)`, [U.judy.id, U.grace.id]);
  assert.ok(rows.every((r) => r.status === "matched") && rows[0].duel_id === rows[1].duel_id, JSON.stringify(rows));
});

await test("duel_tick survives a failing queue entry (empty duel pool)", async () => {
  await q(`update public.duels set state = 'finished' where state = 'active'`);
  await q(`delete from public.duel_queue`);
  // make the duel pool unusable for one user, and have a normal active duel that must still advance
  await q(`update public.profiles set elo = 1200 where id in ($1, $2)`, [U.henry.id, U.grace.id]);
  assert.equal((await rpc(db, U.henry.who, "duel_find")).status, "waiting");
  const { duel_id } = await rpc(db, U.grace.who, "duel_find");
  assert.ok(duel_id, "henry/grace not matched");
  await q(`update public.duels set round_started_at = now() - interval '60 seconds', round_deadline = now() - interval '10 seconds' where id = $1`, [duel_id]);
  await rpc(db, U.nobody.who, "duel_find");
  await q(`update public.duel_queue set created_at = now() - interval '130 seconds' where user_id = $1`, [U.nobody.id]);
  await q(`update public.photos set status = 'emekli' where pool = 'duel' or id = any($1::uuid[])`, [yesterdayIds]);
  await q(`select private.duel_tick()`); // must not throw
  const d = await duel(duel_id);
  assert.ok(d.current_round === 2 || d.reveal_until, "active duel did not advance because another queue entry failed");
  assert.equal(await val(`select count(*)::int from public.duel_guesses where duel_id = $1 and round = 1`, [duel_id]), 2);
  assert.equal(await val(`select status from public.duel_queue where user_id = $1`, [U.nobody.id]), "waiting");
  await rejects(rpc(db, U.nobody.who, "duel_queue_status"), /duel_pool_empty/);
  await q(`update public.photos set status = 'onayli' where pool = 'duel'`);
  await q(`update public.photos set status = 'yayinda' where id = any($1::uuid[])`, [yesterdayIds]);
});

// ---------------------------------------------------------------------------
section("Service-only RPCs");
// ---------------------------------------------------------------------------
await test("streak_danger_targets: service only, returns users whose streak is at risk", async () => {
  await rejects(rpcRows(db, ANON, "streak_danger_targets"), /forbidden/);
  await rejects(rpcRows(db, U.alice.who, "streak_danger_targets"), /forbidden/);
  await q(`update public.profiles set push_token = 'ExponentPushToken[grace]' where id = $1`, [U.grace.id]);
  const rows = await rpcRows(db, SERVICE, "streak_danger_targets");
  assert.deepEqual(rows, [{ push_token: "ExponentPushToken[grace]", streak: 2 }]);
});

await test("weekly_kpis: service only", async () => {
  await rejects(rpc(db, U.alice.who, "weekly_kpis"), /forbidden/);
  await rejects(rpc(db, ANON, "weekly_kpis"), /forbidden/);
  const k = await rpc(db, SERVICE, "weekly_kpis");
  for (const key of ["active_7d", "completions_7d", "challenges_7d", "challenge_plays_7d", "duels_7d", "bot_duels_7d", "pro_total", "days_ahead", "photos_left"]) {
    assert.ok(key in k, `missing ${key}`);
  }
  assert.ok(k.completions_7d >= 4); assert.ok(k.bot_duels_7d >= 1); assert.equal(k.pro_total, 1);
});

// ---------------------------------------------------------------------------
section("Web");
// ---------------------------------------------------------------------------
await test("join_waitlist validation and rate limit", async () => {
  await rpc(db, ANON, "join_waitlist", { p_email: "  Test@Example.COM " });
  await rpc(db, ANON, "join_waitlist", { p_email: "test@example.com" });
  assert.deepEqual((await q(`select email from public.waitlist`)).map((r) => r.email), ["test@example.com"]);
  for (const bad of ["not-an-email", "a@b", "x@y.z w", "@example.com", `${"a".repeat(250)}@example.com`]) {
    await rejects(rpc(db, ANON, "join_waitlist", { p_email: bad }), /bad_email/);
  }
  await rejects(rpc(db, ANON, "join_waitlist", { p_email: null }), /bad_email/);
  await q(`insert into public.waitlist(email) select 'bulk' || i || '@example.com' from generate_series(1, 30) i`);
  await rejects(rpc(db, ANON, "join_waitlist", { p_email: "late@example.com" }), /rate_limited/);
  await q(`update public.waitlist set created_at = now() - interval '5 minutes'`);
  await rpc(db, ANON, "join_waitlist", { p_email: "late@example.com" });
});

await test("list_sources lists only already-published (past) days", async () => {
  const rows = await rpc(db, ANON, "list_sources");
  assert.equal(rows.length, 5);
  assert.ok(rows.every((r) => r.day === YESTERDAY));
  assert.ok(!JSON.stringify(rows).includes(todays[0].location_name));
});

// ---------------------------------------------------------------------------
section("Retention cleanup");
// ---------------------------------------------------------------------------
await test("private.cleanup deletes anonymous accounts idle for 24 months (cascade)", async () => {
  const old = await mkUser("oldie", { anonymous: true, created: new Date(Date.now() - 800 * 86400e3).toISOString() });
  await addResult(old.id, YESTERDAY);
  const n0 = await notifyCount();
  await q(`select private.cleanup()`);
  assert.equal(await val(`select count(*)::int from auth.users where id = $1`, [old.id]), 0);
  assert.equal(await val(`select count(*)::int from public.profiles where id = $1`, [old.id]), 0);
  assert.equal(await val(`select count(*)::int from auth.users where id = $1`, [U.erin.id]), 1);
  assert.equal(await notifyCount(), n0 + 1);
  assert.ok(await val(`select count(*)::int from public.waitlist`) > 0, "waitlist purged before launch + 6 months");
});

// ---------------------------------------------------------------------------
section("schedule_days with a constrained pool (fresh database)");
// ---------------------------------------------------------------------------
// 5 regions x (kolay, orta, zor), all from the same era: distinct eras are impossible, distinct regions are not.
// The rules must relax era first, keep regions distinct and still include a kolay and a zor every day.
await test("relaxes era before region and keeps ≥1 kolay + ≥1 zor", async () => {
  for (let run = 0; run < 4; run++) {
    const db2 = await createDb();
    await applyMigrations(db2);
    await db2.exec(`update public.app_config set value = '"2000-01-01"' where key = 'schedule_start'`);
    const regions = REGIONS.slice(0, 5);
    for (const [ri, region] of regions.entries()) {
      for (const difficulty of DIFFS) {
        const pv = provinces.find((p) => p.region === region);
        const id = randomUUID();
        await db2.query(`insert into public.photos(id, image_path, year, lat, lng, location_name, region, difficulty,
                           source_name, source_url, author, license_code, pool, status)
                         values ($1, $7, $2, $3, $4, 'x', $5, $6, 's', 'u', 'a', 'l', 'daily', 'onayli')`,
          [id, 1960 + ri, pv.lat, pv.lng, region, difficulty, `${id}.jpg`]);
      }
    }
    assert.equal((await db2.query(`select public.schedule_days(2) n`)).rows[0].n, 3);
    const days = (await db2.query(`select dp.day::text d, array_agg(p.region) regions, array_agg(p.difficulty::text) diffs
                                     from public.day_photos dp join public.photos p on p.id = dp.photo_id
                                    group by dp.day order by dp.day`)).rows;
    for (const [i, d] of days.entries()) {
      assert.equal(new Set(d.regions).size, 5, `run ${run} ${d.d}: regions ${d.regions}`);
      if (i < 2) assert.ok(d.diffs.includes("kolay") && d.diffs.includes("zor"), `run ${run} ${d.d}: ${d.diffs}`);
    }
    await db2.close();
  }
});

// ---------------------------------------------------------------------------
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log(`Failed:\n${failed.map((f) => `  - ${f.name}`).join("\n")}`);
  process.exit(1);
}
