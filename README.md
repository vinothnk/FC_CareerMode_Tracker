# FC26 Career Console

Desktop-first web app for solo FC26 console career-mode players who manually track saves. This is a focused tracker, not a CareerMode.xyz clone.

## Product Direction

- Primary platform: desktop web, responsive mobile.
- Primary user: solo console career-mode player maintaining one or more saves.
- Source of truth: manually entered save data.
- Optional reference data: SoFIFA-assisted player lookup, only with attribution, source URL, capture date, and respect for current terms/robots guidance.

See [docs/product-definition.md](docs/product-definition.md) for the Phase 0 scope, data boundaries, legal guardrails, and backlog split.

## Phase 1 Foundation

```bash
pnpm install
cp .env.example .env.local
pnpm run db:start
pnpm run db:reset
pnpm run dev
pnpm run validate
```

The current implementation is a Next.js App Router app with React, TypeScript,
Tailwind CSS tokens, Supabase client helpers, a first migration, seed data, and
Vercel deployment metadata.

## Useful Commands

- `pnpm run dev`: start local development.
- `pnpm run build`: create a production build.
- `pnpm run lint`: run ESLint.
- `pnpm run typecheck`: run TypeScript without emitting files.
- `pnpm test`: verify the Phase 1 foundation files.
- `pnpm run validate`: lint, typecheck, test, and build.
- `pnpm run db:migration:new <name>`: create a Supabase migration.
- `pnpm run db:reset`: reset the local Supabase database and run seed data.
- `pnpm run db:types`: regenerate Supabase TypeScript types.

## Environment

Copy `.env.example` to `.env.local` and fill in the Supabase values from either
`pnpm run db:status` for local development or the Supabase dashboard for a hosted
project. Never expose the service role key with a `NEXT_PUBLIC_` prefix.

## Deployment

The app is prepared for Vercel as a standard Next.js project via `vercel.json`.
Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` in Vercel project environment variables before
deploying features that need Supabase.
