import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("uses Next.js scripts and pinned Supabase dependencies", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );

  assert.equal(packageJson.scripts.dev, "next dev");
  assert.equal(packageJson.scripts.build, "next build");
  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
  assert.equal(packageJson.dependencies.next, "16.2.6");
  assert.match(packageJson.dependencies["@supabase/supabase-js"], /^\d+\.\d+\.\d+$/);
  assert.match(packageJson.dependencies["@supabase/ssr"], /^\d+\.\d+\.\d+$/);
  assert.equal(packageJson.devDependencies.supabase, "2.114.0");
});

test("documents required environment variables", async () => {
  const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");

  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_URL=/);
  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=/);
  assert.match(envExample, /SUPABASE_SERVICE_ROLE_KEY=/);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
});

test("creates Supabase migration workflow with RLS and explicit grants", async () => {
  await access(new URL("../supabase/config.toml", import.meta.url));

  const migration = await readFile(
    new URL("../supabase/migrations/20260817111500_initial_career_console.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /create table public\.career_saves/);
  assert.match(migration, /alter table public\.career_saves enable row level security/);
  assert.match(migration, /to authenticated\s+using \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(migration, /grant select, insert, update, delete on public\.career_saves to authenticated/);
  assert.doesNotMatch(migration, /service_role/i);
});

test("keeps app foundation files in place", async () => {
  const [layout, page, healthRoute, serverClient, browserClient, designTokens] =
    await Promise.all([
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/api/health/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../lib/supabase/server.ts", import.meta.url), "utf8"),
      readFile(new URL("../lib/supabase/browser.ts", import.meta.url), "utf8"),
      readFile(new URL("../lib/design-tokens.ts", import.meta.url), "utf8"),
    ]);

  assert.match(layout, /FC26 Career Console/);
  assert.match(page, /Manual career-mode tracking for FC26 console saves\./);
  assert.match(healthRoute, /NextResponse\.json/);
  assert.match(serverClient, /createServerClient/);
  assert.match(browserClient, /createBrowserClient/);
  assert.match(designTokens, /appShell/);
});
