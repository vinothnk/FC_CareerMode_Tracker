import path from "node:path";
import { parseArgs, readJson, writeJson } from "./utils.mjs";

function indexById(values) {
  return new Map(values.map((value) => [value.sofifaId, value]));
}

function diffCollection(baseValues, nextValues, watchedFields) {
  const base = indexById(baseValues);
  const next = indexById(nextValues);
  const added = [];
  const removed = [];
  const changed = [];

  for (const [id, value] of next.entries()) {
    if (!base.has(id)) {
      added.push(id);
      continue;
    }

    const before = base.get(id);
    const fieldChanges = {};
    for (const field of watchedFields) {
      if (JSON.stringify(before[field] ?? null) !== JSON.stringify(value[field] ?? null)) {
        fieldChanges[field] = { before: before[field] ?? null, after: value[field] ?? null };
      }
    }

    if (Object.keys(fieldChanges).length > 0) {
      changed.push({ sofifaId: id, fields: fieldChanges });
    }
  }

  for (const id of base.keys()) {
    if (!next.has(id)) {
      removed.push(id);
    }
  }

  return { added, removed, changed };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.base || !args.next) {
    throw new Error("Usage: node scripts/sofifa/diff.mjs --base <clean.json> --next <clean.json> [--out diff.json]");
  }

  const base = await readJson(args.base);
  const next = await readJson(args.next);
  const diff = {
    provider: "sofifa",
    baseVersionLabel: base.meta?.versionLabel,
    nextVersionLabel: next.meta?.versionLabel,
    generatedAt: new Date().toISOString(),
    entities: {
      nations: diffCollection(base.entities?.nations ?? [], next.entities?.nations ?? [], ["name", "iso2", "iso3"]),
      leagues: diffCollection(base.entities?.leagues ?? [], next.entities?.leagues ?? [], ["name", "shortName", "countrySofifaId", "level", "gender"]),
      clubs: diffCollection(base.entities?.clubs ?? [], next.entities?.clubs ?? [], ["name", "shortName", "countrySofifaId", "leagueSofifaId"]),
      players: diffCollection(base.entities?.players ?? [], next.entities?.players ?? [], [
        "fullName",
        "knownAs",
        "age",
        "nationalitySofifaId",
        "clubSofifaId",
        "primaryPosition",
        "positions",
        "overall",
        "potential",
        "valueAmount",
        "wageAmount",
      ]),
    },
  };

  const summary = Object.fromEntries(
    Object.entries(diff.entities).map(([entity, value]) => [
      entity,
      {
        added: value.added.length,
        removed: value.removed.length,
        changed: value.changed.length,
      },
    ]),
  );
  diff.summary = summary;

  const outFile = args.out ?? path.join(path.dirname(args.next), "diff.json");
  await writeJson(outFile, diff);
  console.log(`Wrote diff to ${outFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
