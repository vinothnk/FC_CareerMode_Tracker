import path from "node:path";
import { MVP_FIELDS, VALID_POSITIONS } from "./fields.mjs";
import {
  asArray,
  normalizeFoot,
  normalizeHeightCm,
  numberOrNull,
  parseArgs,
  parseMoney,
  readJson,
  sourceKey,
  text,
  uniqueBy,
  writeJson,
} from "./utils.mjs";

function normalizePositions(value) {
  return asArray(value)
    .flatMap((position) => text(position).split(/[,\s/]+/))
    .map((position) => position.toUpperCase())
    .filter((position) => VALID_POSITIONS.has(position));
}

function normalizeNation(raw) {
  const name = text(raw.name ?? raw.nationalityName);
  const id = text(raw.sofifaId) || sourceKey("nation", name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  return {
    sofifaId: id,
    name,
    iso2: text(raw.iso2).toUpperCase() || null,
    iso3: text(raw.iso3).toUpperCase() || null,
  };
}

function normalizeLeague(raw) {
  const name = text(raw.name ?? raw.leagueName);
  return {
    sofifaId: text(raw.sofifaId) || sourceKey("league", name.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
    name,
    shortName: text(raw.shortName) || name,
    countrySofifaId: text(raw.countrySofifaId) || null,
    level: numberOrNull(raw.level),
    gender: text(raw.gender) || "men",
  };
}

function normalizeClub(raw) {
  const name = text(raw.name ?? raw.clubName);
  return {
    sofifaId: text(raw.sofifaId) || sourceKey("club", name.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
    name,
    shortName: text(raw.shortName) || name,
    countrySofifaId: text(raw.countrySofifaId) || null,
    leagueSofifaId: text(raw.leagueSofifaId) || null,
    city: text(raw.city) || null,
    foundedYear: numberOrNull(raw.foundedYear),
    stadiumName: text(raw.stadiumName) || null,
  };
}

function normalizePlayer(raw) {
  const value = raw.valueAmount === undefined ? parseMoney(raw.value) : { amount: numberOrNull(raw.valueAmount), currency: raw.currency };
  const wage = raw.wageAmount === undefined ? parseMoney(raw.wage) : { amount: numberOrNull(raw.wageAmount), currency: raw.currency };
  const positions = normalizePositions(raw.positions ?? raw.position ?? raw.primaryPosition);
  const knownAs = text(raw.knownAs ?? raw.shortName ?? raw.fullName ?? raw.name);
  const fullName = text(raw.fullName ?? raw.name ?? knownAs);

  return {
    sofifaId: text(raw.sofifaId),
    fullName,
    knownAs,
    age: numberOrNull(raw.age),
    dateOfBirth: text(raw.dateOfBirth) || null,
    nationalitySofifaId: text(raw.nationalitySofifaId) || null,
    clubSofifaId: text(raw.clubSofifaId) || null,
    leagueSofifaId: text(raw.leagueSofifaId) || null,
    primaryPosition: text(raw.primaryPosition) || positions[0] || null,
    positions,
    overall: numberOrNull(raw.overall),
    potential: numberOrNull(raw.potential),
    preferredFoot: normalizeFoot(raw.preferredFoot),
    heightCm: normalizeHeightCm(raw.heightCm ?? raw.height),
    valueAmount: value.amount,
    wageAmount: wage.amount,
    currency: text(value.currency ?? wage.currency ?? raw.currency).toUpperCase() || "EUR",
    attributes: raw.attributes ?? {},
    sourcePayload: raw,
  };
}

function deriveMissingEntities(players, nations, leagues, clubs) {
  const nationIds = new Set(nations.map((nation) => nation.sofifaId));
  const leagueIds = new Set(leagues.map((league) => league.sofifaId));
  const clubIds = new Set(clubs.map((club) => club.sofifaId));

  for (const player of players) {
    if (player.nationalitySofifaId && !nationIds.has(player.nationalitySofifaId) && player.sourcePayload.nationalityName) {
      const nation = normalizeNation({
        sofifaId: player.nationalitySofifaId,
        name: player.sourcePayload.nationalityName,
      });
      nations.push(nation);
      nationIds.add(nation.sofifaId);
    }

    if (player.leagueSofifaId && !leagueIds.has(player.leagueSofifaId) && player.sourcePayload.leagueName) {
      const league = normalizeLeague({
        sofifaId: player.leagueSofifaId,
        name: player.sourcePayload.leagueName,
      });
      leagues.push(league);
      leagueIds.add(league.sofifaId);
    }

    if (player.clubSofifaId && !clubIds.has(player.clubSofifaId) && player.sourcePayload.clubName) {
      const club = normalizeClub({
        sofifaId: player.clubSofifaId,
        name: player.sourcePayload.clubName,
        leagueSofifaId: player.leagueSofifaId,
      });
      clubs.push(club);
      clubIds.add(club.sofifaId);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inFile = args.in ?? args.input ?? path.join("data", "sofifa", "staging", args.version ?? "latest", "raw.json");
  const outFile = args.out ?? args.output ?? path.join(path.dirname(inFile), "clean.json");
  const raw = await readJson(inFile);
  const source = raw.raw ?? raw;

  const nations = uniqueBy(asArray(source.nations).map(normalizeNation), (nation) => nation.sofifaId);
  const leagues = uniqueBy(asArray(source.leagues).map(normalizeLeague), (league) => league.sofifaId);
  const clubs = uniqueBy(asArray(source.clubs).map(normalizeClub), (club) => club.sofifaId);
  const players = uniqueBy(asArray(source.players).map(normalizePlayer), (player) => player.sofifaId);
  deriveMissingEntities(players, nations, leagues, clubs);

  const clean = {
    meta: {
      provider: "sofifa",
      gameCode: raw.meta?.gameCode ?? "fc26",
      title: raw.meta?.title ?? "FC26",
      platform: raw.meta?.platform ?? "web",
      versionLabel: raw.meta?.versionLabel ?? args.version ?? new Date().toISOString().slice(0, 10),
      rosterDate: raw.meta?.rosterDate ?? null,
      sourceUrl: raw.meta?.sourceUrl ?? null,
      capturedAt: raw.meta?.capturedAt ?? new Date().toISOString(),
      mvpFields: MVP_FIELDS,
    },
    entities: {
      nations,
      leagues,
      clubs,
      players,
    },
  };

  await writeJson(outFile, clean);
  console.log(`Wrote normalized data to ${outFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
