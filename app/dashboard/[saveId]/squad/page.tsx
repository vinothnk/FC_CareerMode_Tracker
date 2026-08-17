import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/sqlite/auth";
import { getCareerSaveForUser, listSquadPlayers } from "@/lib/sqlite/db";
import { SquadManagementClient } from "./SquadManagementClient";

export default async function SquadPage({
  params,
  searchParams,
}: {
  params: Promise<{ saveId: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const [{ saveId }, query, user] = await Promise.all([
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

  const players = listSquadPlayers(user.id, saveId);

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#17211b]">
      <header className="border-b border-[#d9dfd5] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold text-[#145c42]">
              <Link href={`/dashboard/${save.id}`}>Dashboard</Link>
              <Link href="/dashboard">All saves</Link>
            </div>
            <h1 className="mt-2 text-3xl font-semibold">{save.club} squad</h1>
            <p className="mt-1 text-[#526056]">
              {save.name} · {save.season_label} · {save.manager_name}
            </p>
          </div>
          <span className="rounded bg-[#eef2ec] px-3 py-2 text-sm font-semibold uppercase text-[#526056]">
            {save.visibility}
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <SquadManagementClient error={query?.error} players={players} save={save} />
      </section>
    </main>
  );
}
