import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import { parseArgs, readJson, sourceKey } from "./utils.mjs";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function makeAdminClient() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function querySingle(supabase, query, context) {
  const { data, error } = await query;
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }

  return data;
}

async function upsertExternalId(supabase, type, externalKey, entityColumn, entityId, externalUrl = null) {
  const { error } = await supabase.from("external_ids").upsert(
    {
      provider: "sofifa",
      external_key: sourceKey(type, externalKey),
      external_url: externalUrl,
      [entityColumn]: entityId,
    },
    { onConflict: "provider,external_key" },
  );

  if (error) {
    throw new Error(`external_ids ${type}:${externalKey}: ${error.message}`);
  }
}

async function findEntityIdByExternalId(supabase, type, externalKey, column) {
  if (!externalKey) {
    return null;
  }

  const row = await querySingle(
    supabase,
    supabase.from("external_ids").select(column).eq("provider", "sofifa").eq("external_key", sourceKey(type, externalKey)).maybeSingle(),
    `find ${type}:${externalKey}`,
  );

  return row?.[column] ?? null;
}

async function upsertRun(supabase, clean, filePath, status, extra = {}) {
  const meta = clean.meta;
  const row = await querySingle(
    supabase
      .schema("ingestion")
      .from("sofifa_import_runs")
      .upsert(
        {
          provider: "sofifa",
          game_code: meta.gameCode,
          platform: meta.platform,
          title: meta.title,
          version_label: meta.versionLabel,
          roster_date: meta.rosterDate,
          source_url: meta.sourceUrl,
          status,
          staging_path: filePath,
          ...extra,
        },
        { onConflict: "provider,game_code,platform,version_label" },
      )
      .select("id")
      .single(),
    "upsert import run",
  );

  return row.id;
}

async function loadRawStaging(supabase, runId, entities) {
  const tables = [
    ["sofifa_raw_nations", entities.nations ?? []],
    ["sofifa_raw_leagues", entities.leagues ?? []],
    ["sofifa_raw_clubs", entities.clubs ?? []],
    ["sofifa_raw_players", entities.players ?? []],
  ];

  for (const [table, values] of tables) {
    for (const value of values) {
      const { error } = await supabase
        .schema("ingestion")
        .from(table)
        .upsert({ run_id: runId, sofifa_id: value.sofifaId, payload: value }, { onConflict: "run_id,sofifa_id" });

      if (error) {
        throw new Error(`${table} ${value.sofifaId}: ${error.message}`);
      }
    }
  }
}

async function loadReferenceData(supabase, clean, runId) {
  const entities = clean.entities;
  const countryIds = new Map();
  const leagueIds = new Map();
  const clubIds = new Map();
  const playerIds = new Map();

  const gameVersion = await querySingle(
    supabase
      .from("game_versions")
      .upsert(
        {
          game_code: clean.meta.gameCode,
          platform: clean.meta.platform,
          title: clean.meta.title,
          version_label: clean.meta.versionLabel,
          roster_date: clean.meta.rosterDate,
          is_default: false,
        },
        { onConflict: "game_code,platform,version_label" },
      )
      .select("id")
      .single(),
    "upsert game version",
  );
  await upsertExternalId(supabase, "game_version", clean.meta.versionLabel, "game_version_id", gameVersion.id);

  for (const nation of entities.nations ?? []) {
    const existingCountryId = await findEntityIdByExternalId(supabase, "nation", nation.sofifaId, "country_id");
    const payload = {
      iso2: nation.iso2 ?? countryIds.size.toString(36).toUpperCase().padStart(2, "X").slice(-2),
      iso3: nation.iso3,
      name: nation.name,
    };
    const row = existingCountryId
      ? await querySingle(supabase.from("countries").update(payload).eq("id", existingCountryId).select("id").single(), `update nation ${nation.sofifaId}`)
      : await querySingle(supabase.from("countries").insert(payload).select("id").single(), `insert nation ${nation.sofifaId}`);
    countryIds.set(nation.sofifaId, row.id);
    await upsertExternalId(supabase, "nation", nation.sofifaId, "country_id", row.id);
  }

  for (const league of entities.leagues ?? []) {
    const existingLeagueId = await findEntityIdByExternalId(supabase, "league", league.sofifaId, "league_id");
    const payload = {
      country_id: countryIds.get(league.countrySofifaId) ?? null,
      name: league.name,
      short_name: league.shortName,
      level: league.level,
      gender: league.gender,
    };
    const row = existingLeagueId
      ? await querySingle(supabase.from("leagues").update(payload).eq("id", existingLeagueId).select("id").single(), `update league ${league.sofifaId}`)
      : await querySingle(supabase.from("leagues").insert(payload).select("id").single(), `insert league ${league.sofifaId}`);
    leagueIds.set(league.sofifaId, row.id);
    await upsertExternalId(supabase, "league", league.sofifaId, "league_id", row.id);
  }

  for (const club of entities.clubs ?? []) {
    const existingClubId = await findEntityIdByExternalId(supabase, "club", club.sofifaId, "club_id");
    const payload = {
      country_id: countryIds.get(club.countrySofifaId) ?? null,
      league_id: leagueIds.get(club.leagueSofifaId) ?? null,
      name: club.name,
      short_name: club.shortName,
      city: club.city,
      founded_year: club.foundedYear,
      stadium_name: club.stadiumName,
    };
    const row = existingClubId
      ? await querySingle(supabase.from("clubs").update(payload).eq("id", existingClubId).select("id").single(), `update club ${club.sofifaId}`)
      : await querySingle(supabase.from("clubs").insert(payload).select("id").single(), `insert club ${club.sofifaId}`);
    clubIds.set(club.sofifaId, row.id);
    await upsertExternalId(supabase, "club", club.sofifaId, "club_id", row.id);
  }

  for (const player of entities.players ?? []) {
    const existingPlayerId = await findEntityIdByExternalId(supabase, "player", player.sofifaId, "player_id");
    const payload = {
      country_id: countryIds.get(player.nationalitySofifaId) ?? null,
      full_name: player.fullName,
      known_as: player.knownAs,
      date_of_birth: player.dateOfBirth,
      primary_position: player.primaryPosition,
      preferred_foot: player.preferredFoot,
      height_cm: player.heightCm,
    };
    const row = existingPlayerId
      ? await querySingle(supabase.from("players").update(payload).eq("id", existingPlayerId).select("id").single(), `update player ${player.sofifaId}`)
      : await querySingle(supabase.from("players").insert(payload).select("id").single(), `insert player ${player.sofifaId}`);

    playerIds.set(player.sofifaId, row.id);
    await upsertExternalId(supabase, "player", player.sofifaId, "player_id", row.id, `https://sofifa.com/player/${player.sofifaId}`);

    const { error } = await supabase.from("player_game_snapshots").upsert(
      {
        player_id: row.id,
        game_version_id: gameVersion.id,
        club_id: clubIds.get(player.clubSofifaId) ?? null,
        overall: player.overall,
        potential: player.potential,
        age: player.age,
        value_amount: player.valueAmount,
        wage_amount: player.wageAmount,
        currency: player.currency,
        positions: player.positions,
        attributes: player.attributes,
        source_run_id: runId,
        source_payload: player.sourcePayload,
      },
      { onConflict: "player_id,game_version_id" },
    );

    if (error) {
      throw new Error(`snapshot ${player.sofifaId}: ${error.message}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inFile = args.in ?? args.input ?? path.join("data", "sofifa", "staging", args.version ?? "latest", "clean.json");
  const validationFile = args.validation ?? path.join(path.dirname(inFile), "validation.json");
  const clean = await readJson(inFile);
  const validation = await readJson(validationFile);

  if (validation.errors > 0 && !args.force) {
    throw new Error(`Validation has ${validation.errors} errors. Re-run with --force to load anyway.`);
  }

  const supabase = makeAdminClient();
  const runId = await upsertRun(supabase, clean, inFile, "validated", {
    raw_counts: validation.counts,
    validation_summary: validation,
  });

  await loadRawStaging(supabase, runId, clean.entities);
  await loadReferenceData(supabase, clean, runId);
  await upsertRun(supabase, clean, inFile, "loaded", {
    raw_counts: validation.counts,
    validation_summary: validation,
    completed_at: new Date().toISOString(),
  });

  console.log(`Loaded SoFIFA ${clean.meta.versionLabel} with run ${runId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
