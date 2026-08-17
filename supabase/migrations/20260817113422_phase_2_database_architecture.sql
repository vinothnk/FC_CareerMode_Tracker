create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.career_saves
  add column if not exists reference_club_id uuid,
  add column if not exists game_version_id uuid,
  add column if not exists status text not null default 'active',
  add column if not exists started_on date,
  add column if not exists last_played_at timestamptz,
  add constraint career_saves_status_check check (status in ('active', 'archived', 'completed'));

create table public.countries (
  id uuid primary key default gen_random_uuid(),
  iso2 char(2) not null,
  iso3 char(3),
  name text not null,
  region text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint countries_iso2_upper_check check (iso2 = upper(iso2)),
  constraint countries_iso3_upper_check check (iso3 is null or iso3 = upper(iso3)),
  constraint countries_iso2_unique unique (iso2),
  constraint countries_iso3_unique unique (iso3),
  constraint countries_name_unique unique (name)
);

create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references public.countries(id) on delete set null,
  name text not null,
  short_name text,
  level smallint,
  gender text not null default 'men',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leagues_gender_check check (gender in ('men', 'women', 'mixed')),
  constraint leagues_level_check check (level is null or level > 0),
  constraint leagues_country_name_unique unique (country_id, name)
);

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references public.countries(id) on delete set null,
  league_id uuid references public.leagues(id) on delete set null,
  name text not null,
  short_name text,
  city text,
  founded_year smallint,
  stadium_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clubs_founded_year_check check (founded_year is null or founded_year between 1850 and 2100),
  constraint clubs_country_name_unique unique (country_id, name)
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references public.countries(id) on delete set null,
  full_name text not null,
  known_as text,
  date_of_birth date,
  primary_position text,
  preferred_foot text,
  height_cm smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_preferred_foot_check check (preferred_foot is null or preferred_foot in ('left', 'right')),
  constraint players_height_cm_check check (height_cm is null or height_cm between 120 and 230),
  constraint players_identity_unique unique (full_name, date_of_birth, country_id)
);

create table public.game_versions (
  id uuid primary key default gen_random_uuid(),
  game_code text not null,
  platform text not null,
  title text not null,
  version_label text not null,
  roster_date date,
  release_date date,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_versions_platform_check check (platform in ('console', 'pc', 'web', 'mobile')),
  constraint game_versions_code_platform_label_unique unique (game_code, platform, version_label)
);

create table public.player_game_snapshots (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  game_version_id uuid not null references public.game_versions(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete set null,
  overall smallint not null,
  potential smallint,
  age smallint,
  value_amount numeric(14, 2),
  wage_amount numeric(14, 2),
  currency char(3) not null default 'USD',
  positions text[] not null default '{}',
  attributes jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_game_snapshots_overall_check check (overall between 1 and 99),
  constraint player_game_snapshots_potential_check check (potential is null or potential between 1 and 99),
  constraint player_game_snapshots_age_check check (age is null or age between 15 and 60),
  constraint player_game_snapshots_value_check check (value_amount is null or value_amount >= 0),
  constraint player_game_snapshots_wage_check check (wage_amount is null or wage_amount >= 0),
  constraint player_game_snapshots_currency_upper_check check (currency = upper(currency)),
  constraint player_game_snapshots_player_version_unique unique (player_id, game_version_id)
);

create table public.external_ids (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_key text not null,
  external_url text,
  country_id uuid references public.countries(id) on delete cascade,
  league_id uuid references public.leagues(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  game_version_id uuid references public.game_versions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_ids_one_entity_check check (
    num_nonnulls(country_id, league_id, club_id, player_id, game_version_id) = 1
  ),
  constraint external_ids_provider_key_unique unique (provider, external_key),
  constraint external_ids_country_provider_unique unique (provider, country_id),
  constraint external_ids_league_provider_unique unique (provider, league_id),
  constraint external_ids_club_provider_unique unique (provider, club_id),
  constraint external_ids_player_provider_unique unique (provider, player_id),
  constraint external_ids_game_version_provider_unique unique (provider, game_version_id)
);

alter table public.career_saves
  add constraint career_saves_reference_club_id_fkey foreign key (reference_club_id) references public.clubs(id) on delete set null,
  add constraint career_saves_game_version_id_fkey foreign key (game_version_id) references public.game_versions(id) on delete set null;

alter table public.career_saves
  add constraint career_saves_id_user_id_unique unique (id, user_id);

create table public.save_seasons (
  id uuid primary key default gen_random_uuid(),
  save_id uuid not null,
  user_id uuid not null,
  season_number smallint not null,
  label text not null,
  starts_on date,
  ends_on date,
  transfer_budget numeric(14, 2) not null default 0,
  wage_budget numeric(14, 2) not null default 0,
  board_expectations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint save_seasons_save_owner_fkey foreign key (save_id, user_id) references public.career_saves(id, user_id) on delete cascade,
  constraint save_seasons_number_check check (season_number > 0),
  constraint save_seasons_budget_check check (transfer_budget >= 0 and wage_budget >= 0),
  constraint save_seasons_dates_check check (starts_on is null or ends_on is null or starts_on <= ends_on),
  constraint save_seasons_save_number_unique unique (save_id, season_number),
  constraint save_seasons_id_save_user_unique unique (id, save_id, user_id)
);

create table public.save_players (
  id uuid primary key default gen_random_uuid(),
  save_id uuid not null,
  user_id uuid not null,
  reference_player_id uuid references public.players(id) on delete set null,
  current_club_id uuid references public.clubs(id) on delete set null,
  display_name text not null,
  primary_position text not null,
  squad_number smallint,
  status text not null default 'active',
  joined_on date,
  left_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint save_players_save_owner_fkey foreign key (save_id, user_id) references public.career_saves(id, user_id) on delete cascade,
  constraint save_players_status_check check (status in ('active', 'loaned_out', 'sold', 'released', 'retired')),
  constraint save_players_squad_number_check check (squad_number is null or squad_number between 1 and 99),
  constraint save_players_dates_check check (joined_on is null or left_on is null or joined_on <= left_on),
  constraint save_players_id_save_user_unique unique (id, save_id, user_id)
);

create table public.player_snapshots (
  id uuid primary key default gen_random_uuid(),
  save_player_id uuid not null,
  save_id uuid not null,
  user_id uuid not null,
  season_id uuid,
  snapshot_date date not null default current_date,
  overall smallint not null,
  potential smallint,
  age smallint,
  morale text,
  form text,
  value_amount numeric(14, 2),
  wage_amount numeric(14, 2),
  contract_end_year smallint,
  attributes jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_snapshots_player_owner_fkey foreign key (save_player_id, save_id, user_id) references public.save_players(id, save_id, user_id) on delete cascade,
  constraint player_snapshots_season_owner_fkey foreign key (season_id, save_id, user_id) references public.save_seasons(id, save_id, user_id) on delete set null (season_id),
  constraint player_snapshots_overall_check check (overall between 1 and 99),
  constraint player_snapshots_potential_check check (potential is null or potential between 1 and 99),
  constraint player_snapshots_age_check check (age is null or age between 15 and 60),
  constraint player_snapshots_value_check check (value_amount is null or value_amount >= 0),
  constraint player_snapshots_wage_check check (wage_amount is null or wage_amount >= 0),
  constraint player_snapshots_contract_year_check check (contract_end_year is null or contract_end_year between 2020 and 2200),
  constraint player_snapshots_player_date_unique unique (save_player_id, snapshot_date)
);

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  save_id uuid not null,
  user_id uuid not null,
  season_id uuid,
  save_player_id uuid,
  reference_player_id uuid references public.players(id) on delete set null,
  from_club_id uuid references public.clubs(id) on delete set null,
  to_club_id uuid references public.clubs(id) on delete set null,
  transfer_type text not null,
  direction text not null,
  status text not null default 'completed',
  transfer_date date,
  fee_amount numeric(14, 2),
  wage_amount numeric(14, 2),
  currency char(3) not null default 'USD',
  contract_years smallint,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transfers_save_owner_fkey foreign key (save_id, user_id) references public.career_saves(id, user_id) on delete cascade,
  constraint transfers_season_owner_fkey foreign key (season_id, save_id, user_id) references public.save_seasons(id, save_id, user_id) on delete set null (season_id),
  constraint transfers_player_owner_fkey foreign key (save_player_id, save_id, user_id) references public.save_players(id, save_id, user_id) on delete set null (save_player_id),
  constraint transfers_type_check check (transfer_type in ('permanent', 'loan', 'free_agent', 'release', 'contract_renewal')),
  constraint transfers_direction_check check (direction in ('in', 'out', 'internal')),
  constraint transfers_status_check check (status in ('rumour', 'shortlisted', 'negotiating', 'completed', 'failed', 'cancelled')),
  constraint transfers_fee_check check (fee_amount is null or fee_amount >= 0),
  constraint transfers_wage_check check (wage_amount is null or wage_amount >= 0),
  constraint transfers_currency_upper_check check (currency = upper(currency)),
  constraint transfers_contract_years_check check (contract_years is null or contract_years between 1 and 10)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  save_id uuid not null,
  user_id uuid not null,
  season_id uuid,
  competition text not null,
  match_round text,
  match_date date,
  home_club_id uuid references public.clubs(id) on delete set null,
  away_club_id uuid references public.clubs(id) on delete set null,
  home_club_name text not null,
  away_club_name text not null,
  venue text not null,
  result text,
  goals_for smallint not null default 0,
  goals_against smallint not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_save_owner_fkey foreign key (save_id, user_id) references public.career_saves(id, user_id) on delete cascade,
  constraint matches_season_owner_fkey foreign key (season_id, save_id, user_id) references public.save_seasons(id, save_id, user_id) on delete set null (season_id),
  constraint matches_venue_check check (venue in ('home', 'away', 'neutral')),
  constraint matches_result_check check (result is null or result in ('win', 'draw', 'loss')),
  constraint matches_score_check check (goals_for >= 0 and goals_against >= 0),
  constraint matches_id_save_user_unique unique (id, save_id, user_id)
);

create table public.match_lineups (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null,
  save_id uuid not null,
  user_id uuid not null,
  save_player_id uuid,
  player_name text not null,
  team_side text not null default 'user',
  position text,
  shirt_number smallint,
  is_starter boolean not null default false,
  minutes_played smallint,
  rating numeric(3, 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_lineups_match_owner_fkey foreign key (match_id, save_id, user_id) references public.matches(id, save_id, user_id) on delete cascade,
  constraint match_lineups_player_owner_fkey foreign key (save_player_id, save_id, user_id) references public.save_players(id, save_id, user_id) on delete set null (save_player_id),
  constraint match_lineups_team_side_check check (team_side in ('user', 'opponent')),
  constraint match_lineups_shirt_number_check check (shirt_number is null or shirt_number between 1 and 99),
  constraint match_lineups_minutes_check check (minutes_played is null or minutes_played between 0 and 130),
  constraint match_lineups_rating_check check (rating is null or rating between 0 and 10)
);

create table public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null,
  save_id uuid not null,
  user_id uuid not null,
  save_player_id uuid,
  related_save_player_id uuid,
  event_type text not null,
  team_side text not null default 'user',
  minute smallint,
  period text not null default 'regular',
  event_payload jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_events_match_owner_fkey foreign key (match_id, save_id, user_id) references public.matches(id, save_id, user_id) on delete cascade,
  constraint match_events_player_owner_fkey foreign key (save_player_id, save_id, user_id) references public.save_players(id, save_id, user_id) on delete set null (save_player_id),
  constraint match_events_related_player_owner_fkey foreign key (related_save_player_id, save_id, user_id) references public.save_players(id, save_id, user_id) on delete set null (related_save_player_id),
  constraint match_events_type_check check (event_type in ('goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'injury', 'penalty_goal', 'penalty_miss', 'own_goal')),
  constraint match_events_team_side_check check (team_side in ('user', 'opponent')),
  constraint match_events_minute_check check (minute is null or minute between 0 and 130),
  constraint match_events_period_check check (period in ('regular', 'extra_time', 'penalties'))
);

create table public.trophies (
  id uuid primary key default gen_random_uuid(),
  save_id uuid not null,
  user_id uuid not null,
  season_id uuid,
  competition text not null,
  trophy_name text not null,
  result text not null default 'winner',
  won_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trophies_save_owner_fkey foreign key (save_id, user_id) references public.career_saves(id, user_id) on delete cascade,
  constraint trophies_season_owner_fkey foreign key (season_id, save_id, user_id) references public.save_seasons(id, save_id, user_id) on delete set null (season_id),
  constraint trophies_result_check check (result in ('winner', 'runner_up', 'semifinalist', 'qualified')),
  constraint trophies_save_competition_season_unique unique (save_id, season_id, competition, trophy_name)
);

create table public.save_settings (
  id uuid primary key default gen_random_uuid(),
  save_id uuid not null,
  user_id uuid not null,
  setting_key text not null,
  setting_value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint save_settings_save_owner_fkey foreign key (save_id, user_id) references public.career_saves(id, user_id) on delete cascade,
  constraint save_settings_save_key_unique unique (save_id, setting_key),
  constraint save_settings_key_format_check check (setting_key ~ '^[a-z][a-z0-9_]*$')
);

create table public.career_audit_events (
  id uuid primary key default gen_random_uuid(),
  save_id uuid,
  user_id uuid not null,
  actor_user_id uuid not null,
  event_type text not null,
  entity_table text,
  entity_id uuid,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint career_audit_events_save_owner_fkey foreign key (save_id, user_id) references public.career_saves(id, user_id) on delete set null (save_id),
  constraint career_audit_events_actor_check check (actor_user_id = user_id)
);

create table public.reference_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  event_type text not null,
  entity_table text not null,
  entity_id uuid,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index career_saves_reference_club_id_idx on public.career_saves(reference_club_id);
create index career_saves_game_version_id_idx on public.career_saves(game_version_id);
create index countries_name_idx on public.countries(name);
create index leagues_country_id_idx on public.leagues(country_id);
create index clubs_country_id_idx on public.clubs(country_id);
create index clubs_league_id_idx on public.clubs(league_id);
create index clubs_name_idx on public.clubs(name);
create index players_country_id_idx on public.players(country_id);
create index players_full_name_idx on public.players(full_name);
create index player_game_snapshots_player_id_idx on public.player_game_snapshots(player_id);
create index player_game_snapshots_game_version_id_idx on public.player_game_snapshots(game_version_id);
create index player_game_snapshots_club_id_idx on public.player_game_snapshots(club_id);
create index external_ids_country_id_idx on public.external_ids(country_id);
create index external_ids_league_id_idx on public.external_ids(league_id);
create index external_ids_club_id_idx on public.external_ids(club_id);
create index external_ids_player_id_idx on public.external_ids(player_id);
create index external_ids_game_version_id_idx on public.external_ids(game_version_id);
create index save_seasons_save_id_idx on public.save_seasons(save_id);
create index save_seasons_user_id_idx on public.save_seasons(user_id);
create index save_players_save_id_idx on public.save_players(save_id);
create index save_players_user_id_idx on public.save_players(user_id);
create index save_players_reference_player_id_idx on public.save_players(reference_player_id);
create index player_snapshots_save_player_id_idx on public.player_snapshots(save_player_id);
create index player_snapshots_save_id_idx on public.player_snapshots(save_id);
create index player_snapshots_user_id_idx on public.player_snapshots(user_id);
create index transfers_save_id_idx on public.transfers(save_id);
create index transfers_user_id_idx on public.transfers(user_id);
create index transfers_save_player_id_idx on public.transfers(save_player_id);
create index matches_save_id_idx on public.matches(save_id);
create index matches_user_id_idx on public.matches(user_id);
create index matches_season_id_idx on public.matches(season_id);
create index match_lineups_match_id_idx on public.match_lineups(match_id);
create index match_lineups_user_id_idx on public.match_lineups(user_id);
create index match_events_match_id_idx on public.match_events(match_id);
create index match_events_user_id_idx on public.match_events(user_id);
create index trophies_save_id_idx on public.trophies(save_id);
create index trophies_user_id_idx on public.trophies(user_id);
create index save_settings_save_id_idx on public.save_settings(save_id);
create index save_settings_user_id_idx on public.save_settings(user_id);
create index career_audit_events_save_id_idx on public.career_audit_events(save_id);
create index career_audit_events_user_id_idx on public.career_audit_events(user_id);
create index career_audit_events_occurred_at_idx on public.career_audit_events(occurred_at desc);
create index reference_audit_events_entity_idx on public.reference_audit_events(entity_table, entity_id);
create index reference_audit_events_occurred_at_idx on public.reference_audit_events(occurred_at desc);

create trigger set_career_saves_updated_at
  before update on public.career_saves
  for each row execute function public.set_updated_at();

create trigger set_countries_updated_at before update on public.countries for each row execute function public.set_updated_at();
create trigger set_leagues_updated_at before update on public.leagues for each row execute function public.set_updated_at();
create trigger set_clubs_updated_at before update on public.clubs for each row execute function public.set_updated_at();
create trigger set_players_updated_at before update on public.players for each row execute function public.set_updated_at();
create trigger set_external_ids_updated_at before update on public.external_ids for each row execute function public.set_updated_at();
create trigger set_game_versions_updated_at before update on public.game_versions for each row execute function public.set_updated_at();
create trigger set_player_game_snapshots_updated_at before update on public.player_game_snapshots for each row execute function public.set_updated_at();
create trigger set_save_seasons_updated_at before update on public.save_seasons for each row execute function public.set_updated_at();
create trigger set_save_players_updated_at before update on public.save_players for each row execute function public.set_updated_at();
create trigger set_player_snapshots_updated_at before update on public.player_snapshots for each row execute function public.set_updated_at();
create trigger set_transfers_updated_at before update on public.transfers for each row execute function public.set_updated_at();
create trigger set_matches_updated_at before update on public.matches for each row execute function public.set_updated_at();
create trigger set_match_lineups_updated_at before update on public.match_lineups for each row execute function public.set_updated_at();
create trigger set_match_events_updated_at before update on public.match_events for each row execute function public.set_updated_at();
create trigger set_trophies_updated_at before update on public.trophies for each row execute function public.set_updated_at();
create trigger set_save_settings_updated_at before update on public.save_settings for each row execute function public.set_updated_at();

alter table public.countries enable row level security;
alter table public.leagues enable row level security;
alter table public.clubs enable row level security;
alter table public.players enable row level security;
alter table public.external_ids enable row level security;
alter table public.game_versions enable row level security;
alter table public.player_game_snapshots enable row level security;
alter table public.save_seasons enable row level security;
alter table public.save_players enable row level security;
alter table public.player_snapshots enable row level security;
alter table public.transfers enable row level security;
alter table public.matches enable row level security;
alter table public.match_lineups enable row level security;
alter table public.match_events enable row level security;
alter table public.trophies enable row level security;
alter table public.save_settings enable row level security;
alter table public.career_audit_events enable row level security;
alter table public.reference_audit_events enable row level security;

create policy "Reference data is publicly readable" on public.countries for select to anon, authenticated using (true);
create policy "Reference data is publicly readable" on public.leagues for select to anon, authenticated using (true);
create policy "Reference data is publicly readable" on public.clubs for select to anon, authenticated using (true);
create policy "Reference data is publicly readable" on public.players for select to anon, authenticated using (true);
create policy "Reference data is publicly readable" on public.external_ids for select to anon, authenticated using (true);
create policy "Reference data is publicly readable" on public.game_versions for select to anon, authenticated using (true);
create policy "Reference data is publicly readable" on public.player_game_snapshots for select to anon, authenticated using (true);

create policy "Users can read their own seasons" on public.save_seasons for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own seasons" on public.save_seasons for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own seasons" on public.save_seasons for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own seasons" on public.save_seasons for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own save players" on public.save_players for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own save players" on public.save_players for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own save players" on public.save_players for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own save players" on public.save_players for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own player snapshots" on public.player_snapshots for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own player snapshots" on public.player_snapshots for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own player snapshots" on public.player_snapshots for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own player snapshots" on public.player_snapshots for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own transfers" on public.transfers for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own transfers" on public.transfers for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own transfers" on public.transfers for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own transfers" on public.transfers for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own matches" on public.matches for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own matches" on public.matches for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own matches" on public.matches for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own matches" on public.matches for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own match lineups" on public.match_lineups for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own match lineups" on public.match_lineups for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own match lineups" on public.match_lineups for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own match lineups" on public.match_lineups for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own match events" on public.match_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own match events" on public.match_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own match events" on public.match_events for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own match events" on public.match_events for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own trophies" on public.trophies for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own trophies" on public.trophies for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own trophies" on public.trophies for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own trophies" on public.trophies for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own save settings" on public.save_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own save settings" on public.save_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own save settings" on public.save_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own save settings" on public.save_settings for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own career audit events" on public.career_audit_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own career audit events" on public.career_audit_events for insert to authenticated with check ((select auth.uid()) = user_id and (select auth.uid()) = actor_user_id);

grant usage on schema public to anon, authenticated;
grant select on public.countries to anon, authenticated;
grant select on public.leagues to anon, authenticated;
grant select on public.clubs to anon, authenticated;
grant select on public.players to anon, authenticated;
grant select on public.external_ids to anon, authenticated;
grant select on public.game_versions to anon, authenticated;
grant select on public.player_game_snapshots to anon, authenticated;

grant select, insert, update, delete on public.save_seasons to authenticated;
grant select, insert, update, delete on public.save_players to authenticated;
grant select, insert, update, delete on public.player_snapshots to authenticated;
grant select, insert, update, delete on public.transfers to authenticated;
grant select, insert, update, delete on public.matches to authenticated;
grant select, insert, update, delete on public.match_lineups to authenticated;
grant select, insert, update, delete on public.match_events to authenticated;
grant select, insert, update, delete on public.trophies to authenticated;
grant select, insert, update, delete on public.save_settings to authenticated;
grant select, insert on public.career_audit_events to authenticated;
