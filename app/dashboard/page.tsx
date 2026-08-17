import { redirect } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { createCareerSave, updateCareerSaveVisibility } from "@/app/dashboard/actions/save-actions";
import { getCurrentUser } from "@/lib/sqlite/auth";
import { listCareerSaves, listGameVersions, listReferenceClubs, type CareerSave } from "@/lib/sqlite/db";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [saves, versions, clubs] = await Promise.all([
    listCareerSaves(user.id),
    listGameVersions(),
    listReferenceClubs(),
  ]);

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#17211b]">
      <header className="border-b border-[#d9dfd5] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded bg-[#145c42] font-semibold text-white">
              FC
            </span>
            <div>
              <p className="font-semibold">Career Console</p>
              <p className="text-sm text-[#526056]">{user.email}</p>
            </div>
          </div>
          <form action={logout}>
            <button className="rounded border border-[#cbd4c7] px-3 py-2 text-sm font-semibold" type="submit">
              Log out
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[440px_1fr] lg:px-8">
        <form action={createCareerSave} className="h-fit rounded border border-[#d9dfd5] bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b34835]">
            New Career
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Create your next save</h1>
          {params?.error ? (
            <p className="mt-3 rounded bg-[#fff2dc] px-3 py-2 text-sm text-[#8a4b16]">
              {decodeURIComponent(params.error)}
            </p>
          ) : null}
          <div className="mt-5 grid gap-5">
            <TextField label="Save name" name="name" placeholder="Port Vale rebuild" />
            <TextField label="Manager" name="manager_name" placeholder="A. Mensah" />
            <TextField label="Season" name="season_label" placeholder="2026/27" />
            <label className="grid gap-2 text-sm font-medium">
              FC database
              <select className="rounded border border-[#cbd4c7] px-3 py-2" name="game_version_id" defaultValue={versions[0]?.id ?? ""}>
                {versions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.title} · {version.version_label}
                    {version.roster_date ? ` · ${version.roster_date}` : ""}
                    {version.is_default ? " · default" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Reference club
              <select className="rounded border border-[#cbd4c7] px-3 py-2" name="reference_club_id" defaultValue="">
                <option value="">No reference club, create manually</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                    {club.city ? ` · ${club.city}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <TextField label="Manual club name" name="club" placeholder="Only required without a reference club" required={false} />
            <label className="flex items-center gap-3 rounded bg-[#eef2ec] px-3 py-2 text-sm font-medium">
              <input className="size-4" name="import_reference_squad" type="checkbox" defaultChecked />
              Import the selected club squad into Season 1
            </label>

            <div className="grid gap-3 border-t border-[#d9dfd5] pt-5">
              <h2 className="font-semibold">Save settings</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="Difficulty" name="difficulty" placeholder="World Class" required={false} />
                <TextField label="Currency" name="currency" placeholder="USD" required={false} />
                <TextField label="Transfer budget" name="transfer_budget" placeholder="4800000" type="number" required={false} />
                <TextField label="Wage budget" name="wage_budget" placeholder="125000" type="number" required={false} />
              </div>
              <TextField label="League objective" name="league_finish" placeholder="Mid-table" required={false} />
              <TextField label="Cup objective" name="domestic_cup" placeholder="Round of 16" required={false} />
              <TextField label="Youth objective" name="youth_development" placeholder="Promote two academy players" required={false} />
              <label className="grid gap-2 text-sm font-medium">
                House rules
                <textarea
                  className="min-h-20 rounded border border-[#cbd4c7] px-3 py-2"
                  name="house_rules"
                  placeholder="No financial takeover. Scout only in home nation for Season 1."
                />
              </label>
            </div>

            <div className="grid gap-3 border-t border-[#d9dfd5] pt-5">
              <div>
                <h2 className="font-semibold">Manual squad starter</h2>
                <p className="mt-1 text-sm text-[#526056]">
                  Used when no reference club is selected.
                </p>
              </div>
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="grid gap-2 rounded bg-[#f5f7f4] p-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_72px_72px]">
                    <input className="rounded border border-[#cbd4c7] px-3 py-2" name={`manual_players.${index}.display_name`} placeholder="Player name" />
                    <input className="rounded border border-[#cbd4c7] px-3 py-2" name={`manual_players.${index}.primary_position`} placeholder="Pos" />
                    <input className="rounded border border-[#cbd4c7] px-3 py-2" name={`manual_players.${index}.overall`} placeholder="OVR" type="number" min="1" max="99" />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-4">
                    <input className="rounded border border-[#cbd4c7] px-3 py-2" name={`manual_players.${index}.potential`} placeholder="POT" type="number" min="1" max="99" />
                    <input className="rounded border border-[#cbd4c7] px-3 py-2" name={`manual_players.${index}.age`} placeholder="Age" type="number" min="15" max="60" />
                    <input className="rounded border border-[#cbd4c7] px-3 py-2" name={`manual_players.${index}.squad_number`} placeholder="#" type="number" min="1" max="99" />
                    <input className="rounded border border-[#cbd4c7] px-3 py-2" name={`manual_players.${index}.wage_amount`} placeholder="Wage" type="number" min="0" />
                  </div>
                </div>
              ))}
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Visibility
              <select className="rounded border border-[#cbd4c7] px-3 py-2" name="visibility" defaultValue="private">
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </label>
            <button className="rounded bg-[#145c42] px-4 py-2 font-semibold text-white" type="submit">
              Create career
            </button>
          </div>
        </form>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b34835]">
                Protected App
              </p>
              <h2 className="mt-2 text-3xl font-semibold">Your career saves</h2>
            </div>
            <p className="text-sm text-[#526056]">
              Private saves are only returned for your account.
            </p>
          </div>

          <div className="mt-5 grid gap-4">
            {saves.length ? (
              saves.map((save) => <SaveCard key={save.id} save={save} />)
            ) : (
              <div className="rounded border border-[#d9dfd5] bg-white p-6 text-[#526056]">
                No saves yet. Create your first career on the left.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function TextField({
  label,
  name,
  placeholder,
  type = "text",
  required = true,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        className="rounded border border-[#cbd4c7] px-3 py-2"
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

function SaveCard({ save }: { save: CareerSave }) {
  return (
    <article className="rounded border border-[#d9dfd5] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold">{save.name}</h3>
            <span className="rounded bg-[#eef2ec] px-2 py-1 text-xs font-semibold uppercase text-[#526056]">
              {save.visibility}
            </span>
          </div>
          <p className="mt-2 text-[#526056]">
            {save.club} · {save.season_label} · {save.manager_name}
          </p>
          <Link className="mt-3 inline-flex rounded bg-[#145c42] px-3 py-2 text-sm font-semibold text-white" href={`/dashboard/${save.id}`}>
            Open dashboard
          </Link>
        </div>
        <form action={updateCareerSaveVisibility} className="flex items-center gap-2">
          <input type="hidden" name="save_id" value={save.id} />
          <select className="rounded border border-[#cbd4c7] px-3 py-2 text-sm" name="visibility" defaultValue={save.visibility}>
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
          <button className="rounded bg-[#17211b] px-3 py-2 text-sm font-semibold text-white" type="submit">
            Save
          </button>
        </form>
      </div>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded bg-[#f5f7f4] p-3">
          <dt className="text-[#526056]">Difficulty</dt>
          <dd className="mt-1 font-semibold">{save.difficulty ?? "Unspecified"}</dd>
        </div>
        <div className="rounded bg-[#f5f7f4] p-3">
          <dt className="text-[#526056]">Budget</dt>
          <dd className="mt-1 font-semibold">${Number(save.transfer_budget).toLocaleString()}</dd>
        </div>
        <div className="rounded bg-[#f5f7f4] p-3">
          <dt className="text-[#526056]">Updated</dt>
          <dd className="mt-1 font-semibold">{new Date(save.updated_at).toLocaleDateString("en-US")}</dd>
        </div>
      </dl>
    </article>
  );
}
