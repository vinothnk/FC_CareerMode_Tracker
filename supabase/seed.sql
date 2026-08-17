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
