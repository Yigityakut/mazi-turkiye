# Mazi Türkiye — agent notes

- Before starting work, read `STATUS.md` (where we left off, unfinished work), `HUMAN_TODO.md` (human gates) and `DECISIONS.md` (decisions already made; do not reopen them). Product plan: `Plan.md`.
- The user has left all decisions to the agent: do not ask questions, make the decision and write one line in `DECISIONS.md`. Update `STATUS.md` at the end of the session.
- Supabase project: `timeguessr` (ref `ybhiddgwunzyquzrbzaf`, eu-central-1). Migrations live in `supabase/migrations/`; after a change, `cd supabase/tests && npm test` (62 scenarios) must be green. `20261104000100_core.sql` is live; do not modify it, add a new migration.
- The app is in `app/` (Expo SDK 58, expo-router). After a change, run `npx tsc --noEmit`. Verify Expo APIs against the installed package types and docs.expo.dev, not from memory (`app/AGENTS.md`).
- Secret values are never written to the repo (`.env`, EAS env, Supabase secrets).
- Do not use competitor apps' (TimeGuessr etc.) names, images or text; do not generate "old photos" with AI; do not write fake user counts or reviews.
- All user-facing texts (app, web, store) are in Turkish. Internal docs are in English.
