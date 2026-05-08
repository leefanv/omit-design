# @omit-design/cli

> CLI for [omit-design](https://github.com/leefanv/omit-design) — scaffold projects, run a local dev server, run hard-rule lint.

## Install

```bash
npm install -g @omit-design/cli
# or use ad-hoc
npx @omit-design/cli init my-app
```

## Commands

| | |
|---|---|
| `omit-design init <name>` | Scaffold a new project (Vite + React + preset-mobile + ESLint hard rules + `.claude/skills/`) |
| `omit-design dev` | Start the local design server (Vite). |
| `omit-design lint` | Run the three hard rules (`no-design-literal` / `no-non-whitelist-import` / `require-pattern-header`). |
| `omit-design skills update` | Sync the cli's built-in `.claude/skills/` into the current project's `.claude/skills/`. |

## Quick start

```bash
npx @omit-design/cli init my-app
cd my-app
npm install
npm run dev
```

Then open `http://localhost:5173/`. The scaffold ships a single demo design at `design/main/welcome.tsx`.

## Examples

```bash
# Scaffold a new project
npx omit-design init my-app
npx omit-design init my-app --force          # overwrite existing dir

# Dev server
omit-design dev
omit-design dev --port 3000
omit-design dev --host                       # expose on LAN

# Lint
omit-design lint
omit-design lint --json                      # raw ESLint JSON
omit-design lint --glob 'src/views/**/*.tsx' # custom glob

# Skills (upgrade .claude/skills/ to the version shipped with this cli)
omit-design skills update
omit-design skills update --dry-run          # preview only
omit-design skills update --target other/dir
```

## License

MIT
