create schema if not exists ingestion;

create table if not exists ingestion.sofifa_import_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'sofifa',
  game_code text not null,
  platform text not null default 'web',
  title text not null,
  version_label text not null,
  roster_date date,
  source_url text,
  status text not null default 'staged',
  staging_path text,
  raw_counts jsonb not null default '{}'::jsonb,
  validation_summary jsonb not null default '{}'::jsonb,
  diff_summary jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sofifa_import_runs_provider_check check (provider = 'sofifa'),
  constraint sofifa_import_runs_platform_check check (platform in ('console', 'pc', 'web', 'mobile')),
  constraint sofifa_import_runs_status_check check (status in ('staged', 'transformed', 'validated', 'loaded', 'failed')),
  constraint sofifa_import_runs_unique unique (provider, game_code, platform, version_label)
);

create table if not exists ingestion.sofifa_raw_nations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references ingestion.sofifa_import_runs(id) on delete cascade,
  sofifa_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint sofifa_raw_nations_run_key_unique unique (run_id, sofifa_id)
);

create table if not exists ingestion.sofifa_raw_leagues (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references ingestion.sofifa_import_runs(id) on delete cascade,
  sofifa_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint sofifa_raw_leagues_run_key_unique unique (run_id, sofifa_id)
);

create table if not exists ingestion.sofifa_raw_clubs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references ingestion.sofifa_import_runs(id) on delete cascade,
  sofifa_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint sofifa_raw_clubs_run_key_unique unique (run_id, sofifa_id)
);

create table if not exists ingestion.sofifa_raw_players (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references ingestion.sofifa_import_runs(id) on delete cascade,
  sofifa_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint sofifa_raw_players_run_key_unique unique (run_id, sofifa_id)
);

create table if not exists ingestion.sofifa_refresh_diffs (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'sofifa',
  base_version_label text not null,
  next_version_label text not null,
  diff_payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint sofifa_refresh_diffs_provider_check check (provider = 'sofifa'),
  constraint sofifa_refresh_diffs_unique unique (provider, base_version_label, next_version_label)
);

alter table public.player_game_snapshots
  add column if not exists source_run_id uuid references ingestion.sofifa_import_runs(id) on delete set null,
  add column if not exists source_payload jsonb not null default '{}'::jsonb;

create index if not exists sofifa_import_runs_status_idx on ingestion.sofifa_import_runs(status);
create index if not exists sofifa_import_runs_started_at_idx on ingestion.sofifa_import_runs(started_at desc);
create index if not exists sofifa_raw_players_run_id_idx on ingestion.sofifa_raw_players(run_id);
create index if not exists player_game_snapshots_source_run_id_idx on public.player_game_snapshots(source_run_id);

create trigger set_sofifa_import_runs_updated_at
  before update on ingestion.sofifa_import_runs
  for each row execute function public.set_updated_at();

alter table ingestion.sofifa_import_runs enable row level security;
alter table ingestion.sofifa_raw_nations enable row level security;
alter table ingestion.sofifa_raw_leagues enable row level security;
alter table ingestion.sofifa_raw_clubs enable row level security;
alter table ingestion.sofifa_raw_players enable row level security;
alter table ingestion.sofifa_refresh_diffs enable row level security;

grant usage on schema ingestion to service_role;
grant select, insert, update, delete on all tables in schema ingestion to service_role;
