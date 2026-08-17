alter table public.save_players
  add column if not exists role text;

update public.save_players
set status = 'first_team'
where status = 'active';

alter table public.save_players
  drop constraint if exists save_players_status_check;

alter table public.save_players
  add constraint save_players_status_check
  check (status in ('first_team', 'reserve', 'youth_academy', 'loaned', 'sold', 'released'));

create index if not exists save_players_status_idx on public.save_players(status);
create index if not exists save_players_primary_position_idx on public.save_players(primary_position);
