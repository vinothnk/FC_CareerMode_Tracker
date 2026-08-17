import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/sqlite/auth";
import {
  getCareerSaveForUser,
  getSavePlayerForUser,
  listPlayerSnapshotHistory,
} from "@/lib/sqlite/db";
import { PlayerForm } from "../SquadManagementClient";

export default async function PlayerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ saveId: string; playerId: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const [{ saveId, playerId }, query, user] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
  ]);

  if (!user) {
    redirect("/login");
  }

  const save = getCareerSaveForUser(user.id, saveId);

  if (!save) {
    notFound();
  }

  const player = getSavePlayerForUser(user.id, saveId, playerId);

  if (!player) {
    notFound();
  }

  const history = listPlayerSnapshotHistory(user.id, saveId, playerId);

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#17211b]">
      <header className="border-b border-[#d9dfd5] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold text-[#145c42]">
              <Link href={`/dashboard/${save.id}/squad`}>Squad</Link>
              <Link href={`/dashboard/${save.id}`}>Dashboard</Link>
            </div>
            <h1 className="mt-2 text-3xl font-semibold">{player.display_name}</h1>
            <p className="mt-1 text-[#526056]">
              {player.primary_position} · {player.role ?? "No role set"} · {save.club}
            </p>
          </div>
          <span className="rounded bg-[#eef2ec] px-3 py-2 text-sm font-semibold uppercase text-[#526056]">
            {player.status.replaceAll("_", " ")}
          </span>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="grid gap-6">
          {query?.error ? (
            <p className="rounded bg-[#fff2dc] px-3 py-2 text-sm text-[#8a4b16]">
              {decodeURIComponent(query.error)}
            </p>
          ) : null}

          <section className="rounded border border-[#d9dfd5] bg-white p-5">
            <h2 className="text-xl font-semibold">Current profile</h2>
            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric label="OVR" value={String(player.overall ?? "-")} />
              <Metric label="Potential" value={String(player.potential ?? "-")} />
              <Metric label="Age" value={String(player.age ?? "-")} />
              <Metric label="Value" value={player.value_amount ? money(player.value_amount, save.currency) : "-"} />
              <Metric label="Wage" value={player.wage_amount ? money(player.wage_amount, save.currency) : "-"} />
              <Metric label="Squad number" value={String(player.squad_number ?? "-")} />
            </dl>
          </section>

          <section className="rounded border border-[#d9dfd5] bg-white p-5">
            <h2 className="text-xl font-semibold">Edit player</h2>
            <PlayerForm player={player} saveId={save.id} />
          </section>
        </div>

        <aside className="h-fit rounded border border-[#d9dfd5] bg-white p-5">
          <h2 className="text-xl font-semibold">Snapshot history</h2>
          <div className="mt-4 grid gap-3">
            {history.map((snapshot) => (
              <article key={snapshot.id} className="rounded bg-[#f5f7f4] p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">
                    {snapshot.snapshot_date ? new Date(snapshot.snapshot_date).toLocaleDateString("en-US") : "Current"}
                  </p>
                  <p className="text-[#526056]">OVR {snapshot.overall}</p>
                </div>
                <p className="mt-1 text-[#526056]">
                  POT {snapshot.potential ?? "-"} · Age {snapshot.age ?? "-"} · Wage {snapshot.wage_amount ? money(snapshot.wage_amount, save.currency) : "-"}
                </p>
                {snapshot.notes ? <p className="mt-2">{snapshot.notes}</p> : null}
              </article>
            ))}
          </div>
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
