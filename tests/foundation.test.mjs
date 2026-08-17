import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("uses Next.js scripts with a local SQLite development runtime", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );

  assert.equal(packageJson.scripts.dev, "next dev");
  assert.equal(packageJson.scripts.build, "next build");
  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
  assert.equal(packageJson.dependencies.next, "16.2.6");
  assert.match(packageJson.dependencies["@supabase/supabase-js"], /^\d+\.\d+\.\d+$/);
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

test("adds normalized phase 2 career and reference schema", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/20260817113422_phase_2_database_architecture.sql", import.meta.url),
    "utf8",
  );

  for (const table of [
    "countries",
    "leagues",
    "clubs",
    "players",
    "external_ids",
    "game_versions",
    "player_game_snapshots",
    "save_seasons",
    "save_players",
    "player_snapshots",
    "transfers",
    "matches",
    "match_lineups",
    "match_events",
    "trophies",
    "save_settings",
    "career_audit_events",
    "reference_audit_events",
  ]) {
    assert.match(migration, new RegExp(`create table public\\.${table}`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }

  assert.match(migration, /Reference data is publicly readable/);
  assert.match(migration, /foreign key \(save_id, user_id\) references public\.career_saves\(id, user_id\)/);
  assert.match(migration, /grant select on public\.players to anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on public\.matches to authenticated/);
  assert.match(migration, /create table public\.career_audit_events/);
});

test("uses SQLite-backed auth routes and career save visibility controls for development", async () => {
  const [sqliteDb, sqliteAuth, proxy, loginPage, registerPage, dashboardPage, authActions, saveActions] =
    await Promise.all([
      readFile(new URL("../lib/sqlite/db.ts", import.meta.url), "utf8"),
      readFile(new URL("../lib/sqlite/auth.ts", import.meta.url), "utf8"),
      readFile(new URL("../proxy.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/login/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/register/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/dashboard/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/auth/actions.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/dashboard/actions/save-actions.ts", import.meta.url), "utf8"),
    ]);

  assert.match(sqliteDb, /from "node:sqlite"/);
  assert.match(sqliteDb, /create table if not exists users/);
  assert.match(sqliteDb, /create table if not exists sessions/);
  assert.match(sqliteDb, /visibility text not null default 'private'/);
  assert.match(sqliteAuth, /getCurrentUser/);
  assert.match(proxy, /export function proxy/);
  assert.match(proxy, /sessionCookieName/);
  assert.match(proxy, /matcher: \["\/dashboard\/:path\*", "\/login", "\/register"\]/);
  assert.match(loginPage, /action=\{login\}/);
  assert.match(registerPage, /action=\{register\}/);
  assert.match(dashboardPage, /createCareerSave/);
  assert.match(dashboardPage, /updateCareerSaveVisibility/);
  assert.match(authActions, /authenticateUser/);
  assert.match(authActions, /createUser/);
  assert.match(authActions, /deleteSession/);
  assert.match(saveActions, /createCareerSaveWithInitialData/);
  assert.match(saveActions, /updateCareerSaveVisibilityForUser/);
});

test("adds phase 4 SoFIFA reference data pipeline", async () => {
  const [migration, packageJson, pipelineReadme] = await Promise.all([
    readFile(
      new URL("../supabase/migrations/20260817123000_phase_4_sofifa_reference_pipeline.sql", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../scripts/sofifa/README.md", import.meta.url), "utf8"),
  ]);

  assert.match(migration, /create schema if not exists ingestion/);
  assert.match(migration, /create table if not exists ingestion\.sofifa_import_runs/);
  assert.match(migration, /create table if not exists ingestion\.sofifa_raw_players/);
  assert.match(migration, /create table if not exists ingestion\.sofifa_refresh_diffs/);
  assert.match(migration, /add column if not exists source_run_id uuid/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /grant usage on schema ingestion to service_role/);
  assert.match(packageJson, /"sofifa:load": "node scripts\/sofifa\/load\.mjs"/);
  assert.match(pipelineReadme, /MVP Fields/);
  assert.match(pipelineReadme, /Versioning/);
});

test("adds phase 5 career save creation flow", async () => {
  const [migration, dashboardPage, careerPage, saveActions] = await Promise.all([
    readFile(
      new URL("../supabase/migrations/20260817123554_phase_5_career_save_creation.sql", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/dashboard/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/[saveId]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/actions/save-actions.ts", import.meta.url), "utf8"),
  ]);

  assert.match(migration, /create or replace function public\.create_career_save_with_initial_data/);
  assert.match(migration, /insert into public\.save_seasons/);
  assert.match(migration, /insert into public\.save_settings/);
  assert.match(migration, /from public\.player_game_snapshots pgs/);
  assert.match(migration, /jsonb_to_recordset\(p_manual_players\)/);
  assert.match(migration, /grant execute on function public\.create_career_save_with_initial_data/);
  assert.match(dashboardPage, /FC database/);
  assert.match(dashboardPage, /Reference club/);
  assert.match(dashboardPage, /Manual squad starter/);
  assert.match(saveActions, /createCareerSaveWithInitialData/);
  assert.match(saveActions, /redirect\(`\/dashboard\/\$\{saveId\}`\)/);
  assert.match(careerPage, /Initial Squad/);
  assert.match(careerPage, /Season 1/);
});

test("keeps app foundation files in place", async () => {
  const [layout, page, healthRoute, sqliteDb, designTokens] =
    await Promise.all([
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/api/health/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../lib/sqlite/db.ts", import.meta.url), "utf8"),
      readFile(new URL("../lib/design-tokens.ts", import.meta.url), "utf8"),
    ]);

  assert.match(layout, /FC26 Career Console/);
  assert.match(page, /Manual career-mode tracking for FC26 console saves\./);
  assert.match(healthRoute, /NextResponse\.json/);
  assert.match(sqliteDb, /getDb/);
  assert.match(designTokens, /appShell/);
});
