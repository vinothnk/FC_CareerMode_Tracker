import path from "node:path";
import { MVP_FIELDS } from "./fields.mjs";
import { fetchHtml, parseArgs, parseMoney, slug, text, writeJson } from "./utils.mjs";

function extractRows(html) {
  return [...html.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map((match) => match[0]);
}

function extractPlayer(row) {
  const playerMatch = row.match(/href="\/player\/(\d+)\/([^"/]+)[^"]*"/i);
  if (!playerMatch) {
    return null;
  }

  const linkTextMatches = [...row.matchAll(/<a\b[^>]*href="\/player\/\d+\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)].map((match) =>
    text(match[1]),
  );
  const name = linkTextMatches.find(Boolean);
  const ratingMatches = [...row.matchAll(/<td\b[^>]*class="[^"]*\bcol-(oa|pt)\b[^"]*"[^>]*>([\s\S]*?)<\/td>/gi)];
  const ageMatch = row.match(/<td\b[^>]*class="[^"]*\bcol-ae\b[^"]*"[^>]*>([\s\S]*?)<\/td>/i);
  const valueMatch = row.match(/<td\b[^>]*class="[^"]*\bcol-vl\b[^"]*"[^>]*>([\s\S]*?)<\/td>/i);
  const wageMatch = row.match(/<td\b[^>]*class="[^"]*\bcol-wg\b[^"]*"[^>]*>([\s\S]*?)<\/td>/i);
  const positions = [...row.matchAll(/<span\b[^>]*class="[^"]*\bpos\b[^"]*"[^>]*>([\s\S]*?)<\/span>/gi)]
    .map((match) => text(match[1]))
    .filter(Boolean);
  const clubMatch = row.match(/href="\/team\/(\d+)\/[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
  const leagueMatch = row.match(/href="\/league\/(\d+)\/[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
  const nationTitle = row.match(/<img\b[^>]*(?:title|alt)="([^"]+)"[^>]*>/i);
  const value = parseMoney(valueMatch?.[1]);
  const wage = parseMoney(wageMatch?.[1]);

  return {
    sofifaId: playerMatch[1],
    sourcePath: `/player/${playerMatch[1]}/${playerMatch[2]}`,
    fullName: name,
    knownAs: name,
    age: ageMatch ? Number(text(ageMatch[1])) : null,
    nationalitySofifaId: nationTitle ? `nation:${slug(nationTitle[1])}` : null,
    nationalityName: nationTitle ? text(nationTitle[1]) : null,
    clubSofifaId: clubMatch?.[1] ?? null,
    clubName: clubMatch ? text(clubMatch[2]) : null,
    leagueSofifaId: leagueMatch?.[1] ?? null,
    leagueName: leagueMatch ? text(leagueMatch[2]) : null,
    primaryPosition: positions[0] ?? null,
    positions,
    overall: Number(text(ratingMatches.find((match) => match[1] === "oa")?.[2])),
    potential: Number(text(ratingMatches.find((match) => match[1] === "pt")?.[2])),
    valueAmount: value.amount,
    wageAmount: wage.amount,
    currency: value.currency ?? wage.currency ?? "EUR",
  };
}

function deriveEntities(players) {
  const nations = new Map();
  const leagues = new Map();
  const clubs = new Map();

  for (const player of players) {
    if (player.nationalitySofifaId && player.nationalityName) {
      nations.set(player.nationalitySofifaId, {
        sofifaId: player.nationalitySofifaId,
        name: player.nationalityName,
      });
    }

    if (player.leagueSofifaId && player.leagueName) {
      leagues.set(player.leagueSofifaId, {
        sofifaId: player.leagueSofifaId,
        name: player.leagueName,
        shortName: player.leagueName,
        countrySofifaId: null,
        gender: "men",
      });
    }

    if (player.clubSofifaId && player.clubName) {
      clubs.set(player.clubSofifaId, {
        sofifaId: player.clubSofifaId,
        name: player.clubName,
        shortName: player.clubName,
        leagueSofifaId: player.leagueSofifaId,
        countrySofifaId: null,
      });
    }
  }

  return {
    nations: [...nations.values()],
    leagues: [...leagues.values()],
    clubs: [...clubs.values()],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const gameCode = args.gameCode ?? args.game ?? "fc26";
  const versionLabel = args.versionLabel ?? args.version ?? `${gameCode}-${new Date().toISOString().slice(0, 10)}`;
  const pages = Number(args.pages ?? 1);
  const baseUrl = args.url ?? "https://sofifa.com/players?type=all";
  const outDir = args.outDir ?? path.join("data", "sofifa", "staging", versionLabel);
  const players = [];
  const pagesFetched = [];

  for (let page = 0; page < pages; page += 1) {
    const url = new URL(baseUrl);
    url.searchParams.set("offset", String(page * 60));
    const html = await fetchHtml(url.toString());
    pagesFetched.push(url.toString());
    players.push(...extractRows(html).map(extractPlayer).filter(Boolean));
  }

  const entities = deriveEntities(players);
  const raw = {
    meta: {
      provider: "sofifa",
      gameCode,
      title: args.title ?? gameCode.toUpperCase(),
      platform: args.platform ?? "web",
      versionLabel,
      rosterDate: args.rosterDate ?? null,
      sourceUrl: baseUrl,
      pagesFetched,
      capturedAt: new Date().toISOString(),
      mvpFields: MVP_FIELDS,
    },
    raw: {
      players,
      ...entities,
    },
  };

  await writeJson(path.join(outDir, "raw.json"), raw);
  console.log(`Wrote ${players.length} raw players to ${path.join(outDir, "raw.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
