import path from "node:path";
import { RATING_FIELDS, VALID_POSITIONS } from "./fields.mjs";
import { parseArgs, readJson, writeJson } from "./utils.mjs";

function findDuplicates(values, keyFn) {
  const counts = new Map();
  for (const value of values) {
    const key = keyFn(value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()].filter(([, count]) => count > 1).map(([key, count]) => ({ key, count }));
}

function pushIssue(issues, severity, entity, key, message) {
  issues.push({ severity, entity, key, message });
}

export function validateCleanData(clean) {
  const entities = clean.entities ?? {};
  const nations = entities.nations ?? [];
  const leagues = entities.leagues ?? [];
  const clubs = entities.clubs ?? [];
  const players = entities.players ?? [];
  const issues = [];

  for (const [entity, values] of Object.entries({ nations, leagues, clubs, players })) {
    for (const duplicate of findDuplicates(values, (value) => value.sofifaId)) {
      pushIssue(issues, "error", entity, duplicate.key, `Duplicate SoFIFA id appears ${duplicate.count} times.`);
    }
  }

  const nationIds = new Set(nations.map((nation) => nation.sofifaId));
  const leagueIds = new Set(leagues.map((league) => league.sofifaId));
  const clubIds = new Set(clubs.map((club) => club.sofifaId));

  for (const nation of nations) {
    if (!nation.name) {
      pushIssue(issues, "error", "nation", nation.sofifaId, "Nation is missing name.");
    }

    if (!nation.iso2) {
      pushIssue(issues, "warning", "nation", nation.sofifaId, "Nation is missing ISO2; loader will assign a private placeholder code.");
    }
  }

  for (const league of leagues) {
    if (!league.name) {
      pushIssue(issues, "error", "league", league.sofifaId, "League is missing name.");
    }

    if (league.countrySofifaId && !nationIds.has(league.countrySofifaId)) {
      pushIssue(issues, "warning", "league", league.sofifaId, `Missing country ${league.countrySofifaId}.`);
    }
  }

  for (const club of clubs) {
    if (!club.name) {
      pushIssue(issues, "error", "club", club.sofifaId, "Club is missing name.");
    }

    if (club.leagueSofifaId && !leagueIds.has(club.leagueSofifaId)) {
      pushIssue(issues, "warning", "club", club.sofifaId, `Missing league ${club.leagueSofifaId}.`);
    }

    if (club.countrySofifaId && !nationIds.has(club.countrySofifaId)) {
      pushIssue(issues, "warning", "club", club.sofifaId, `Missing country ${club.countrySofifaId}.`);
    }
  }

  for (const player of players) {
    if (!player.sofifaId) {
      pushIssue(issues, "error", "player", player.fullName, "Player is missing SoFIFA id.");
    }

    if (!player.fullName) {
      pushIssue(issues, "error", "player", player.sofifaId, "Player is missing full name.");
    }

    if (!player.primaryPosition || !VALID_POSITIONS.has(player.primaryPosition)) {
      pushIssue(issues, "error", "player", player.sofifaId, `Invalid primary position ${player.primaryPosition ?? "<missing>"}.`);
    }

    for (const position of player.positions ?? []) {
      if (!VALID_POSITIONS.has(position)) {
        pushIssue(issues, "error", "player", player.sofifaId, `Invalid position ${position}.`);
      }
    }

    for (const field of RATING_FIELDS) {
      const value = field in player ? player[field] : player.attributes?.[field];
      if (value === undefined || value === null) {
        continue;
      }

      if (!Number.isInteger(value) || value < 1 || value > 99) {
        pushIssue(issues, "error", "player", player.sofifaId, `${field} must be an integer from 1 to 99.`);
      }
    }

    if (player.overall === null || player.potential === null) {
      pushIssue(issues, "error", "player", player.sofifaId, "Player is missing overall or potential.");
    }

    if (player.clubSofifaId && !clubIds.has(player.clubSofifaId)) {
      pushIssue(issues, "warning", "player", player.sofifaId, `Missing club ${player.clubSofifaId}.`);
    }

    if (player.nationalitySofifaId && !nationIds.has(player.nationalitySofifaId)) {
      pushIssue(issues, "warning", "player", player.sofifaId, `Missing nation ${player.nationalitySofifaId}.`);
    }
  }

  const summary = {
    counts: {
      nations: nations.length,
      leagues: leagues.length,
      clubs: clubs.length,
      players: players.length,
    },
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length,
    issues,
  };

  return summary;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inFile = args.in ?? args.input ?? path.join("data", "sofifa", "staging", args.version ?? "latest", "clean.json");
  const outFile = args.out ?? args.output ?? path.join(path.dirname(inFile), "validation.json");
  const clean = await readJson(inFile);
  const summary = validateCleanData(clean);

  await writeJson(outFile, summary);
  console.log(`Validation finished with ${summary.errors} errors and ${summary.warnings} warnings.`);

  if (summary.errors > 0) {
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
