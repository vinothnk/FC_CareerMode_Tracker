import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("seed data contains the initial FC26 career save", async () => {
  const seed = await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8");

  assert.match(seed, /Port Vale rebuild/);
  assert.match(seed, /M\. Cooper/);
  assert.match(seed, /Walsall/);
});
