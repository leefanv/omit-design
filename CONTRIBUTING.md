# Contributing to omit-design

Thanks for poking around. This is a small repo run by a single maintainer at the moment — issues, PRs, and "this is broken in prod" reports are all welcome.

[简体中文](./CONTRIBUTING.zh-CN.md)

## Repo layout

```
omit-design/
├── packages/
│   ├── cli/                @omit-design/cli
│   ├── engine/             @omit-design/engine
│   ├── eslint-plugin/      @omit-design/eslint-plugin
│   ├── preset-mobile/      @omit-design/preset-mobile
│   └── figma-plugin/       @omit-design/figma-plugin
├── examples/
│   └── playground/         Local preview app — workspace-linked to packages/*
├── skills/                 Claude Code skills (synced into init scaffold)
├── templates/init/         Scaffold for `omit-design init`
├── docs/                   Architecture / release notes / migration guides
└── scripts/                Internal build / sync scripts
```

## Local development

```bash
git clone https://github.com/leefanv/omit-design.git
cd omit-design
bun install                 # workspaces
bun run lint                # eslint on the monorepo
bun --cwd packages/cli run typecheck
bun --cwd packages/engine run typecheck
```

### Run the playground

`examples/playground` is a real omit-design project linked to the local engine + preset via `workspace:*`. It's the fastest way to verify a change end-to-end:

```bash
bun --filter @omit-design/playground run dev
# http://localhost:5173/workspace/playground
```

Edit `packages/engine/src/...` and Vite HMR picks up the change immediately.

### Test the CLI locally

```bash
bun --cwd packages/cli run build
node packages/cli/dist/cli.js init /tmp/test-app
cd /tmp/test-app && npm install && npm run dev
```

## Adding things

### A CLI command
1. Define the command in `packages/cli/src/commands/<name>.ts` using citty
2. Register it in `packages/cli/src/cli.ts` `subCommands`
3. Add usage to [packages/cli/README.md](./packages/cli/README.md) and the relevant skill in `skills/`
4. Update root README if it's a top-level workflow command

### A pattern
Use the `add-pattern` skill (or do it manually):
1. Add a section to `packages/preset-mobile/PATTERNS.md`
2. Add a copy-paste skeleton at `packages/preset-mobile/templates/<name>.tmpl.tsx`
3. Don't apply to business pages until reviewed

### A skill
Skills live in `skills/<name>/`. Each one ships a `SKILL.md` with frontmatter + optional `references/<topic>.md` for progressive disclosure.

Sync skills into the init scaffold before publishing CLI:
```bash
node scripts/sync-skills.mjs
```

## Code style

- **TypeScript everywhere.** No new `.js` source files in packages/.
- **No `any`.** Use proper types or `unknown` + narrow.
- **No design literals in design files.** Lint catches this; agents and humans alike are bound.
- **Comments are for *why*, not *what*.** `// @pattern: ...` is the only mandatory comment.
- **Conventional commits.** `feat(scope): ...` / `fix(scope): ...` / `chore: ...` / `docs(scope): ...`. Scopes track the package: `cli`, `engine`, `eslint-plugin`, `preset-mobile`, `figma-plugin`, or `engine/shell`-style for sub-areas.

## CI

Single workflow at [.github/workflows/ci.yml](./.github/workflows/ci.yml). Triggers:

- push to `main` (post-merge gate)
- any PR (pre-merge gate)

Jobs (one job, ubuntu-latest, bun 1.1.0):
1. `bun install` (workspaces)
2. `bun run lint` (eslint .)
3. `bun --cwd packages/cli run typecheck`
4. `bun --cwd packages/engine run typecheck`

There are no tests yet. Surface is too volatile pre-1.0 — we'll add Vitest once class names and module shapes settle.

## Releasing (maintainer-only)

See [docs/release.md](./docs/release.md). Short version:

```bash
# 1. Bump version(s) in package.json — for engine/preset-mobile, lockstep is the norm
# 2. Update CHANGELOG.md (Keep a Changelog format)
# 3. Commit:  chore: release v0.X.Y (engine / preset-mobile)
# 4. Push to main (CI greens)
# 5. Publish per package:
cd packages/engine && npm publish --access public
cd packages/preset-mobile && npm publish --access public
cd packages/cli && npm publish --access public      # only when CLI changed

# 6. Verify:
curl -s https://registry.npmjs.org/@omit-design/engine/latest | grep version
```

There is no automated release workflow — `npm publish` is intentionally manual to keep human approval on every public surface change.

## Cloud-coupling guard

This repo intentionally has **no cloud / auth code**. PR review rejects:

- API endpoints (Hono / Express / Next.js API routes)
- Authentication flows (login, sessions, BYOK key management)
- Cloud deploy configs (`fly.toml`, `vercel.json`, `wrangler.toml`)
- Account/membership UI

Cloud features belong in a separate downstream product, not this repo.

## Reporting bugs

Open an issue with:
- Versions: `npm ls @omit-design/engine @omit-design/cli @omit-design/preset-mobile`
- Repro: a minimal `init`-scaffolded project + the smallest design file that triggers it
- Expected vs actual

For visual regressions, a before/after screenshot of `/workspace/<projectId>` is gold.

## License

By contributing you agree your contributions are licensed under [MIT](./LICENSE).
