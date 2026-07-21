# actions-discord-status

GitHub Action that posts GitHub Actions CI/CD status updates to Discord webhooks.

## Architecture

- `src/index.ts` — entry point: parse inputs, build payload, send webhooks, set outputs
- `src/input.ts`, `src/context.ts` — input parsing and GitHub context
- `src/format.ts`, `src/validate.ts` — event formatting and Discord payload validation
- `src/constants.ts`, `src/utils.ts` — shared constants and logging
- `action.yml` — action metadata
- `dist/index.js` — published CJS bundle (committed on release tags only)

## Contract sync

When behavior changes, update:

- `README.md`
- `action.yml`
- tests under `tests/`
- regenerate `dist/index.js` with `pnpm run build`

## Verification

```bash
pnpm run validate
pnpm run build
```

## Release

1. Create a pre-release from `main`
2. Verify the Release workflow completes (includes cross-platform e2e)
3. Promote to a full release when ready

## Engineering standards

Follow AppBase `docs/org-standards/` with personal-repo overrides (`personal-repos.md`):

- Runners: `ubuntu-latest` / `windows-latest`
- Checkout: `actions/checkout@v7`
- Node setup: `actions/setup-node@v7`
- Quality gate: `pnpm run validate`

## OpenWiki

This repository has documentation located in the /openwiki directory.

Start here:

- [OpenWiki quickstart](openwiki/quickstart.md)

OpenWiki includes repository overview, architecture notes, workflows, domain concepts, operations, integrations, testing guidance, and source maps.

When working in this repository, read the OpenWiki quickstart first, then follow its links to the relevant architecture, workflow, domain, operation, and testing notes.
