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
├── agents/                 Claude Code sub-agents (synced into init scaffold)
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
Patterns are **project-local** — they live in your project's `patterns/<id>/`, not in this repo's preset packages. Three creation paths:

- **From a PRD**: workspace **PRDs tab → Distill patterns from this PRD** → paste into Claude Code, which runs `/distill-patterns-from-prd`.
- **From conversation**: ask Claude to make a page in a project with an empty `patterns/` — `new-design` auto-invokes `/add-pattern` in conversational mode (5 fixed questions → minimal pattern).
- **Manually**: workspace **Library → Patterns → + New**, fill the four fields.

Each pattern is three files under `<project>/patterns/<id>/`: `pattern.json` (with `whitelist`), `template.tmpl.tsx` (first line `// @pattern: <id>`), `README.md` (when to use). ESLint's `require-pattern-components` rule reads `pattern.json` directly — no central registry.

For changes to the **skills themselves** (e.g. tightening what `/distill-patterns-from-prd` produces), edit `skills/<name>/SKILL.md`; the CLI build syncs to `packages/cli/templates/init/.claude/skills/`.

### A skill
Skills live in `skills/<name>/`. Each one ships a `SKILL.md` with frontmatter + optional `references/<topic>.md` for progressive disclosure.

Skills are synced into the init scaffold automatically by the CLI's build step:
```bash
bun --cwd packages/cli run build
# runs scripts/copy-templates.mjs which mirrors:
#   templates/init/  → packages/cli/templates/init/
#   skills/          → packages/cli/templates/init/.claude/skills/
#   agents/          → packages/cli/templates/init/.claude/agents/
```

### A sub-agent
Sub-agents live in `agents/<name>.md` (single file, no subdirectory). Each ships YAML frontmatter (`name`, `description`, optional `tools`, optional `model`) + a system-prompt body. They run in isolated context, invoked by skills via Claude Code's Agent tool.

Conventions:
- **Single responsibility per agent.** `pattern-applier` only applies templates; `audit-reviewer` only reads + reports.
- **Pick the cheapest model that works.** Mechanical work → Haiku; reasoning → Sonnet. Avoid Opus unless decision-heavy.
- **Read-only when possible.** `audit-reviewer` declares `tools: Read, Bash, Glob, Grep` — no Write/Edit. Catches mistakes earlier than just trusting the prompt.
- **Wire from a skill, not from the user.** A skill that "delegates to X if available" is more robust than docs that ask the user to invoke X manually.

Synced into init scaffold by the same CLI build step as skills.

### A new ESLint rule
Rules live at `packages/eslint-plugin/rules/<name>.js` (yes, .js — no TS in this package). Each exports a default with `meta` + `create`. Register in `packages/eslint-plugin/index.js`. Add to default scaffold's `templates/init/eslint.config.js`. Add a row to `packages/eslint-plugin/README.md`. Bump `eslint-plugin` minor (rule semantics).

If the rule reads from `preset-mobile` (e.g. a config file or component metadata), bump preset-mobile too and **publish preset-mobile FIRST** — otherwise users picking up the new rule with an old preset-mobile tarball will hit "config missing" errors. See [docs/release.md](./docs/release.md).

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
