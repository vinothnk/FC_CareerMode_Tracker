# FC26 Career Console

Desktop-first web app for solo FC26 console career-mode players who manually track saves. This is a focused tracker, not a CareerMode.xyz clone.

## Product Direction

- Primary platform: desktop web, responsive mobile.
- Primary user: solo console career-mode player maintaining one or more saves.
- Source of truth: manually entered save data.
- Optional reference data: SoFIFA-assisted player lookup, only with attribution, source URL, capture date, and respect for current terms/robots guidance.

See [docs/product-definition.md](docs/product-definition.md) for the Phase 0 scope, data boundaries, legal guardrails, and backlog split.

## Development Runtime

```bash
pnpm install
pnpm run dev
pnpm run validate
```

The current implementation runs on local SQLite for development. The app creates
`.data/career-console.sqlite` automatically, stores local users and sessions,
and keeps private career saves scoped to the signed-in account. Supabase
migrations and scripts remain in the repo as the future production migration
target.

## Useful Commands

- `pnpm run dev`: start local development.
- `pnpm run build`: create a production build.
- `pnpm run lint`: run ESLint.
- `pnpm run typecheck`: run TypeScript without emitting files.
- `pnpm test`: verify the foundation files and local development runtime.
- `pnpm run validate`: lint, typecheck, test, and build.
- `pnpm run db:migration:new <name>`: create a Supabase migration.
- `pnpm run db:reset`: reset the local Supabase database and run seed data.
- `pnpm run db:types`: regenerate Supabase TypeScript types.

## Environment

SQLite works without environment variables by default. Set `SQLITE_DATABASE_PATH`
only when you want the development database somewhere other than
`.data/career-console.sqlite`.

Supabase values in `.env.example` are kept for the later production migration.
Never expose the service role key with a `NEXT_PUBLIC_` prefix.

## Deployment

The app is prepared for Vercel as a standard Next.js project via `vercel.json`.
Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` in Vercel project environment variables before
deploying features that need Supabase.
