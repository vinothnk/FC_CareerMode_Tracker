import Link from "next/link";

const saveSnapshot = {
  manager: "A. Mensah",
  club: "Port Vale",
  season: "2026/27",
  platform: "Console",
  matchday: "October 18, 2026",
  record: "8W 3D 2L",
  budget: "$4.8M",
};

const decisionCards = [
  {
    label: "Scope",
    title: "FC26 console career tracker",
    body: "A companion app for manually tracking saves, squads, goals, transfers, training notes, and season progress.",
  },
  {
    label: "Not This",
    title: "No CareerMode.xyz cloning",
    body: "The product uses its own workflows, data model, and interface. Similar football facts may appear, but not copied layouts or proprietary content.",
  },
  {
    label: "Platform",
    title: "Desktop web first",
    body: "The MVP targets wide screens for save management and comparison, with responsive mobile views for quick check-ins.",
  },
];

const manualData = [
  "Save name, club, manager, season, difficulty, platform",
  "Fixtures, match results, goals, assists, cards, injuries",
  "Transfers, contract notes, academy prospects, shortlist decisions",
  "Player development plans, role notes, and story beats",
];

const sofaData = [
  "Public player identity fields for lookup and disambiguation",
  "Overall, potential, age, position, nation, club, value, wage",
  "Attribute snapshots when permitted by SoFIFA terms and robots guidance",
  "Source URL, capture date, and user-visible attribution",
];

const backlog = [
  {
    stage: "MVP",
    items: [
      "Create and edit career saves",
      "Manual squad table with roles, ratings, growth, value, wage, and notes",
      "Manual fixture log with result, scorers, assists, and short match notes",
      "Season dashboard for form, table position, top scorers, and budget",
      "Local-first data storage while authentication and cloud sync are deferred",
    ],
  },
  {
    stage: "v1",
    items: [
      "SoFIFA-assisted player lookup with attribution and refresh history",
      "Transfer shortlist, contract tracker, and academy pipeline",
      "Season archive with year-over-year player progression",
      "CSV import/export for users who keep spreadsheets",
      "Optional account sync across desktop and mobile browsers",
    ],
  },
  {
    stage: "Later",
    items: [
      "Shareable career reports and generated season recaps",
      "Multi-save comparison and challenge templates",
      "Companion mobile capture flow for quick post-match entry",
      "Community tactics, sliders, and house-rule libraries",
      "Console screenshot parsing only if accuracy and consent are strong",
    ],
  },
];

const trackerRows = [
  ["GK", "M. Cooper", "70", "73", "Starter", "+1 since August"],
  ["CM", "J. Grant", "68", "74", "Rotation", "Contract ends 2027"],
  ["ST", "L. Dyer", "66", "81", "Prospect", "Loan offers blocked"],
  ["LW", "R. Vale", "69", "72", "Impact sub", "5 goals in 9 apps"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f7f4] text-[#17211b]">
      <section className="border-b border-[#d9dfd5] bg-[#f5f7f4]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-6 lg:grid-cols-[1fr_420px] lg:px-8 lg:py-8">
          <div className="flex min-h-[520px] flex-col justify-between">
            <nav className="flex flex-wrap items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded bg-[#145c42] font-semibold text-white">
                  FC
                </span>
                <span className="font-semibold">FC26 Career Console</span>
              </div>
              <div className="flex gap-4 text-[#526056]">
                <a href="#scope">Scope</a>
                <a href="#data">Data</a>
                <a href="#backlog">Backlog</a>
                <Link className="font-semibold text-[#145c42]" href="/login">Log in</Link>
              </div>
            </nav>

            <div className="max-w-3xl py-12">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#b34835]">
                Phase 0 Product Definition
              </p>
              <h1 className="text-5xl font-semibold leading-[1.02] text-[#101712] sm:text-6xl lg:text-7xl">
                Manual career-mode tracking for FC26 console saves.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#526056]">
                A focused desktop web app for solo players who want structure,
                memory, and season history without pretending to be a live game
                database or copying another career-mode product.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className="rounded bg-[#145c42] px-4 py-2 font-semibold text-white" href="/register">
                  Create account
                </Link>
                <Link className="rounded border border-[#cbd4c7] px-4 py-2 font-semibold" href="/dashboard">
                  Open app
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {decisionCards.map((card) => (
                <article
                  className="rounded border border-[#d9dfd5] bg-white/70 p-4"
                  key={card.title}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b34835]">
                    {card.label}
                  </p>
                  <h2 className="mt-2 text-base font-semibold">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#526056]">
                    {card.body}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside className="self-stretch rounded border border-[#cbd4c7] bg-[#17211b] p-4 text-white shadow-2xl shadow-[#17211b]/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#9bb5a5]">
                  Active Save
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  {saveSnapshot.club}
                </h2>
              </div>
              <span className="rounded bg-[#d8f26f] px-3 py-1 text-sm font-semibold text-[#17211b]">
                {saveSnapshot.platform}
              </span>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {Object.entries(saveSnapshot).map(([key, value]) => (
                <div className="rounded bg-white/7 p-3" key={key}>
                  <dt className="capitalize text-[#9bb5a5]">{key}</dt>
                  <dd className="mt-1 font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 overflow-hidden rounded border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/10 text-[#d8f26f]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Pos</th>
                    <th className="px-3 py-2 font-medium">Player</th>
                    <th className="px-3 py-2 font-medium">OVR</th>
                    <th className="px-3 py-2 font-medium">POT</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trackerRows.map(([pos, player, ovr, pot, status, note]) => (
                    <tr className="border-t border-white/10" key={player}>
                      <td className="px-3 py-3 text-[#9bb5a5]">{pos}</td>
                      <td className="px-3 py-3">
                        <span className="block font-medium">{player}</span>
                        <span className="text-xs text-[#9bb5a5]">{note}</span>
                      </td>
                      <td className="px-3 py-3">{ovr}</td>
                      <td className="px-3 py-3">{pot}</td>
                      <td className="px-3 py-3">{status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:px-8" id="scope">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b34835]">
            Core User
          </p>
          <h2 className="mt-3 text-3xl font-semibold">
            Built for solo players manually tracking console saves.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded border border-[#d9dfd5] bg-white p-5">
            <h3 className="font-semibold">MVP Platform</h3>
            <p className="mt-2 leading-7 text-[#526056]">
              Desktop web comes first for data-heavy tables, season review, and
              squad planning. Mobile stays responsive for quick edits and reads.
            </p>
          </div>
          <div className="rounded border border-[#d9dfd5] bg-white p-5">
            <h3 className="font-semibold">Storage Posture</h3>
            <p className="mt-2 leading-7 text-[#526056]">
              MVP starts with user-entered save data. Imported reference data is
              optional, attributable, refreshable, and never treated as owned.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[#d9dfd5] bg-white" id="data">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-2 lg:px-8">
          <DataList title="Manual Data" items={manualData} />
          <DataList title="SoFIFA-Assisted Data" items={sofaData} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="grid gap-5 rounded border border-[#d9dfd5] bg-[#fffdf7] p-6 md:grid-cols-[260px_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b34835]">
              Legal And Ethical Guardrails
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Scrape carefully or do not scrape.</h2>
          </div>
          <ul className="grid gap-3 text-[#526056] sm:grid-cols-2">
            <li>Respect SoFIFA robots.txt, terms, rate limits, and attribution expectations.</li>
            <li>Store only the minimum reference fields needed for user workflows.</li>
            <li>Prefer user-triggered lookup and caching over bulk harvesting.</li>
            <li>Keep user save data separate from third-party reference snapshots.</li>
            <li>Expose source URLs and refresh dates anywhere imported data appears.</li>
            <li>Remove cached third-party data when permission or policy changes.</li>
          </ul>
        </div>
      </section>

      <section className="border-t border-[#d9dfd5] bg-[#17211b] px-5 py-12 text-white lg:px-8" id="backlog">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8f26f]">
            Feature Backlog
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {backlog.map((group) => (
              <article className="rounded border border-white/10 bg-white/7 p-5" key={group.stage}>
                <h2 className="text-xl font-semibold">{group.stage}</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[#c7d4ca]">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function DataList({ title, items }: { title: string; items: string[] }) {
  return (
    <article>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li className="rounded border border-[#d9dfd5] bg-[#f5f7f4] p-4 text-[#526056]" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
