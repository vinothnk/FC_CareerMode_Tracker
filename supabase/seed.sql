insert into public.career_saves (
  id,
  user_id,
  name,
  club,
  manager_name,
  platform,
  season_label,
  difficulty,
  currency,
  transfer_budget,
  notes
) values (
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'Port Vale rebuild',
  'Port Vale',
  'A. Mensah',
  'console',
  '2026/27',
  'World Class',
  'USD',
  4800000,
  'Seed save for local product development.'
) on conflict (id) do nothing;

insert into public.squad_players (
  id,
  save_id,
  user_id,
  name,
  position,
  overall,
  potential,
  squad_role,
  value_amount,
  wage_amount,
  notes
) values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'M. Cooper',
    'GK',
    70,
    73,
    'starter',
    1400000,
    8500,
    '+1 since August'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'J. Grant',
    'CM',
    68,
    74,
    'rotation',
    950000,
    6200,
    'Contract ends 2027'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'L. Dyer',
    'ST',
    66,
    81,
    'prospect',
    1200000,
    4200,
    'Loan offers blocked'
  )
on conflict (id) do nothing;

insert into public.countries (
  id,
  iso2,
  iso3,
  name,
  region
) values
  (
    '40000000-0000-4000-8000-000000000001',
    'GB',
    'GBR',
    'United Kingdom',
    'Europe'
  )
on conflict (id) do nothing;

insert into public.leagues (
  id,
  country_id,
  name,
  short_name,
  level
) values
  (
    '41000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'EFL League Two',
    'League Two',
    4
  )
on conflict (id) do nothing;

insert into public.clubs (
  id,
  country_id,
  league_id,
  name,
  short_name,
  city,
  founded_year,
  stadium_name
) values
  (
    '42000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    'Port Vale',
    'Port Vale',
    'Stoke-on-Trent',
    1876,
    'Vale Park'
  ),
  (
    '42000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    'Walsall',
    'Walsall',
    'Walsall',
    1888,
    'Bescot Stadium'
  )
on conflict (id) do nothing;

insert into public.game_versions (
  id,
  game_code,
  platform,
  title,
  version_label,
  roster_date,
  release_date,
  is_default
) values
  (
    '43000000-0000-4000-8000-000000000001',
    'fc26',
    'console',
    'FC26',
    'launch-roster',
    '2026-09-25',
    '2026-09-25',
    true
  )
on conflict (id) do nothing;

insert into public.players (
  id,
  country_id,
  full_name,
  known_as,
  date_of_birth,
  primary_position,
  preferred_foot,
  height_cm
) values
  (
    '44000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'M. Cooper',
    'M. Cooper',
    '2001-10-08',
    'GK',
    'right',
    186
  ),
  (
    '44000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000001',
    'J. Grant',
    'J. Grant',
    '1999-04-14',
    'CM',
    'right',
    180
  ),
  (
    '44000000-0000-4000-8000-000000000003',
    '40000000-0000-4000-8000-000000000001',
    'L. Dyer',
    'L. Dyer',
    '2007-01-22',
    'ST',
    'left',
    182
  )
on conflict (id) do nothing;

insert into public.player_game_snapshots (
  id,
  player_id,
  game_version_id,
  club_id,
  overall,
  potential,
  age,
  value_amount,
  wage_amount,
  currency,
  positions,
  attributes
) values
  (
    '45000000-0000-4000-8000-000000000001',
    '44000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    70,
    73,
    25,
    1400000,
    8500,
    'USD',
    array['GK'],
    '{"diving": 72, "handling": 69}'::jsonb
  ),
  (
    '45000000-0000-4000-8000-000000000002',
    '44000000-0000-4000-8000-000000000002',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    68,
    74,
    27,
    950000,
    6200,
    'USD',
    array['CM', 'CDM'],
    '{"passing": 70, "stamina": 76}'::jsonb
  ),
  (
    '45000000-0000-4000-8000-000000000003',
    '44000000-0000-4000-8000-000000000003',
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    66,
    81,
    19,
    1200000,
    4200,
    'USD',
    array['ST', 'CF'],
    '{"finishing": 68, "pace": 78}'::jsonb
  )
on conflict (id) do nothing;

insert into public.external_ids (
  id,
  provider,
  external_key,
  club_id
) values
  (
    '46000000-0000-4000-8000-000000000001',
    'seed',
    'club:port-vale',
    '42000000-0000-4000-8000-000000000001'
  ),
  (
    '46000000-0000-4000-8000-000000000002',
    'seed',
    'club:walsall',
    '42000000-0000-4000-8000-000000000002'
  )
on conflict (id) do nothing;

update public.career_saves
set
  reference_club_id = '42000000-0000-4000-8000-000000000001',
  game_version_id = '43000000-0000-4000-8000-000000000001',
  status = 'active',
  started_on = '2026-08-17'
where id = '10000000-0000-4000-8000-000000000001';

insert into public.save_seasons (
  id,
  save_id,
  user_id,
  season_number,
  label,
  starts_on,
  ends_on,
  transfer_budget,
  wage_budget,
  board_expectations
) values (
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  1,
  '2026/27',
  '2026-07-01',
  '2027-06-30',
  4800000,
  125000,
  '{"league_finish": "mid_table", "youth_development": "sign_two_prospects"}'::jsonb
) on conflict (id) do nothing;

insert into public.save_players (
  id,
  save_id,
  user_id,
  reference_player_id,
  current_club_id,
  display_name,
  primary_position,
  squad_number,
  status,
  joined_on
) values
  (
    '51000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '44000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    'M. Cooper',
    'GK',
    1,
    'active',
    '2026-07-01'
  ),
  (
    '51000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '44000000-0000-4000-8000-000000000002',
    '42000000-0000-4000-8000-000000000001',
    'J. Grant',
    'CM',
    8,
    'active',
    '2026-07-01'
  ),
  (
    '51000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '44000000-0000-4000-8000-000000000003',
    '42000000-0000-4000-8000-000000000001',
    'L. Dyer',
    'ST',
    19,
    'active',
    '2026-07-01'
  )
on conflict (id) do nothing;

insert into public.player_snapshots (
  id,
  save_player_id,
  save_id,
  user_id,
  season_id,
  snapshot_date,
  overall,
  potential,
  age,
  morale,
  form,
  value_amount,
  wage_amount,
  contract_end_year,
  notes
) values
  (
    '52000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '2026-08-17',
    70,
    73,
    25,
    'content',
    'steady',
    1400000,
    8500,
    2028,
    '+1 since August'
  ),
  (
    '52000000-0000-4000-8000-000000000002',
    '51000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '2026-08-17',
    68,
    74,
    27,
    'happy',
    'good',
    950000,
    6200,
    2027,
    'Contract ends 2027'
  )
on conflict (id) do nothing;

insert into public.matches (
  id,
  save_id,
  user_id,
  season_id,
  competition,
  match_round,
  match_date,
  home_club_id,
  away_club_id,
  home_club_name,
  away_club_name,
  venue,
  result,
  goals_for,
  goals_against,
  notes
) values (
  '53000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  'EFL League Two',
  'Matchday 13',
  '2026-10-18',
  '42000000-0000-4000-8000-000000000001',
  '42000000-0000-4000-8000-000000000002',
  'Port Vale',
  'Walsall',
  'home',
  'win',
  2,
  1,
  'Late winner after switching to a narrow midfield.'
) on conflict (id) do nothing;

insert into public.match_lineups (
  id,
  match_id,
  save_id,
  user_id,
  save_player_id,
  player_name,
  team_side,
  position,
  shirt_number,
  is_starter,
  minutes_played,
  rating
) values
  (
    '54000000-0000-4000-8000-000000000001',
    '53000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    'M. Cooper',
    'user',
    'GK',
    1,
    true,
    90,
    7.1
  ),
  (
    '54000000-0000-4000-8000-000000000002',
    '53000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000003',
    'L. Dyer',
    'user',
    'ST',
    19,
    true,
    84,
    8.2
  )
on conflict (id) do nothing;

insert into public.match_events (
  id,
  match_id,
  save_id,
  user_id,
  save_player_id,
  event_type,
  team_side,
  minute,
  period,
  event_payload,
  notes
) values (
  '55000000-0000-4000-8000-000000000001',
  '53000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '51000000-0000-4000-8000-000000000003',
  'goal',
  'user',
  88,
  'regular',
  '{"score_after": "2-1"}'::jsonb,
  'Late winner.'
) on conflict (id) do nothing;

insert into public.transfers (
  id,
  save_id,
  user_id,
  season_id,
  save_player_id,
  reference_player_id,
  to_club_id,
  transfer_type,
  direction,
  status,
  transfer_date,
  fee_amount,
  wage_amount,
  currency,
  contract_years,
  notes
) values (
  '56000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  '51000000-0000-4000-8000-000000000003',
  '44000000-0000-4000-8000-000000000003',
  '42000000-0000-4000-8000-000000000001',
  'permanent',
  'in',
  'completed',
  '2026-08-01',
  1200000,
  4200,
  'USD',
  4,
  'Prospect signed before the first league match.'
) on conflict (id) do nothing;

insert into public.trophies (
  id,
  save_id,
  user_id,
  season_id,
  competition,
  trophy_name,
  result,
  won_on,
  notes
) values (
  '57000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  'Preseason',
  'Community Invitational',
  'winner',
  '2026-08-09',
  'Low-stakes confidence builder.'
) on conflict (id) do nothing;

insert into public.save_settings (
  id,
  save_id,
  user_id,
  setting_key,
  setting_value
) values
  (
    '58000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'currency',
    '"USD"'::jsonb
  ),
  (
    '58000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'difficulty',
    '"World Class"'::jsonb
  )
on conflict (id) do nothing;

insert into public.career_audit_events (
  id,
  save_id,
  user_id,
  actor_user_id,
  event_type,
  entity_table,
  entity_id,
  metadata
) values (
  '59000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'career_save.created',
  'career_saves',
  '10000000-0000-4000-8000-000000000001',
  '{"source": "seed"}'::jsonb
) on conflict (id) do nothing;

insert into public.fixtures (
  id,
  save_id,
  user_id,
  played_on,
  competition,
  opponent,
  venue,
  goals_for,
  goals_against,
  notes
) values
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '2026-10-18',
    'League Two',
    'Walsall',
    'home',
    2,
    1,
    'Late winner after switching to a narrow midfield.'
  )
on conflict (id) do nothing;
