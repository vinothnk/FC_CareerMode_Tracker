import path from "node:path";
import { parseArgs } from "./utils.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const version = args.version ?? `${args.game ?? "fc26"}-${new Date().toISOString().slice(0, 10)}`;
  const outDir = args.outDir ?? path.join("data", "sofifa", "staging", version);

  console.log("Controlled refresh process:");
  console.log(`1. Scrape: node scripts/sofifa/scrape.mjs --version ${version} --out-dir ${outDir}`);
  console.log(`2. Transform: node scripts/sofifa/transform.mjs --in ${path.join(outDir, "raw.json")}`);
  console.log(`3. Validate: node scripts/sofifa/validate.mjs --in ${path.join(outDir, "clean.json")}`);
  if (args.base) {
    console.log(`4. Diff: node scripts/sofifa/diff.mjs --base ${args.base} --next ${path.join(outDir, "clean.json")}`);
    console.log(`5. Load after review: node scripts/sofifa/load.mjs --in ${path.join(outDir, "clean.json")}`);
  } else {
    console.log(`4. Load after review: node scripts/sofifa/load.mjs --in ${path.join(outDir, "clean.json")}`);
  }
  console.log("Review validation and diff files before loading. Every version label creates or reuses one game_version snapshot.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
