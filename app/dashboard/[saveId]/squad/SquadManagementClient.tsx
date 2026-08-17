"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { bulkImportPlayersAction, createPlayerAction, updatePlayerAction } from "./actions";
import type { CareerSave, SquadPlayerRow, SquadStatus } from "@/lib/sqlite/db";

const statusOptions: Array<{ value: SquadStatus; label: string }> = [
  { value: "first_team", label: "First team" },
  { value: "reserve", label: "Reserve" },
  { value: "youth_academy", label: "Youth academy" },
  { value: "loaned", label: "Loaned" },
  { value: "sold", label: "Sold" },
  { value: "released", label: "Released" },
];

const depthOrder = ["GK", "RB", "CB", "LB", "RWB", "LWB", "CDM", "CM", "CAM", "RM", "LM", "RW", "LW", "CF", "ST"];

type SortKey = "name" | "position" | "overall" | "potential" | "age" | "value" | "wage";

export function SquadManagementClient({
  save,
  players,
  error,
}: {
  save: CareerSave;
  players: SquadPlayerRow[];
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [position, setPosition] = useState("all");
  const [sort, setSort] = useState<SortKey>("overall");

  const positions = useMemo(
    () => Array.from(new Set(players.map((player) => player.primary_position))).sort(),
    [players],
  );

  const visiblePlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return players
      .filter((player) => {
        const matchesQuery =
          !normalizedQuery ||
          player.display_name.toLowerCase().includes(normalizedQuery) ||
          player.primary_position.toLowerCase().includes(normalizedQuery) ||
          (player.role ?? "").toLowerCase().includes(normalizedQuery);
        const matchesStatus = status === "all" || player.status === status;
        const matchesPosition = position === "all" || player.primary_position === position;

        return matchesQuery && matchesStatus && matchesPosition;
      })
      .sort((a, b) => {
        if (sort === "name") return a.display_name.localeCompare(b.display_name);
        if (sort === "position") return a.primary_position.localeCompare(b.primary_position);
        if (sort === "age") return nullableNumber(a.age) - nullableNumber(b.age);

        const valueA = sortValue(a, sort);
        const valueB = sortValue(b, sort);
        return valueB - valueA || a.display_name.localeCompare(b.display_name);
      });
  }, [players, position, query, sort, status]);

  const depthGroups = useMemo(() => {
    const grouped = new Map<string, SquadPlayerRow[]>();
    for (const player of players.filter((item) => !["sold", "released"].includes(item.status))) {
      const key = player.primary_position || "UNK";
      grouped.set(key, [...(grouped.get(key) ?? []), player]);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => positionRank(a) - positionRank(b) || a.localeCompare(b))
      .map(([key, group]) => [
        key,
        group.sort((a, b) => nullableNumber(b.overall) - nullableNumber(a.overall)),
      ] as const);
  }, [players]);

  return (
    <div className="grid gap-6">
      <section className="rounded border border-[#d9dfd5] bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b34835]">
              Squad Management
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{players.length} players</h2>
          </div>
          {error ? (
            <p className="rounded bg-[#fff2dc] px-3 py-2 text-sm text-[#8a4b16]">
              {decodeURIComponent(error)}
            </p>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_150px_170px_160px]">
          <label className="grid gap-2 text-sm font-medium">
            Search
            <input
              className="rounded border border-[#cbd4c7] px-3 py-2"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, position, role"
              value={query}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Status
            <select className="rounded border border-[#cbd4c7] px-3 py-2" onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="all">All</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Position
            <select className="rounded border border-[#cbd4c7] px-3 py-2" onChange={(event) => setPosition(event.target.value)} value={position}>
              <option value="all">All</option>
              {positions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Sort
            <select className="rounded border border-[#cbd4c7] px-3 py-2" onChange={(event) => setSort(event.target.value as SortKey)} value={sort}>
              <option value="overall">OVR high to low</option>
              <option value="potential">Potential high to low</option>
              <option value="age">Age low to high</option>
              <option value="value">Value high to low</option>
              <option value="wage">Wage high to low</option>
              <option value="name">Name A to Z</option>
              <option value="position">Position A to Z</option>
            </select>
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded border border-[#d9dfd5] bg-white">
        <div className="border-b border-[#d9dfd5] p-5">
          <h3 className="text-xl font-semibold">Squad list</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-[#eef2ec] text-[#526056]">
              <tr>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Player</th>
                <th className="px-4 py-3 font-semibold">Pos</th>
                <th className="px-4 py-3 font-semibold">OVR</th>
                <th className="px-4 py-3 font-semibold">POT</th>
                <th className="px-4 py-3 font-semibold">Age</th>
                <th className="px-4 py-3 font-semibold">Value</th>
                <th className="px-4 py-3 font-semibold">Wage</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Edit</th>
              </tr>
            </thead>
            <tbody>
              {visiblePlayers.map((player) => (
                <tr key={player.id} className="border-t border-[#d9dfd5] align-top">
                  <td className="px-4 py-3 text-[#526056]">{player.squad_number ?? "-"}</td>
                  <td className="px-4 py-3 font-semibold">
                    <Link className="text-[#145c42] underline" href={`/dashboard/${save.id}/squad/${player.id}`}>
                      {player.display_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{player.primary_position}</td>
                  <td className="px-4 py-3">{player.overall ?? "-"}</td>
                  <td className="px-4 py-3">{player.potential ?? "-"}</td>
                  <td className="px-4 py-3">{player.age ?? "-"}</td>
                  <td className="px-4 py-3">{player.value_amount ? money(player.value_amount, save.currency) : "-"}</td>
                  <td className="px-4 py-3">{player.wage_amount ? money(player.wage_amount, save.currency) : "-"}</td>
                  <td className="px-4 py-3">{player.role ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-[#eef2ec] px-2 py-1 text-xs font-semibold uppercase text-[#526056]">
                      {statusLabel(player.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <details>
                      <summary className="cursor-pointer font-semibold text-[#145c42]">Quick edit</summary>
                      <PlayerForm className="mt-3 w-[680px] max-w-[80vw]" player={player} saveId={save.id} />
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!visiblePlayers.length ? (
          <div className="p-5 text-[#526056]">No players match the current filters.</div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form action={createPlayerAction} className="rounded border border-[#d9dfd5] bg-white p-5">
          <input name="save_id" type="hidden" value={save.id} />
          <h3 className="text-xl font-semibold">Manual player entry</h3>
          <PlayerFields />
          <button className="mt-4 rounded bg-[#145c42] px-4 py-2 font-semibold text-white" type="submit">
            Add player
          </button>
        </form>

        <form action={bulkImportPlayersAction} className="rounded border border-[#d9dfd5] bg-white p-5">
          <input name="save_id" type="hidden" value={save.id} />
          <h3 className="text-xl font-semibold">Bulk import or edit</h3>
          <label className="mt-4 grid gap-2 text-sm font-medium">
            CSV rows
            <textarea
              className="min-h-36 rounded border border-[#cbd4c7] px-3 py-2 font-mono text-sm"
              name="bulk_players"
              placeholder="Name,POS,OVR,POT,Age,Value,Wage,Role,Status,#"
            />
          </label>
          <button className="mt-4 rounded bg-[#17211b] px-4 py-2 font-semibold text-white" type="submit">
            Import rows
          </button>
        </form>
      </section>

      <section className="rounded border border-[#d9dfd5] bg-white p-5">
        <h3 className="text-xl font-semibold">Positional depth</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {depthGroups.map(([key, group]) => (
            <div key={key} className="rounded bg-[#f5f7f4] p-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold">{key}</h4>
                <span className="text-sm text-[#526056]">{group.length}</span>
              </div>
              <ol className="mt-3 grid gap-2 text-sm">
                {group.slice(0, 6).map((player, index) => (
                  <li key={player.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {index + 1}. {player.display_name}
                    </span>
                    <span className="font-semibold">{player.overall ?? "-"}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function PlayerForm({
  player,
  saveId,
  className = "",
}: {
  player: SquadPlayerRow;
  saveId: string;
  className?: string;
}) {
  return (
    <form action={updatePlayerAction} className={`rounded border border-[#d9dfd5] bg-white p-4 ${className}`}>
      <input name="save_id" type="hidden" value={saveId} />
      <input name="player_id" type="hidden" value={player.id} />
      <PlayerFields player={player} />
      <button className="mt-4 rounded bg-[#145c42] px-4 py-2 font-semibold text-white" type="submit">
        Save changes
      </button>
    </form>
  );
}

function PlayerFields({ player }: { player?: SquadPlayerRow }) {
  return (
    <div className="mt-4 grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_96px_96px_96px]">
        <TextField defaultValue={player?.display_name} label="Name" name="display_name" required />
        <TextField defaultValue={player?.primary_position} label="Position" name="primary_position" required />
        <TextField defaultValue={player?.overall} label="OVR" max={99} min={1} name="overall" required type="number" />
        <TextField defaultValue={player?.potential} label="Potential" max={99} min={1} name="potential" type="number" />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <TextField defaultValue={player?.age} label="Age" max={60} min={15} name="age" type="number" />
        <TextField defaultValue={player?.value_amount} label="Value" min={0} name="value_amount" type="number" />
        <TextField defaultValue={player?.wage_amount} label="Wage" min={0} name="wage_amount" type="number" />
        <TextField defaultValue={player?.squad_number} label="#" max={99} min={1} name="squad_number" type="number" />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <TextField defaultValue={player?.role ?? undefined} label="Role" name="role" placeholder="Important, Rotation, Prospect" />
        <label className="grid gap-2 text-sm font-medium">
          Status
          <select className="rounded border border-[#cbd4c7] px-3 py-2" name="status" defaultValue={player?.status ?? "first_team"}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        Notes
        <textarea className="min-h-20 rounded border border-[#cbd4c7] px-3 py-2" name="notes" defaultValue={player?.notes ?? ""} />
      </label>
    </div>
  );
}

function TextField({
  defaultValue,
  label,
  max,
  min,
  name,
  placeholder,
  required,
  type = "text",
}: {
  defaultValue?: string | number | null;
  label: string;
  max?: number;
  min?: number;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        className="rounded border border-[#cbd4c7] px-3 py-2"
        defaultValue={defaultValue ?? ""}
        max={max}
        min={min}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

function nullableNumber(value: number | null) {
  return value ?? -1;
}

function sortValue(player: SquadPlayerRow, sort: SortKey) {
  if (sort === "overall") return nullableNumber(player.overall);
  if (sort === "potential") return nullableNumber(player.potential);
  if (sort === "value") return nullableNumber(player.value_amount);
  if (sort === "wage") return nullableNumber(player.wage_amount);
  return 0;
}

function positionRank(position: string) {
  const rank = depthOrder.indexOf(position);
  return rank === -1 ? depthOrder.length : rank;
}

function statusLabel(status: SquadStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? "First team";
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
}
