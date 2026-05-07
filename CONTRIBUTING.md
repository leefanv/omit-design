# Contributing to omit-design

## Repo layout

```
omit-design/
├── packages/
│   ├── cli/                @omit-design/cli
│   ├── engine/             @omit-design/engine
│   ├── eslint-plugin/      @omit-design/eslint-plugin
│   ├── preset-mobile/      @omit-design/preset-mobile
│   └── figma-plugin/       @omit-design/figma-plugin
├── skills/                 Claude Code skills (distributed via npx skills add)
├── templates/init/         Scaffold for `omit-design init`
└── scripts/                Internal build / sync scripts
```

## Local development

```bash
bun install                 # bun + workspaces
bun run build               # build all packages
bun run lint                # eslint on the monorepo
```

Try the CLI locally:

```bash
bun run --cwd packages/cli build
node packages/cli/dist/cli.js init /tmp/test-app
cd /tmp/test-app && npm install && npm run dev
```

## Adding a CLI command

1. Define the command in `packages/cli/src/commands/<name>.ts` using citty
2. Register it in `packages/cli/src/cli.ts`
3. Add usage to README and the relevant skill

## Adding a pattern

Use the `add-pattern` skill:

1. Add a section to `packages/preset-mobile/PATTERNS.md`
2. Add a copy-paste skeleton at `packages/preset-mobile/templates/<name>.tmpl.tsx`
3. Don't apply to business pages until reviewed

## Skills

Skills live in `skills/<name>/`. Each one ships a `SKILL.md` with frontmatter + optional `references/<topic>.md` for progressive disclosure.

Sync skills into the init scaffold before publishing CLI:

```bash
node scripts/sync-skills.mjs
```

## Cloud-coupling guard

This repo intentionally has no cloud / auth code. PR review rejects:

- API endpoints (Hono / Express / Next.js API routes)
- Authentication flows (login, sessions, BYOK key management)
- Cloud deploy configs (`fly.toml`, `vercel.json`, `wrangler.toml`)
- Account/membership UI

Cloud features belong in a separate downstream product, not this repo.
