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

## Quick start

```bash
npx @omit-design/cli init my-app
cd my-app
npm install
npm run dev
```

Then open `http://localhost:5173/`. The scaffold ships a single demo design at `design/main/welcome.tsx`.

## License

MIT
