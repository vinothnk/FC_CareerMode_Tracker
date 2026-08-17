create or replace function public.create_career_save_with_initial_data(
  p_name text,
  p_club_name text,
  p_manager_name text,
  p_season_label text,
  p_platform text,
  p_difficulty text,
  p_currency text,
  p_transfer_budget numeric,
  p_wage_budget numeric,
  p_visibility text,
  p_game_version_id uuid,
  p_reference_club_id uuid,
  p_house_rules text,
  p_board_expectations jsonb,
  p_import_reference_squad boolean,
  p_manual_players jsonb
)
returns table (
  save_id uuid,
  season_id uuid,
  imported_players integer
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_save_id uuid;
  v_season_id uuid;
  v_game_version_id uuid;
  v_reference_club_id uuid := p_reference_club_id;
  v_club_name text := nullif(trim(p_club_name), '');
  v_imported_players integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication is required to create a career save.';
  end if;

  if nullif(trim(p_name), '') is null
    or nullif(trim(p_manager_name), '') is null
    or nullif(trim(p_season_label), '') is null then
    raise exception 'Save name, manager, and season are required.';
  end if;

  select id
  into v_game_version_id
  from public.game_versions
  where id = p_game_version_id;

  if v_game_version_id is null then
    select id
    into v_game_version_id
    from public.game_versions
    where game_code = 'fc26'
      and platform = 'console'
    order by is_default desc, roster_date desc nulls last, created_at desc
    limit 1;
  end if;

  if v_reference_club_id is not null then
    select name
    into v_club_name
    from public.clubs
    where id = v_reference_club_id;

    if v_club_name is null then
      raise exception 'Selected reference club was not found.';
    end if;
  end if;

  if v_club_name is null then
    raise exception 'Starting club is required when no reference club is selected.';
  end if;

  insert into public.career_saves (
    user_id,
    name,
    club,
    manager_name,
    platform,
    season_label,
    difficulty,
    currency,
    transfer_budget,
    visibility,
    reference_club_id,
    game_version_id,
    status,
    started_on
  ) values (
    v_user_id,
    trim(p_name),
    v_club_name,
    trim(p_manager_name),
    coalesce(nullif(trim(p_platform), ''), 'console'),
    trim(p_season_label),
    nullif(trim(p_difficulty), ''),
    upper(coalesce(nullif(trim(p_currency), ''), 'USD')),
    greatest(coalesce(p_transfer_budget, 0), 0),
    case when p_visibility = 'public' then 'public' else 'private' end,
    v_reference_club_id,
    v_game_version_id,
    'active',
    current_date
  )
  returning id into v_save_id;

  insert into public.save_seasons (
    save_id,
    user_id,
    season_number,
    label,
    starts_on,
    transfer_budget,
    wage_budget,
    board_expectations
  ) values (
    v_save_id,
    v_user_id,
    1,
    trim(p_season_label),
    current_date,
    greatest(coalesce(p_transfer_budget, 0), 0),
    greatest(coalesce(p_wage_budget, 0), 0),
    coalesce(p_board_expectations, '{}'::jsonb)
  )
  returning id into v_season_id;

  insert into public.save_settings (save_id, user_id, setting_key, setting_value)
  values
    (v_save_id, v_user_id, 'currency', to_jsonb(upper(coalesce(nullif(trim(p_currency), ''), 'USD')))),
    (v_save_id, v_user_id, 'difficulty', to_jsonb(nullif(trim(p_difficulty), ''))),
    (v_save_id, v_user_id, 'house_rules', to_jsonb(coalesce(nullif(trim(p_house_rules), ''), ''))),
    (
      v_save_id,
      v_user_id,
      'creation_flow',
      jsonb_build_object(
        'source', case when v_reference_club_id is null then 'manual' else 'reference' end,
        'import_reference_squad', coalesce(p_import_reference_squad, false),
        'created_season_number', 1
      )
    );

  if v_reference_club_id is not null and coalesce(p_import_reference_squad, true) then
    with source_players as (
      select
        p.id as player_id,
        p.full_name,
        coalesce(p.primary_position, pgs.positions[1], 'UNK') as primary_position,
        pgs.overall,
        pgs.potential,
        pgs.age,
        pgs.value_amount,
        pgs.wage_amount,
        row_number() over (order by pgs.overall desc, p.full_name) as squad_number
      from public.player_game_snapshots pgs
      join public.players p on p.id = pgs.player_id
      where pgs.game_version_id = v_game_version_id
        and pgs.club_id = v_reference_club_id
    ),
    inserted_players as (
      insert into public.save_players (
        save_id,
        user_id,
        reference_player_id,
        current_club_id,
        display_name,
        primary_position,
        squad_number,
        status,
        joined_on
      )
      select
        v_save_id,
        v_user_id,
        player_id,
        v_reference_club_id,
        full_name,
        primary_position,
        case when squad_number between 1 and 99 then squad_number::smallint else null end,
        'active',
        current_date
      from source_players
      returning id, reference_player_id
    )
    insert into public.player_snapshots (
      save_player_id,
      save_id,
      user_id,
      season_id,
      snapshot_date,
      overall,
      potential,
      age,
      value_amount,
      wage_amount,
      notes
    )
    select
      inserted_players.id,
      v_save_id,
      v_user_id,
      v_season_id,
      current_date,
      source_players.overall,
      source_players.potential,
      source_players.age,
      source_players.value_amount,
      source_players.wage_amount,
      'Imported from selected FC reference database.'
    from inserted_players
    join source_players on source_players.player_id = inserted_players.reference_player_id;

    get diagnostics v_imported_players = row_count;
  elsif jsonb_typeof(coalesce(p_manual_players, '[]'::jsonb)) = 'array' then
    with manual_players as (
      select
        nullif(trim(display_name), '') as display_name,
        coalesce(nullif(trim(primary_position), ''), 'UNK') as primary_position,
        overall,
        potential,
        age,
        value_amount,
        wage_amount,
        squad_number,
        nullif(trim(notes), '') as notes
      from jsonb_to_recordset(p_manual_players) as x(
        display_name text,
        primary_position text,
        overall integer,
        potential integer,
        age integer,
        value_amount numeric,
        wage_amount numeric,
        squad_number integer,
        notes text
      )
      where nullif(trim(display_name), '') is not null
        and overall between 1 and 99
    ),
    inserted_players as (
      insert into public.save_players (
        save_id,
        user_id,
        current_club_id,
        display_name,
        primary_position,
        squad_number,
        status,
        joined_on
      )
      select
        v_save_id,
        v_user_id,
        null,
        display_name,
        primary_position,
        case when squad_number between 1 and 99 then squad_number::smallint else null end,
        'active',
        current_date
      from manual_players
      returning id, display_name
    )
    insert into public.player_snapshots (
      save_player_id,
      save_id,
      user_id,
      season_id,
      snapshot_date,
      overall,
      potential,
      age,
      value_amount,
      wage_amount,
      notes
    )
    select
      inserted_players.id,
      v_save_id,
      v_user_id,
      v_season_id,
      current_date,
      manual_players.overall,
      manual_players.potential,
      manual_players.age,
      manual_players.value_amount,
      manual_players.wage_amount,
      manual_players.notes
    from inserted_players
    join manual_players on manual_players.display_name = inserted_players.display_name;

    get diagnostics v_imported_players = row_count;
  end if;

  insert into public.career_audit_events (
    save_id,
    user_id,
    actor_user_id,
    event_type,
    entity_table,
    entity_id,
    metadata
  ) values (
    v_save_id,
    v_user_id,
    v_user_id,
    'career_save.created',
    'career_saves',
    v_save_id,
    jsonb_build_object(
      'season_id', v_season_id,
      'reference_club_id', v_reference_club_id,
      'game_version_id', v_game_version_id,
      'players_created', v_imported_players
    )
  );

  return query select v_save_id, v_season_id, v_imported_players;
end;
$$;

revoke all on function public.create_career_save_with_initial_data(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  text,
  uuid,
  uuid,
  text,
  jsonb,
  boolean,
  jsonb
) from public;

grant execute on function public.create_career_save_with_initial_data(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  text,
  uuid,
  uuid,
  text,
  jsonb,
  boolean,
  jsonb
) to authenticated;
