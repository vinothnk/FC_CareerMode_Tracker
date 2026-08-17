import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/sqlite/auth";
import {
  getCareerSaveForUser,
  listLatestPlayerSnapshots,
  listSavePlayers,
  listSaveSeasons,
  listSaveSettings,
} from "@/lib/sqlite/db";

export default async function CareerDashboardPage({
  params,
}: {
  params: Promise<{ saveId: string }>;
}) {
  const { saveId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const save = getCareerSaveForUser(user.id, saveId);

  if (!save) {
    notFound();
  }

  const [seasons, players, snapshots, settings] = await Promise.all([
    listSaveSeasons(user.id, saveId),
    listSavePlayers(user.id, saveId),
    listLatestPlayerSnapshots(user.id, saveId),
    listSaveSettings(user.id, saveId),
  ]);

  const activeSeason = seasons[0] ?? null;
  const snapshotByPlayer = new Map(
    snapshots.map((snapshot) => [snapshot.save_player_id, snapshot]),
  );
  const settingsByKey = new Map(
    settings.map((setting) => [setting.setting_key, setting.setting_value]),
  );
  const creationFlow = settingsByKey.get("creation_flow") as { source?: string; players_created?: number } | undefined;

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#17211b]">
      <header className="border-b border-[#d9dfd5] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div>
            <Link className="text-sm font-semibold text-[#145c42]" href="/dashboard">
              Back to saves
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">{save.name}</h1>
            <p className="mt-1 text-[#526056]">
              {save.club} · {save.manager_name} · {save.season_label}
            </p>
          </div>
          <span className="rounded bg-[#eef2ec] px-3 py-2 text-sm font-semibold uppercase text-[#526056]">
            {save.visibility}
          </span>
          <Link className="rounded bg-[#145c42] px-4 py-2 text-sm font-semibold text-white" href={`/dashboard/${save.id}/squad`}>
            Manage squad
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1fr_340px] lg:px-8">
        <div className="grid gap-6">
          <section className="rounded border border-[#d9dfd5] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b34835]">
                  Season 1
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{activeSeason?.label ?? "Season 1"}</h2>
              </div>
              <p className="text-sm text-[#526056]">
                Started {activeSeason?.starts_on ? new Date(activeSeason.starts_on).toLocaleDateString("en-US") : "today"}
              </p>
            </div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric label="Transfer budget" value={money(activeSeason?.transfer_budget ?? save.transfer_budget, save.currency)} />
              <Metric label="Wage budget" value={money(activeSeason?.wage_budget ?? 0, save.currency)} />
              <Metric label="Difficulty" value={save.difficulty ?? "Unspecified"} />
            </dl>
          </section>

          <section className="overflow-hidden rounded border border-[#d9dfd5] bg-white">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d9dfd5] p-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b34835]">
                  Initial Squad
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {players.length} players
                </h2>
              </div>
              <p className="text-sm text-[#526056]">
                {creationFlow?.source === "reference" ? "Imported from reference data" : "Manual squad"}
              </p>
            </div>
            {players.length ? (
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
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) => {
                      const snapshot = snapshotByPlayer.get(player.id);

                      return (
                        <tr key={player.id} className="border-t border-[#d9dfd5]">
                          <td className="px-4 py-3 text-[#526056]">{player.squad_number ?? "-"}</td>
                          <td className="px-4 py-3 font-semibold">
                            <Link className="text-[#145c42] underline" href={`/dashboard/${save.id}/squad/${player.id}`}>
                              {player.display_name}
                            </Link>
                          </td>
                          <td className="px-4 py-3">{player.primary_position}</td>
                          <td className="px-4 py-3">{snapshot?.overall ?? "-"}</td>
                          <td className="px-4 py-3">{snapshot?.potential ?? "-"}</td>
                          <td className="px-4 py-3">{snapshot?.age ?? "-"}</td>
                          <td className="px-4 py-3">{snapshot?.value_amount ? money(snapshot.value_amount, save.currency) : "-"}</td>
                          <td className="px-4 py-3">{snapshot?.wage_amount ? money(snapshot.wage_amount, save.currency) : "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5 text-[#526056]">
                No squad players yet. This save is ready for manual squad creation.
              </div>
            )}
          </section>
        </div>

        <aside className="grid h-fit gap-4">
          <section className="rounded border border-[#d9dfd5] bg-white p-5">
            <h2 className="text-lg font-semibold">Objectives</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              {Object.entries(activeSeason?.board_expectations ?? {}).map(([key, value]) => (
                <div key={key} className="rounded bg-[#f5f7f4] p-3">
                  <dt className="font-semibold capitalize text-[#526056]">{key.replaceAll("_", " ")}</dt>
                  <dd className="mt-1">{String(value || "Unset")}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded border border-[#d9dfd5] bg-white p-5">
            <h2 className="text-lg font-semibold">Save Settings</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-[#526056]">House rules</dt>
                <dd className="mt-1">{String(settingsByKey.get("house_rules") || "None set")}</dd>
              </div>
              <div>
                <dt className="text-[#526056]">Created from</dt>
                <dd className="mt-1 capitalize">{creationFlow?.source ?? "manual"}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-[#f5f7f4] p-3">
      <dt className="text-sm text-[#526056]">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
}
