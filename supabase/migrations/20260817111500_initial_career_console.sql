create extension if not exists pgcrypto;

create table public.career_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  club text not null,
  manager_name text not null,
  platform text not null default 'console',
  season_label text not null,
  difficulty text,
  currency text not null default 'USD',
  transfer_budget numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint career_saves_platform_check check (platform in ('console', 'pc')),
  constraint career_saves_budget_check check (transfer_budget >= 0)
);

create table public.squad_players (
  id uuid primary key default gen_random_uuid(),
  save_id uuid not null references public.career_saves(id) on delete cascade,
  user_id uuid not null,
  name text not null,
  position text not null,
  overall smallint not null,
  potential smallint,
  squad_role text not null default 'rotation',
  value_amount numeric(12, 2),
  wage_amount numeric(12, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint squad_players_overall_check check (overall between 1 and 99),
  constraint squad_players_potential_check check (potential is null or potential between 1 and 99)
);

create table public.fixtures (
  id uuid primary key default gen_random_uuid(),
  save_id uuid not null references public.career_saves(id) on delete cascade,
  user_id uuid not null,
  played_on date,
  competition text not null,
  opponent text not null,
  venue text not null,
  goals_for smallint not null default 0,
  goals_against smallint not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fixtures_venue_check check (venue in ('home', 'away', 'neutral')),
  constraint fixtures_goals_for_check check (goals_for >= 0),
  constraint fixtures_goals_against_check check (goals_against >= 0)
);

create index career_saves_user_id_idx on public.career_saves(user_id);
create index squad_players_save_id_idx on public.squad_players(save_id);
create index squad_players_user_id_idx on public.squad_players(user_id);
create index fixtures_save_id_idx on public.fixtures(save_id);
create index fixtures_user_id_idx on public.fixtures(user_id);

alter table public.career_saves enable row level security;
alter table public.squad_players enable row level security;
alter table public.fixtures enable row level security;

create policy "Users can read their own saves"
  on public.career_saves
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own saves"
  on public.career_saves
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own saves"
  on public.career_saves
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own saves"
  on public.career_saves
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own squad players"
  on public.squad_players
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own squad players"
  on public.squad_players
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own squad players"
  on public.squad_players
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own squad players"
  on public.squad_players
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own fixtures"
  on public.fixtures
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own fixtures"
  on public.fixtures
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own fixtures"
  on public.fixtures
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own fixtures"
  on public.fixtures
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.career_saves to authenticated;
grant select, insert, update, delete on public.squad_players to authenticated;
grant select, insert, update, delete on public.fixtures to authenticated;
