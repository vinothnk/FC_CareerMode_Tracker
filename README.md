# FC26 Career Console

Desktop-first web app for solo FC26 console career-mode players who manually track saves. This is a focused tracker, not a CareerMode.xyz clone.

## Product Direction

- Primary platform: desktop web, responsive mobile.
- Primary user: solo console career-mode player maintaining one or more saves.
- Source of truth: manually entered save data.
- Optional reference data: SoFIFA-assisted player lookup, only with attribution, source URL, capture date, and respect for current terms/robots guidance.

See [docs/product-definition.md](docs/product-definition.md) for the Phase 0 scope, data boundaries, legal guardrails, and backlog split.

## Development

```bash
pnpm install
pnpm run dev
pnpm test
```

The current implementation is the first product slice: a static, responsive dashboard that captures the scope, sample save surface, data boundaries, legal and ethical constraints, and MVP/v1/later backlog.

## Useful Commands

- `pnpm run dev`: start local development.
- `pnpm run build`: create a production build.
- `pnpm test`: build and verify the rendered product definition.
- `pnpm run lint`: run ESLint.
