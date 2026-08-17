import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { sessionCookieName } from "@/lib/sqlite/constants";

const SESSION_DAYS = 30;

export { sessionCookieName };

export type LocalUser = {
  id: string;
  email: string;
  created_at: string;
};

export type CareerSave = {
  id: string;
  user_id: string;
  name: string;
  club: string;
  manager_name: string;
  season_label: string;
  difficulty: string | null;
  currency: string;
  transfer_budget: number;
  visibility: "private" | "public";
  updated_at: string;
};

export type GameVersion = {
  id: string;
  title: string;
  version_label: string;
  roster_date: string | null;
  is_default: boolean;
};

export type ReferenceClub = {
  id: string;
  name: string;
  city: string | null;
};

export type ManualPlayerInput = {
  display_name: string;
  primary_position: string;
  overall: number;
  potential: number | null;
  age: number | null;
  value_amount: number | null;
  wage_amount: number | null;
  squad_number: number | null;
  notes: string | null;
};

export type CreateCareerSaveInput = {
  userId: string;
  name: string;
  club: string;
  managerName: string;
  seasonLabel: string;
  platform: "console" | "pc";
  difficulty: string | null;
  currency: string;
  transferBudget: number;
  wageBudget: number;
  visibility: "private" | "public";
  gameVersionId: string | null;
  referenceClubId: string | null;
  houseRules: string;
  boardExpectations: Record<string, string>;
  importReferenceSquad: boolean;
  manualPlayers: ManualPlayerInput[];
};

export type SaveSeason = {
  id: string;
  season_number: number;
  label: string;
  starts_on: string | null;
  transfer_budget: number;
  wage_budget: number;
  board_expectations: Record<string, unknown>;
};

export type SavePlayer = {
  id: string;
  display_name: string;
  primary_position: string;
  squad_number: number | null;
  status: string;
};

export type PlayerSnapshot = {
  save_player_id: string;
  overall: number;
  potential: number | null;
  age: number | null;
  value_amount: number | null;
  wage_amount: number | null;
  notes: string | null;
};

export type SaveSetting = {
  setting_key: string;
  setting_value: unknown;
};

type UserRow = LocalUser & {
  password_hash: string;
};

type SessionRow = {
  user_id: string;
  email: string;
  created_at: string;
  expires_at: string;
};

type SaveSeasonRow = Omit<SaveSeason, "board_expectations"> & {
  board_expectations: string;
};

type SaveSettingRow = {
  setting_key: string;
  setting_value: string;
};

let db: DatabaseSync | null = null;

function databasePath() {
  return process.env.SQLITE_DATABASE_PATH ?? join(process.cwd(), ".data", "career-console.sqlite");
}

export function getDb() {
  if (!db) {
    const filePath = databasePath();
    mkdirSync(dirname(filePath), { recursive: true });
    db = new DatabaseSync(filePath);
    db.exec("pragma foreign_keys = on");
    db.exec("pragma journal_mode = wal");
    initializeSchema(db);
    seedReferenceData(db);
  }

  return db;
}

function initializeSchema(database: DatabaseSync) {
  database.exec(`
    create table if not exists users (
      id text primary key,
      email text not null unique,
      password_hash text not null,
      created_at text not null default (datetime('now'))
    );

    create table if not exists sessions (
      token_hash text primary key,
      user_id text not null references users(id) on delete cascade,
      expires_at text not null,
      created_at text not null default (datetime('now'))
    );

    create table if not exists game_versions (
      id text primary key,
      game_code text not null,
      platform text not null,
      title text not null,
      version_label text not null,
      roster_date text,
      is_default integer not null default 0
    );

    create table if not exists clubs (
      id text primary key,
      name text not null,
      city text,
      is_active integer not null default 1
    );

    create table if not exists reference_squad_players (
      id text primary key,
      club_id text not null references clubs(id) on delete cascade,
      display_name text not null,
      primary_position text not null,
      squad_number integer,
      overall integer not null,
      potential integer,
      age integer,
      value_amount real,
      wage_amount real,
      notes text
    );

    create table if not exists career_saves (
      id text primary key,
      user_id text not null references users(id) on delete cascade,
      name text not null,
      club text not null,
      manager_name text not null,
      platform text not null default 'console',
      season_label text not null,
      difficulty text,
      currency text not null default 'USD',
      transfer_budget real not null default 0,
      visibility text not null default 'private' check (visibility in ('private', 'public')),
      reference_club_id text references clubs(id) on delete set null,
      game_version_id text references game_versions(id) on delete set null,
      created_at text not null default (datetime('now')),
      updated_at text not null default (datetime('now'))
    );

    create table if not exists save_seasons (
      id text primary key,
      save_id text not null references career_saves(id) on delete cascade,
      user_id text not null references users(id) on delete cascade,
      season_number integer not null,
      label text not null,
      starts_on text,
      transfer_budget real not null default 0,
      wage_budget real not null default 0,
      board_expectations text not null default '{}',
      created_at text not null default (datetime('now')),
      updated_at text not null default (datetime('now')),
      unique (save_id, season_number)
    );

    create table if not exists save_players (
      id text primary key,
      save_id text not null references career_saves(id) on delete cascade,
      user_id text not null references users(id) on delete cascade,
      display_name text not null,
      primary_position text not null,
      squad_number integer,
      status text not null default 'active',
      created_at text not null default (datetime('now')),
      updated_at text not null default (datetime('now'))
    );

    create table if not exists player_snapshots (
      id text primary key,
      save_player_id text not null references save_players(id) on delete cascade,
      save_id text not null references career_saves(id) on delete cascade,
      user_id text not null references users(id) on delete cascade,
      snapshot_date text not null default (date('now')),
      overall integer not null,
      potential integer,
      age integer,
      value_amount real,
      wage_amount real,
      notes text,
      created_at text not null default (datetime('now'))
    );

    create table if not exists save_settings (
      id text primary key,
      save_id text not null references career_saves(id) on delete cascade,
      user_id text not null references users(id) on delete cascade,
      setting_key text not null,
      setting_value text not null,
      created_at text not null default (datetime('now')),
      updated_at text not null default (datetime('now')),
      unique (save_id, setting_key)
    );

    create index if not exists career_saves_user_id_idx on career_saves(user_id);
    create index if not exists sessions_user_id_idx on sessions(user_id);
    create index if not exists save_players_save_id_idx on save_players(save_id);
    create index if not exists player_snapshots_save_id_idx on player_snapshots(save_id);
  `);
}

function seedReferenceData(database: DatabaseSync) {
  database.prepare(`
    insert or ignore into game_versions (id, game_code, platform, title, version_label, roster_date, is_default)
    values (?, 'fc26', 'console', 'FC26', 'development-roster', '2026-08-17', 1)
  `).run("dev-fc26-console");

  const clubs = [
    ["club-port-vale", "Port Vale", "Stoke-on-Trent"],
    ["club-walsall", "Walsall", "Walsall"],
  ];

  const insertClub = database.prepare("insert or ignore into clubs (id, name, city) values (?, ?, ?)");
  for (const club of clubs) {
    insertClub.run(...club);
  }

  const players: Array<[string, string, string, string, number, number, number, number, number, string]> = [
    ["ref-port-vale-1", "club-port-vale", "M. Cooper", "GK", 1, 70, 73, 25, 8500, "+1 since August"],
    ["ref-port-vale-2", "club-port-vale", "J. Grant", "CM", 8, 68, 74, 27, 6200, "Contract ends 2027"],
    ["ref-port-vale-3", "club-port-vale", "L. Dyer", "ST", 19, 66, 81, 19, 4200, "Prospect signed early"],
    ["ref-walsall-1", "club-walsall", "R. Vale", "LW", 11, 69, 72, 24, 5900, "Impact wide player"],
  ];

  const insertPlayer = database.prepare(`
    insert or ignore into reference_squad_players (
      id, club_id, display_name, primary_position, squad_number, overall, potential, age, wage_amount, notes
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const player of players) {
    insertPlayer.run(...player);
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [method, salt, hash] = storedHash.split("$");

  if (method !== "scrypt" || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sessionExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  return expiresAt;
}

export function createUser(email: string, password: string) {
  const user: UserRow = {
    id: randomUUID(),
    email: normalizeEmail(email),
    password_hash: hashPassword(password),
    created_at: new Date().toISOString(),
  };

  getDb()
    .prepare("insert into users (id, email, password_hash, created_at) values (?, ?, ?, ?)")
    .run(user.id, user.email, user.password_hash, user.created_at);

  return stripPassword(user);
}

export function authenticateUser(email: string, password: string) {
  const user = getDb()
    .prepare("select id, email, password_hash, created_at from users where email = ?")
    .get(normalizeEmail(email)) as UserRow | undefined;

  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  return stripPassword(user);
}

function stripPassword(user: UserRow): LocalUser {
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
  };
}

export function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = sessionExpiry();

  getDb()
    .prepare("insert into sessions (token_hash, user_id, expires_at) values (?, ?, ?)")
    .run(tokenHash(token), userId, expiresAt.toISOString());

  return { token, expiresAt };
}

export function deleteSession(token: string) {
  getDb().prepare("delete from sessions where token_hash = ?").run(tokenHash(token));
}

export function getUserBySessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const row = getDb()
    .prepare(`
      select users.id as user_id, users.email, users.created_at, sessions.expires_at
      from sessions
      join users on users.id = sessions.user_id
      where sessions.token_hash = ?
    `)
    .get(tokenHash(token)) as SessionRow | undefined;

  if (!row || Date.parse(row.expires_at) <= Date.now()) {
    if (row) {
      deleteSession(token);
    }
    return null;
  }

  return {
    id: row.user_id,
    email: row.email,
    created_at: row.created_at,
  };
}

export function listCareerSaves(userId: string) {
  return getDb()
    .prepare(`
      select id, user_id, name, club, manager_name, season_label, difficulty, currency,
        transfer_budget, visibility, updated_at
      from career_saves
      where user_id = ?
      order by updated_at desc
    `)
    .all(userId) as CareerSave[];
}

export function listGameVersions() {
  const rows = getDb()
    .prepare(`
      select id, title, version_label, roster_date, is_default
      from game_versions
      where game_code = 'fc26' and platform = 'console'
      order by is_default desc, roster_date desc
    `)
    .all() as Array<Omit<GameVersion, "is_default"> & { is_default: number }>;

  return rows.map((row) => ({ ...row, is_default: row.is_default === 1 }));
}

export function listReferenceClubs() {
  return getDb()
    .prepare("select id, name, city from clubs where is_active = 1 order by name asc")
    .all() as ReferenceClub[];
}

export function createCareerSaveWithInitialData(input: CreateCareerSaveInput) {
  const database = getDb();
  const saveId = randomUUID();
  const seasonId = randomUUID();
  const now = new Date().toISOString();
  const referenceClub = input.referenceClubId
    ? (database.prepare("select name from clubs where id = ?").get(input.referenceClubId) as { name: string } | undefined)
    : null;
  const club = input.club || referenceClub?.name || "Manual Club";

  database.exec("begin");
  try {
    database.prepare(`
      insert into career_saves (
        id, user_id, name, club, manager_name, platform, season_label, difficulty, currency,
        transfer_budget, visibility, reference_club_id, game_version_id, created_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      saveId,
      input.userId,
      input.name,
      club,
      input.managerName,
      input.platform,
      input.seasonLabel,
      input.difficulty,
      input.currency,
      input.transferBudget,
      input.visibility,
      input.referenceClubId,
      input.gameVersionId,
      now,
      now,
    );

    database.prepare(`
      insert into save_seasons (
        id, save_id, user_id, season_number, label, starts_on, transfer_budget, wage_budget, board_expectations
      ) values (?, ?, ?, 1, ?, date('now'), ?, ?, ?)
    `).run(
      seasonId,
      saveId,
      input.userId,
      input.seasonLabel,
      input.transferBudget,
      input.wageBudget,
      JSON.stringify(input.boardExpectations),
    );

    const sourcePlayers =
      input.importReferenceSquad && input.referenceClubId
        ? getReferencePlayers(input.referenceClubId)
        : input.manualPlayers;

    for (const player of sourcePlayers) {
      insertSavePlayer(database, input.userId, saveId, player);
    }

    upsertSetting(database, input.userId, saveId, "house_rules", input.houseRules);
    upsertSetting(database, input.userId, saveId, "creation_flow", {
      source: input.importReferenceSquad && input.referenceClubId ? "reference" : "manual",
      players_created: sourcePlayers.length,
    });

    database.exec("commit");
  } catch (error) {
    database.exec("rollback");
    throw error;
  }

  return saveId;
}

function getReferencePlayers(clubId: string) {
  return getDb()
    .prepare(`
      select display_name, primary_position, overall, potential, age, value_amount, wage_amount, squad_number, notes
      from reference_squad_players
      where club_id = ?
      order by squad_number asc, display_name asc
    `)
    .all(clubId) as ManualPlayerInput[];
}

function insertSavePlayer(database: DatabaseSync, userId: string, saveId: string, player: ManualPlayerInput) {
  const playerId = randomUUID();
  database.prepare(`
    insert into save_players (id, save_id, user_id, display_name, primary_position, squad_number)
    values (?, ?, ?, ?, ?, ?)
  `).run(playerId, saveId, userId, player.display_name, player.primary_position, player.squad_number);

  database.prepare(`
    insert into player_snapshots (
      id, save_player_id, save_id, user_id, overall, potential, age, value_amount, wage_amount, notes
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    playerId,
    saveId,
    userId,
    player.overall,
    player.potential,
    player.age,
    player.value_amount,
    player.wage_amount,
    player.notes,
  );
}

function upsertSetting(database: DatabaseSync, userId: string, saveId: string, key: string, value: unknown) {
  database.prepare(`
    insert into save_settings (id, save_id, user_id, setting_key, setting_value)
    values (?, ?, ?, ?, ?)
    on conflict(save_id, setting_key) do update set
      setting_value = excluded.setting_value,
      updated_at = datetime('now')
  `).run(randomUUID(), saveId, userId, key, JSON.stringify(value));
}

export function updateCareerSaveVisibilityForUser(userId: string, saveId: string, visibility: "private" | "public") {
  getDb()
    .prepare("update career_saves set visibility = ?, updated_at = ? where id = ? and user_id = ?")
    .run(visibility, new Date().toISOString(), saveId, userId);
}

export function getCareerSaveForUser(userId: string, saveId: string) {
  return getDb()
    .prepare(`
      select id, user_id, name, club, manager_name, season_label, difficulty, currency,
        transfer_budget, visibility, updated_at
      from career_saves
      where id = ? and user_id = ?
    `)
    .get(saveId, userId) as CareerSave | undefined;
}

export function listSaveSeasons(userId: string, saveId: string) {
  const rows = getDb()
    .prepare(`
      select id, season_number, label, starts_on, transfer_budget, wage_budget, board_expectations
      from save_seasons
      where save_id = ? and user_id = ?
      order by season_number asc
    `)
    .all(saveId, userId) as SaveSeasonRow[];

  return rows.map((row) => ({
    ...row,
    board_expectations: parseJsonRecord(row.board_expectations),
  }));
}

export function listSavePlayers(userId: string, saveId: string) {
  return getDb()
    .prepare(`
      select id, display_name, primary_position, squad_number, status
      from save_players
      where save_id = ? and user_id = ?
      order by squad_number asc nulls last, display_name asc
    `)
    .all(saveId, userId) as SavePlayer[];
}

export function listLatestPlayerSnapshots(userId: string, saveId: string) {
  return getDb()
    .prepare(`
      select ps.save_player_id, ps.overall, ps.potential, ps.age, ps.value_amount, ps.wage_amount, ps.notes
      from player_snapshots ps
      join (
        select save_player_id, max(snapshot_date) as snapshot_date
        from player_snapshots
        where save_id = ? and user_id = ?
        group by save_player_id
      ) latest
        on latest.save_player_id = ps.save_player_id
       and latest.snapshot_date = ps.snapshot_date
      where ps.save_id = ? and ps.user_id = ?
    `)
    .all(saveId, userId, saveId, userId) as PlayerSnapshot[];
}

export function listSaveSettings(userId: string, saveId: string) {
  const rows = getDb()
    .prepare("select setting_key, setting_value from save_settings where save_id = ? and user_id = ?")
    .all(saveId, userId) as SaveSettingRow[];

  return rows.map((row) => ({
    setting_key: row.setting_key,
    setting_value: parseJsonValue(row.setting_value),
  }));
}

function parseJsonRecord(value: string) {
  const parsed = parseJsonValue(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function parseJsonValue(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
