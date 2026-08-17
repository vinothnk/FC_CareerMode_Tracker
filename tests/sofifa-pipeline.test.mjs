import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { validateCleanData } from "../scripts/sofifa/validate.mjs";

test("SoFIFA transform normalizes MVP reference entities", async () => {
  const outputDir = await mkdtemp(path.join(tmpdir(), "sofifa-pipeline-"));
  const output = path.join(outputDir, "clean.json");
  const input = path.resolve("data/sofifa/staging/sample/raw.json");
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync(process.execPath, ["scripts/sofifa/transform.mjs", "--in", input, "--out", output], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);

  const clean = JSON.parse(await readFile(output, "utf8"));
  assert.equal(clean.meta.versionLabel, "sample");
  assert.equal(clean.entities.players[0].sofifaId, "239085");
  assert.deepEqual(clean.entities.players[0].positions, ["CAM", "CM"]);

  const validation = validateCleanData(clean);
  assert.equal(validation.errors, 0);
  assert.equal(validation.counts.players, 1);
});
