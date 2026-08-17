import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { createCareerSave, updateCareerSaveVisibility } from "@/app/dashboard/actions/save-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CareerSave = {
  id: string;
  name: string;
  club: string;
  manager_name: string;
  season_label: string;
  difficulty: string | null;
  transfer_budget: number;
  visibility: "private" | "public";
  updated_at: string;
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: saves, error } = await supabase
    .from("career_saves")
    .select("id,name,club,manager_name,season_label,difficulty,transfer_budget,visibility,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

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

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[360px_1fr] lg:px-8">
        <form action={createCareerSave} className="h-fit rounded border border-[#d9dfd5] bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b34835]">
            New Save
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Add a career save</h1>
          <div className="mt-5 grid gap-4">
            <TextField label="Save name" name="name" placeholder="Port Vale rebuild" />
            <TextField label="Club" name="club" placeholder="Port Vale" />
            <TextField label="Manager" name="manager_name" placeholder="A. Mensah" />
            <TextField label="Season" name="season_label" placeholder="2026/27" />
            <TextField label="Difficulty" name="difficulty" placeholder="World Class" required={false} />
            <TextField label="Transfer budget" name="transfer_budget" placeholder="4800000" type="number" required={false} />
            <label className="grid gap-2 text-sm font-medium">
              Visibility
              <select className="rounded border border-[#cbd4c7] px-3 py-2" name="visibility" defaultValue="private">
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </label>
            <button className="rounded bg-[#145c42] px-4 py-2 font-semibold text-white" type="submit">
              Create save
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
            {(saves as CareerSave[] | null)?.length ? (
              (saves as CareerSave[]).map((save) => <SaveCard key={save.id} save={save} />)
            ) : (
              <div className="rounded border border-[#d9dfd5] bg-white p-6 text-[#526056]">
                No saves yet. Add your first career on the left.
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
