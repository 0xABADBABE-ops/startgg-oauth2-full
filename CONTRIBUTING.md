# Contributing to startgg-oauth2-full

## Prerequisites
- Node 18+ and npm 9+
- Git

## Layout
- `src` — library (TypeScript)
- `__tests__` — unit tests
- `examples` — browser + node demos (includes local redirect catcher)
- `.github/workflows/ci.yml` — CI (build + tests)

## Setup
```bash
npm i
npm run build
npm test
```

## Run examples
```bash
npm run dev:browser
npm run dev:node
STARTGG_CLIENT_ID=your_id \
STARTGG_AUTH_URL=https://api.start.gg/oauth/authorize \
STARTGG_TOKEN_URL=https://api.start.gg/oauth/token \
npm run dev:node:server
```

## Branch & PR
- Branch naming: `feat/*`, `fix/*`, `docs/*`, `chore/*`
- Before PR:
  - [ ] `npm run build` passes
  - [ ] `npm test` passes
  - [ ] Tests added/updated when changing behavior
  - [ ] README/docs updated if API or flows changed