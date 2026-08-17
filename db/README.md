# Database Workflow

This project uses Supabase migrations in `supabase/migrations` and seed data in
`supabase/seed.sql`.

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Run `pnpm run db:start`.
3. Run `pnpm run db:reset` to apply migrations and seed data.
4. Run `pnpm run db:types` after schema changes.

## Schema Changes

Create migrations with:

```bash
pnpm run db:migration:new <descriptive_name>
```

Then edit the generated SQL file and verify with:

```bash
pnpm run db:reset
pnpm run db:lint
```

Tables in the public schema are protected with RLS and explicit grants. Do not
add public tables without ownership policies and role grants.

## Phase 2 Shape

Reference data is normalized into public read-only tables for `countries`,
`leagues`, `clubs`, `players`, `external_ids`, `game_versions`, and
`player_game_snapshots`. Career data remains user-owned under `career_saves`
with season, player, snapshot, transfer, match, lineup, event, trophy, setting,
and audit tables linked by composite `(save_id, user_id)` ownership keys.

## Phase 4 SoFIFA Pipeline

SoFIFA ingestion runs through standalone scripts in `scripts/sofifa`, not the
web app. Raw and normalized staging files live under `data/sofifa/staging`, with
future generated refresh output ignored by git. The private `ingestion` schema
tracks import runs, raw staged entities, and refresh diffs. Loaded records keep
SoFIFA identifiers in `public.external_ids` and preserve roster updates as
separate `public.game_versions` plus `public.player_game_snapshots` rows.
