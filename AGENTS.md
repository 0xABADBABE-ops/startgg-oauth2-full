# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the TypeScript OAuth2 helpers (PKCE generation, token exchange, authorize URL builder).
- `__tests__/` mirrors the source with Jest specs (e.g., `pkce.test.ts`, `authorize-url.test.ts`).
- `examples/` includes Node, server, and browser demos; use them to validate end-to-end flows.
- Root config (`tsconfig.json`, `jest.config.ts`, `package.json`) defines tooling standards—change only with consensus.

## Build, Test, and Development Commands
- `npm run build` compiles TypeScript via `tsc`; run before opening a PR.
- `npm test` runs the full Jest suite; add `-- pkce` (or similar) to target individual specs.
- `npm run dev:node`, `npm run dev:node:server`, and `npm run dev:browser` start interactive demos for manual OAuth verification.

## Coding Style & Naming Conventions
- Write modern TypeScript (ES2022 target) with strict null checks enabled in `tsconfig.json`.
- Use two-space indentation, semicolons, and single quotes to match the existing codebase.
- Functions and variables use `camelCase`, classes and enums use `PascalCase`, constants use `SCREAMING_SNAKE_CASE` where appropriate.
- Prefer small, self-documenting helpers; add concise comments only when logic is non-obvious.

## Testing Guidelines
- Jest with `ts-jest` handles unit tests; new behaviour requires corresponding specs in `__tests__/`.
- Name test files after the module under test (e.g., `foo.test.ts`); keep describe blocks aligned with exported functions.
- Ensure deterministic randomness in tests (stub RNGs) and cover error cases like PKCE validation failures.

## Commit & Pull Request Guidelines
- Craft commits in the form `type(scope): summary` (examples in history: `fix(pkce): cap verifier length`).
- Each PR should explain the change, list validation steps (e.g., `npm test` output), and link related issues or tickets.
- Include screenshots or curl transcripts when work affects interactive flows or API responses.

## Security & Configuration Tips
- PKCE relies on WebCrypto; document fallbacks if new runtimes lack `crypto.subtle`.
- Never log tokens or verifiers in examples; scrub debug statements before merging.
- Keep secrets out of version control and reference sample env files instead.

## Agent Workflow Checklist
- Sync `main`, install modules (`npm install`), and confirm `npm run build` passes.
- Add focused Jest coverage for new logic and ensure `npm test` is green.
- Update docs (`README.md`, `AGENTS.md`) when behaviour or workflows shift.
- Capture manual verification steps (demo URLs, curl output) in the PR description.

## Release Process
- Bump `package.json` version and update changelog/notes as needed.
- Commit and tag in `vX.Y.Z` form, then push the tag (`git push origin vX.Y.Z`).
- Create a GitHub release using that tag; the `Release Publish` workflow runs automatically (or run it manually via **Run workflow**).
- Ensure `NPM_TOKEN` is configured as a repository secret with publish rights to npm.
- The workflow also publishes to GitHub Packages using `GITHUB_TOKEN`; consumers can install via `npm install @${repo_owner}/startgg-oauth2-full`.
