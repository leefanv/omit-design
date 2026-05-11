<div align="center">

# omit-design

**AI-collaborative design composition framework**
*Write TSX, lint with hard rules, preview locally — no cloud, no accounts.*

[![npm engine](https://img.shields.io/npm/v/@omit-design/engine?label=engine)](https://www.npmjs.com/package/@omit-design/engine)
[![npm cli](https://img.shields.io/npm/v/@omit-design/cli?label=cli)](https://www.npmjs.com/package/@omit-design/cli)
[![CI](https://github.com/leefanv/omit-design/actions/workflows/ci.yml/badge.svg)](https://github.com/leefanv/omit-design/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

[简体中文](./README.zh-CN.md) · [Architecture](./docs/architecture.md) · [Changelog](./CHANGELOG.md) · [Contributing](./CONTRIBUTING.md)

</div>

---

## What it is

omit-design is a framework for designing UIs where humans and AI agents can both contribute reliably:

- **Designs are real React pages.** Every "design" is a clickable, navigable TSX component — not an image, not a Figma frame. The same TSX runs in your dev server, your production build, and (optionally) imports back into Figma.
- **AI output is constrained at four deterministic layers.** Skills (natural-language guidance), ESLint hard rules (no design literals, whitelist imports, mandatory pattern headers, pattern-scoped component requirements), and copy-paste templates per pattern. `npm run lint` is the single compliance gate — and runs automatically on `git commit` via the husky pre-commit hook installed by `init`.
- **Local-first, zero accounts.** No cloud, no auth, no telemetry. Dev server, inspect overlay, theme editor, and Figma export all run in your browser.

## Quick start

```bash
npx @omit-design/cli init my-app
cd my-app
npm install
npm run dev
```

Open `http://localhost:5173/` — the workspace lands on `/workspace` with your project. `design/` and `patterns/` start empty; you create both in Claude Code (see below).

## Five-minute tour

```bash
# 1. New project
npx @omit-design/cli init cafe-pos
cd cafe-pos && npm install
npm run dev   # http://localhost:5173/

# 2. In the workspace (Library → PRDs → + New), write a PRD.
#    Then click "Distill patterns from this PRD" and paste into Claude Code:
#    /distill-patterns-from-prd reviews the PRD, creates matching pattern
#    files under patterns/<id>/. You approve them.

# 3. From the same PRD, click "Copy Claude prompt" and paste into Claude Code:
#    /new-design copies the chosen pattern's template into design/<group>/<name>.tsx
#    and fills the placeholders.

# 4. The four hard rules run on every git commit via husky:
npm run lint   # blocks design literals, non-whitelist imports, missing @pattern
               # headers, files that declare a pattern but don't import any of
               # its signature components

# 5. When new omit-design versions ship:
npx omit-design upgrade   # bumps deps + scans your project for removed-class refs
```

No PRD yet? Just ask Claude to make a page — `/new-design` calls `/add-pattern` in conversational mode (5 short questions) and produces a minimal pattern first.

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                       AI agent / human author                      │
│                  (main conversation = "director")                  │
└────────────────────────────────────────────────────────────────────┘
        │              │              │                  │
        ▼              ▼              ▼                  ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────────┐
│ .claude/    │ │ ESLint      │ │ Pattern     │ │ .claude/agents/│
│  skills/    │ │  4 hard     │ │  templates  │ │  pattern-      │
│ (natural    │ │  rules      │ │ (copy-      │ │   applier      │
│  language)  │ │ (deter-     │ │  paste)     │ │  audit-        │
│             │ │  ministic)  │ │             │ │   reviewer     │
└─────────────┘ └─────────────┘ └─────────────┘ └────────────────┘
        │              │              │                  │
        └──────────────┴──────┬───────┴──────────────────┘
                              ▼
        ┌────────────────────────────────────────────────────┐
        │           design/<group>/<file>.tsx                │
        │    (real React page — runs in dev + prod)          │
        │           ↑ husky pre-commit gate                  │
        └────────────────────────────────────────────────────┘
                                 │
                                 ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ @omit-design/engine                                         │
   │   shell/    canvas-style workspace UI (Figma-like layout)   │
   │   registry/ design discovery + entry registry               │
   │   inspect/  hover/measure/a11y overlays in dev              │
   │   capture/  DOM → FigmaNode JSON → @omit-design/figma-plugin│
   │   theme-editor/  WYSIWYG token editor                       │
   └─────────────────────────────────────────────────────────────┘
```

See [docs/architecture.md](./docs/architecture.md) for module-level detail and dependency graph.

## Packages

| Package | Version | What |
|---|---|---|
| [`@omit-design/cli`](./packages/cli/) | [![npm](https://img.shields.io/npm/v/@omit-design/cli?label=)](https://www.npmjs.com/package/@omit-design/cli) | CLI — `init` (with husky + git + agents) / `dev` / `lint` / `new-page` / `skills update` / `upgrade` |
| [`@omit-design/engine`](./packages/engine/) | [![npm](https://img.shields.io/npm/v/@omit-design/engine?label=)](https://www.npmjs.com/package/@omit-design/engine) | Runtime — registry, discovery, inspect, theme-editor, capture, canvas shell |
| [`@omit-design/eslint-plugin`](./packages/eslint-plugin/) | [![npm](https://img.shields.io/npm/v/@omit-design/eslint-plugin?label=)](https://www.npmjs.com/package/@omit-design/eslint-plugin) | The four hard rules |
| [`@omit-design/preset-mobile`](./packages/preset-mobile/) | [![npm](https://img.shields.io/npm/v/@omit-design/preset-mobile?label=)](https://www.npmjs.com/package/@omit-design/preset-mobile) | Mobile preset: 21 `Om*` components + design tokens |
| [`@omit-design/figma-plugin`](./packages/figma-plugin/) | [![npm](https://img.shields.io/npm/v/@omit-design/figma-plugin?label=)](https://www.npmjs.com/package/@omit-design/figma-plugin) | Figma plugin — imports captured FigmaNode JSON as editable Frames |

## The four hard rules

Enforced by `@omit-design/eslint-plugin` on every file under `design/`:

1. **No design literals.** Raw colors (`#FF6B00`), pixel sizes (`16px`), or spacing values are forbidden in design files. Use tokens: `var(--om-color-primary)`, `var(--om-spacing-md)`, etc.
2. **Whitelist imports.** Design files can only import from `@omit-design/preset-mobile` (the `Om*` whitelist) plus a small set of layout-only Ionic components (`IonList` / `IonBackButton` / `IonIcon`). No reaching into framework internals.
3. **Mandatory pattern header.** Every design file's first comment line must be `// @pattern: <name>` where `<name>` exists in [PATTERNS.md](./packages/preset-mobile/PATTERNS.md). Pattern is the unit of cataloguing — without it, AI agents can't reliably reason about which template to extend.
4. **Pattern-scoped components.** The declared pattern must actually use at least one of its signature components. Mapping lives in each pattern's `pattern.json` under `<project>/patterns/<id>/` — patterns are project-local and grown on demand by `distill-patterns-from-prd` or `add-pattern`. Stops AI from declaring `@pattern: list-view` and writing a single `OmCard`.

`npm run lint` exits non-zero if any of these is violated. The husky pre-commit hook (auto-installed by `init`) runs the same check on every staged `design/**/*.tsx`, so violations cannot reach the repo silently.

## Skill catalog (3 phases)

Init ships these into `.claude/skills/` for Claude Code to load automatically:

| Phase | Skill | Use when |
|---|---|---|
| **Entry** | `start` | Open-ended request, fresh init, "what should I do next?" — diagnoses project state and recommends one concrete skill. |
| **Entry** | `omit-design-cli` | Questions about init / dev / lint / new-page commands. |
| **Make** | `distill-patterns-from-prd` | Have a PRD and want reusable page patterns extracted from it. Runs before `new-design`. |
| **Make** | `add-pattern` | No PRD yet — `add-pattern` conversational mode asks 3-5 questions and produces a minimal pattern. Also used to add a pattern manually. |
| **Make** | `new-design` | "Make a page for X" / a PRD is provided. Auto-calls the above two if `patterns/` is empty. |
| **Make** | `bootstrap-from-figma` | Have a Figma URL and want the project's visual theme (colors + spacing) seeded. Decoupled from patterns. |
| **Deliver** | `audit-design` | Batch review across the whole repo. |
| **Deliver** | `ship-design` | Ship one named page (lint + a11y + capture in one shot). |

## Design philosophy

| | |
|---|---|
| **TSX is the source of truth** | Designs are React pages. Round-trip with Figma is via `capture` (DOM → JSON → plugin), but the canonical asset stays in code. |
| **Local-first** | Zero accounts, zero servers, zero outbound calls. Inspect overlay and theme editor work offline. |
| **AI as a peer** | The lint rules + pattern templates aren't "please don't break it" — they're a deterministic gate the agent's output has to pass. |
| **Source-shipped** | `@omit-design/engine` and `@omit-design/preset-mobile` ship TypeScript source, no build. Consumers' Vite handles compilation. Smaller surface, better source-map UX. |

## Status

**Pre-1.0 (currently 0.2.x).** API is still evolving — minor versions may include breaking changes. Class names removed across releases are tracked by `omit-design upgrade` so projects can migrate with one command. See [CHANGELOG.md](./CHANGELOG.md) for the full record.

We're using this in production internally (one cafe POS app + a few other apps in flight), but expect rough edges. Issues + PRs welcome.

## Upgrading

If you have an existing project pinned to an older version:

```bash
npx @omit-design/cli@latest upgrade
```

This:
1. discovers all `@omit-design/*` deps in your `package.json`,
2. queries npm for `latest`,
3. rewrites version ranges to `^X.Y.Z`,
4. runs your project's package manager (auto-detected from lockfile),
5. greps your `.css` / `.tsx` / etc. for class names removed in past releases and prints migration suggestions.

Add `--dry-run` to preview, `--check` to use as a CI gate (exits 1 when out-of-date).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Short version:

```bash
git clone https://github.com/leefanv/omit-design.git
cd omit-design
bun install        # workspaces — engine / cli / preset-mobile / eslint-plugin / figma-plugin
bun run lint
bun --cwd packages/engine run typecheck
```

CI gates on `bun run lint` + `tsc --noEmit` per package. No tests yet — surface is too volatile pre-1.0.

## License

[MIT](./LICENSE) © omit-design contributors.
