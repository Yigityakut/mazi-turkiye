// Mazi Türkiye · Supabase migration test harness (PGlite = real Postgres 17 in WASM)
// Emulates the parts of a Supabase project the migrations rely on, then applies
// supabase/migrations/*.sql in order. Used by run.mjs.
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
// MIGRATIONS_DIR env var lets you run the suite against another copy (e.g. a pre-fix checkout)
export const MIGRATIONS_DIR = path.resolve(process.env.MIGRATIONS_DIR || path.resolve(here, "../migrations"));

// ---------------------------------------------------------------------------
// Supabase platform stubs (created before the migrations, as the platform would)
// ---------------------------------------------------------------------------
export const SUPABASE_STUBS = String.raw`
-- Roles PostgREST switches to. service_role bypasses RLS like on Supabase.
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

-- extensions schema (pgcrypto lives here on Supabase)
create schema extensions;
create extension if not exists pgcrypto with schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;

-- auth schema
create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  is_anonymous boolean not null default false,
  email text,
  created_at timestamptz default now(),
  last_sign_in_at timestamptz
);
-- Same bodies as Supabase's auth.uid()/auth.role() (legacy claim GUCs + request.jwt.claims JSON)
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;
create function auth.role() returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;

-- pg_net stub: records every request instead of sending it
create schema net;
create table net.http_request_log (
  id bigint generated always as identity primary key,
  url text not null,
  body jsonb,
  params jsonb,
  headers jsonb,
  timeout_milliseconds int,
  created_at timestamptz not null default clock_timestamp()
);
create function net.http_post(
  url text,
  body jsonb default '{}'::jsonb,
  params jsonb default '{}'::jsonb,
  headers jsonb default '{"Content-Type": "application/json"}'::jsonb,
  timeout_milliseconds int default 5000
) returns bigint language sql volatile as $$
  insert into net.http_request_log(url, body, params, headers, timeout_milliseconds)
  values (url, body, params, headers, timeout_milliseconds) returning id
$$;

-- pg_cron stub: validates the schedule like pg_cron >= 1.5 (cron expr or 'N seconds') and upserts by name
create schema cron;
create table cron.job (
  jobid bigint generated always as identity primary key,
  jobname text unique,
  schedule text not null,
  command text not null
);
create function cron.schedule(job_name text, schedule text, command text) returns bigint
language plpgsql as $$
declare id bigint;
begin
  if schedule !~ '^\s*([1-9]|[1-5][0-9])\s+seconds?\s*$'
     and array_length(regexp_split_to_array(trim(schedule), '\s+'), 1) <> 5
     and schedule !~ '^@(yearly|annually|monthly|weekly|daily|hourly|reboot)$' then
    raise exception 'invalid schedule: %', schedule;
  end if;
  insert into cron.job(jobname, schedule, command) values (job_name, schedule, command)
  on conflict (jobname) do update set schedule = excluded.schedule, command = excluded.command
  returning jobid into id;
  return id;
end $$;

-- storage schema
create schema storage;
create table storage.buckets (
  id text primary key,
  name text not null unique,
  owner uuid,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Realtime publication
create publication supabase_realtime;

-- Supabase's default grants: everything in public is reachable by the API roles
-- (RLS and function bodies are the only protection).
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

// The platform installs pg_net/pg_cron; PGlite cannot, so the harness strips those statements
// when loading (the migration files themselves stay untouched).
export function rewriteForHarness(sql) {
  return sql.replace(
    /create\s+extension\s+(if\s+not\s+exists\s+)?"?(pg_net|pg_cron)"?[^;]*;/gi,
    (m) => `-- [harness] stubbed: ${m.replace(/\s+/g, " ")}`,
  );
}

export function migrationFiles() {
  return fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
}

export async function createDb() {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(SUPABASE_STUBS);
  return db;
}

// Applies every migration in its own transaction (like `supabase db push`).
export async function applyMigrations(db, { log = () => {} } = {}) {
  for (const f of migrationFiles()) {
    const sql = rewriteForHarness(fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8"));
    try {
      await db.transaction(async (tx) => { await tx.exec(sql); });
      log(`applied ${f}`);
    } catch (e) {
      const err = new Error(`migration ${f} failed: ${e.message}${e.position ? ` (at char ${e.position})` : ""}${e.where ? `\n  where: ${e.where}` : ""}`);
      err.cause = e;
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Impersonation: run inside a transaction as PostgREST would
// who = null              -> postgres (pg_cron / SQL editor)
// who = { role: 'anon' }  -> anon key
// who = { role: 'authenticated', sub: '<uuid>' }
// who = { role: 'service_role' }
// ---------------------------------------------------------------------------
export async function as(db, who, fn) {
  return db.transaction(async (tx) => {
    if (who) {
      const claims = JSON.stringify({ sub: who.sub ?? null, role: who.role });
      await tx.query(
        `select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claim.role', $2, true),
                set_config('request.jwt.claims', $3, true)`,
        [who.sub ?? "", who.role, claims],
      );
      await tx.exec(`set local role ${who.role}`);
    }
    return fn(tx);
  });
}

export async function rpc(db, who, fn, args = {}) {
  const keys = Object.keys(args);
  const vals = keys.map((k) => {
    const v = args[k];
    if (v === null || v === undefined) return null;
    if (typeof v === "object" && !(v instanceof Date)) return JSON.stringify(v);
    return v;
  });
  const sql = `select public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(", ")}) as r`;
  const res = await as(db, who, (tx) => tx.query(sql, vals));
  return res.rows[0]?.r;
}

export async function rpcRows(db, who, fn, args = {}) {
  const keys = Object.keys(args);
  const vals = keys.map((k) => args[k]);
  const sql = `select * from public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(", ")})`;
  const res = await as(db, who, (tx) => tx.query(sql, vals));
  return res.rows;
}
