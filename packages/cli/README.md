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
| `omit-design new-page <pattern> <path>` | Scaffold a design page from a preset-mobile pattern template. |
| `omit-design upgrade` | Bump all `@omit-design/*` deps to npm latest, install, scan project for removed-class references, and link the CHANGELOG. |

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

# new-page (scaffold a page from a preset-mobile pattern template)
omit-design new-page list-view design/main/products
omit-design new-page detail-view design/main/order --force
# patterns: dashboard / detail-view / dialog-view / form-view /
#           list-view / sheet-action / tab-view / welcome-view

# upgrade (bump all @omit-design/* deps + scan project for legacy refs)
omit-design upgrade
omit-design upgrade --dry-run                # preview only
omit-design upgrade --check                  # exit 1 if any out-of-date (CI)
omit-design upgrade --no-install             # update package.json but skip install
omit-design upgrade --no-migrate             # skip the legacy class/API scan
```

After upgrade the command scans your `.css` / `.tsx` / `.ts` etc. for class
names and APIs removed in past releases (e.g. `.shell-device-screen` →
`.shell-design-frame` after engine 0.2.0) and prints a per-file migration
report. Pass `--no-migrate` to skip.

## License

MIT
