# SoFIFA Reference Data Pipeline

Phase 4 keeps scraping and ingestion outside the web app. The app reads normalized
reference tables; these scripts create staged files, validate them, and load a
versioned snapshot into Supabase with `provider = 'sofifa'` entries in
`public.external_ids`.

## MVP Fields

- Nations: SoFIFA id, name, ISO2, ISO3.
- Leagues: SoFIFA id, name, short name, country, level, gender.
- Clubs: SoFIFA id, name, short name, country, league, city, founded year,
  stadium.
- Players: SoFIFA id, full name, known-as name, age, date of birth, nationality,
  club, league, primary position, all positions, overall, potential, preferred
  foot, height, value, wage, currency, and extra attributes JSON.

## Workflow

```bash
node scripts/sofifa/scrape.mjs --game fc26 --version fc26-2026-08-17 --pages 1
node scripts/sofifa/transform.mjs --in data/sofifa/staging/fc26-2026-08-17/raw.json
node scripts/sofifa/validate.mjs --in data/sofifa/staging/fc26-2026-08-17/clean.json
node scripts/sofifa/diff.mjs --base data/sofifa/staging/previous/clean.json --next data/sofifa/staging/fc26-2026-08-17/clean.json
node scripts/sofifa/load.mjs --in data/sofifa/staging/fc26-2026-08-17/clean.json
```

`load.mjs` requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
It refuses to load if validation has errors unless `--force` is supplied.

## Versioning

Use a new `--version` label for every refresh. The loader maps that label to
`public.game_versions` and writes one `player_game_snapshots` row per player per
game version, preserving older versions for career-save comparisons.
