alter table public.career_saves
  add column if not exists visibility text not null default 'private',
  add constraint career_saves_visibility_check check (visibility in ('private', 'public'));

create index if not exists career_saves_visibility_idx on public.career_saves(visibility);

drop policy if exists "Users can read their own saves" on public.career_saves;

create policy "Users can read public saves and their own saves"
  on public.career_saves
  for select
  to anon, authenticated
  using (
    visibility = 'public'
    or (select auth.uid()) = user_id
  );

grant select on public.career_saves to anon;
