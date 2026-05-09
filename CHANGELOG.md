# Changelog

All notable changes to omit-design are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-05-09

Productize Skills / Patterns / PRDs into the workspace UI; relocate patterns from preset-mobile into project-local `patterns/`; AI takes over pattern creation from PRDs.

### Added
- **`@omit-design/dev-server`** — new package. Vite plugin exposing `/__omit/*` HTTP endpoints (skills/patterns/PRDs CRUD, starter import) so the engine shell can read/write project files from the browser. Path-traversal guarded; dev-only.
- **`@omit-design/engine`** — `LibraryPage` (full-screen `/workspace/:id/library`) with three tabs:
  - **Skills** — edit `.claude/skills/<name>/SKILL.md` markdown + frontmatter (CodeMirror 6).
  - **Patterns** — single flat list of project-local patterns. Each pattern: description / whitelist (chip-pick from preset components) / Notes / Advanced TSX template (collapsed by default). Empty state has a one-click "Import 8 starters" button.
  - **PRDs** — manage `prds/<slug>.md` files; "Copy Claude prompt" button assembles a one-shot `new-design` invocation onto the clipboard.
- **`omit-design init --no-starters`** — opt out of copying the 8 starter patterns; project starts with empty `patterns/`.

### Changed (BREAKING)
- **`@omit-design/preset-mobile`** — no longer ships pattern definitions:
  - Removed `patterns.config.json`, `templates/*.tmpl.tsx` from the published package.
  - `PATTERNS.md` now points at the project-local model.
  - The package keeps its job as components + tokens + Ionic runtime.
- **`@omit-design/eslint-plugin`** — `require-pattern-components` rule rewritten to read **only** `<projectRoot>/patterns/*/pattern.json`. No longer falls back to preset-mobile. Empty `patterns/` reports `configMissing` with guidance.
- **`@omit-design/cli`**:
  - `init` ships the 8 starter patterns into `<project>/patterns/` (each as `pattern.json` + `template.tmpl.tsx` + `README.md`).
  - `init` template: `app/main.tsx` is now a `.tmpl` — project id, name, and groups are derived from the project name and the filesystem (no more hardcoded `"app"` / single-group config).
- **`new-design` skill / `add-pattern` skill / `pattern-applier` agent** — all rewritten to read patterns from `<project>/patterns/` and write new patterns there (was: preset-mobile `node_modules`).

### Removed
- `@omit-design/preset-mobile/patterns.config.json`, `@omit-design/preset-mobile/templates/`. Use the workspace's Library → Patterns or `omit-design init` to bootstrap project-local patterns instead.

## [0.2.x patch sweep] - 2026-05-09

Branding refresh + docs sync follow-up to the 4-pillar release.

### Added
- **@omit-design/engine** — official omit logo + wordmark inline SVGs
  in the studio shell (`StudioIndex`), replacing the placeholder
  rotated-purple-diamond + "omit design" text block.

### Changed
- **CLI scaffold favicon** — projects scaffolded by `omit-design init`
  now ship the official black/white omit favicon instead of the
  placeholder blue "o" mark.
- **All package READMEs** — synced with the 4-pillar release: 4 hard
  rules instead of 3, husky pre-commit hook documentation, sub-agents,
  Skill catalog (3 phases entry / make / deliver). Both EN and CN
  versions where applicable.
- **CONTRIBUTING.md / CONTRIBUTING.zh-CN.md** — added "A sub-agent" and
  "A new ESLint rule" sections; fixed stale `scripts/sync-skills.mjs`
  reference (real sync is `bun --cwd packages/cli run build`).
- **docs/architecture.md** — Three-layer → Four-layer constraint table
  with sub-agents row; new "Init scaffolding (since 0.2.0)" section
  documenting the auto-installed git / husky / settings / agents.
- **docs/release.md** — bump table + publish order updated; added
  "Cross-package config dependencies" section explaining when an
  ESLint rule reads from preset-mobile config.
- **CLI `--version` output** — was stuck at 0.1.7 due to `cli.ts` not
  being kept in sync with `package.json`; now reports 0.2.1.

### Fixed
- **CLI scaffold pinned cli at `^0.1`** — projects scaffolded since
  cli 0.2.0 had `"@omit-design/cli": "^0.1"` in their devDependencies,
  meaning `npm install` would fetch the old 0.1.x cli alongside the
  newly-scaffolded project. Bumped to `^0.2`.

### Bumped
- `@omit-design/engine` 0.2.2 → **0.2.3**
- `@omit-design/preset-mobile` 0.2.3 → **0.2.4**
- `@omit-design/eslint-plugin` 0.2.0 → **0.2.1**
- `@omit-design/cli` 0.2.0 → **0.2.1**

## [4-pillar AI-determinism upgrade] - 2026-05-09

Borrows four ideas from Donchitos/Claude-Code-Game-Studios, scoped down
for solo designers (no 49-agent overhead).

### Added
- **@omit-design/eslint-plugin** — new fourth hard rule
  `require-pattern-components`: a file declaring `// @pattern: X` must
  import at least one of X's signature components. Mapping ships in
  `@omit-design/preset-mobile/patterns.config.json`.
- **@omit-design/preset-mobile** — `patterns.config.json` ships in the
  published tarball (added to `files` field).
- **CLI `init`** — runs `git init` and scaffolds husky + lint-staged +
  `.husky/pre-commit` so `omit-design lint` blocks bad commits.
  Scaffolds `.claude/settings.json` denying AI edits to `app/`, config
  files, and `package.json`. New `--no-git` flag to skip git init.
- **CLI `lint`** — accepts positional file paths (used by lint-staged);
  silently skips non-`design/*.tsx` paths.
- **Skills** — `start` (state diagnosis → recommends one next skill) and
  `ship-design` (single-page lint + a11y + capture). Catalog
  reorganized into entry / make / deliver phases.
- **Sub-agents** in `.claude/agents/` — `pattern-applier` (Sonnet,
  drafts a page in isolated context) and `audit-reviewer` (Haiku,
  read-only scan + report). Wired into `new-design` and `audit-design`.

### Bumped
- `@omit-design/cli` 0.1.7 → **0.2.0**
- `@omit-design/eslint-plugin` 0.1.1 → **0.2.0**
- `@omit-design/preset-mobile` 0.2.2 → **0.2.3**

### Compatibility
The new `require-pattern-components` rule needs preset-mobile@>=0.2.3
to find `patterns.config.json`. Publish preset-mobile FIRST, then
eslint-plugin, then cli.

## [0.1.7-cli] - 2026-05-09

CLI patch. Translates remaining Chinese strings in `omit-design upgrade` /
`init` / `dev` / `lint` / `new-page` / `skills` runtime output and
`--help` text. Comments inside CLI source remain Chinese (engineering
language). Bumps cli to 0.1.7.

## [i18n English-default] - 2026-05-08

All UI strings, error messages, and Claude Code skills translated to
English. The repo's default UX language is English; per-language
overrides are now opt-in (Chinese variants of READMEs cross-link to
English defaults).

### Changed
- **@omit-design/engine** — every user-facing string in the shell, inspect
  overlay, theme editor, capture dialog, and right panel rendered in
  English. ~110 string literals across 21 source files.
- **@omit-design/preset-mobile** — default `confirmText` / `cancelText` /
  placeholders / aria-labels in `Om*` components rendered in English; all
  8 pattern templates updated (placeholder copy, sample names, button
  labels).
- **Skills** (`skills/**/SKILL.md` and reference docs) translated to
  English. HARD-GATE blocks, decision trees, glossary entries all
  preserved structurally; 8 skill files total. The cli's `templates/init/`
  bundles the new English skills via `scripts/sync-skills.mjs`.
- **examples/playground** demo translated (project description, group
  labels, page meta names + descriptions, mock data for orders /
  products / members / settings, button labels in form pages).

### Bumped
- `@omit-design/engine` 0.2.1 → **0.2.2**
- `@omit-design/preset-mobile` 0.2.1 → **0.2.2**
- `@omit-design/cli` 0.1.5 → **0.1.6** (rebundles English templates)

## [docs] - 2026-05-08

Documentation overhaul for OSS readiness. No code changes; bumps every package
patch so the new READMEs propagate to npm.

### Added
- Root `README.md` rewritten with badges, architecture diagram, three-rule
  explainer, packages table, upgrade instructions; new `README.zh-CN.md`.
- `CONTRIBUTING.md` rewritten with release process pointer, CI overview,
  code-style guidance; new `CONTRIBUTING.zh-CN.md`.
- `docs/architecture.md` — module graph, single-page canvas rationale,
  source-shipping rationale, versioning policy.
- `docs/release.md` — maintainer release runbook (bump → CHANGELOG → publish).
- Per-package READMEs: `engine` expanded with canvas shell + module reference,
  `preset-mobile` translated to EN + new `README.zh-CN.md`, `figma-plugin`
  translated to EN + new `README.zh-CN.md`, `eslint-plugin` gains usage
  examples and configuration reference.

### Removed
- `PROGRESS.md` (obsolete v0.1 internal tracking — git history preserved).

### Bumped
- `@omit-design/engine` 0.2.0 → **0.2.1**
- `@omit-design/preset-mobile` 0.2.0 → **0.2.1**
- `@omit-design/cli` 0.1.4 → **0.1.5**
- `@omit-design/eslint-plugin` 0.1.0 → **0.1.1**
- `@omit-design/figma-plugin` 0.1.1 → **0.1.2**

## [figma-plugin 0.1.1] - 2026-05-08

Patch release. Fixes a P0 distribution bug since 0.1.0.

### Fixed

- **@omit-design/figma-plugin** — `omit-web-to-figma.zip` is now included in
  the published tarball (added to `files` field). 0.1.0 omitted it, so
  `https://unpkg.com/@omit-design/figma-plugin@latest/omit-web-to-figma.zip`
  (referenced by engine's `ExportFigmaDialog`) returned 404; the
  "Download plugin" link in the Export-to-Figma dialog has been broken since
  initial release. Also adds `prepublishOnly` hook to rebuild the zip before
  every publish so the tarball can never ship stale.

## [0.1.4-cli] - 2026-05-08

CLI patch release. Extends `upgrade` with a project-wide legacy-API scanner.

### Added

- **@omit-design/cli** — `omit-design upgrade` now scans the project's source
  files (`.css` / `.scss` / `.tsx` / `.ts` / `.jsx` / `.js` / `.html` / `.vue` /
  `.svelte` / `.astro`) for class names and APIs removed in past releases
  (e.g. `.shell-device-screen`, `.shell-right-panel__tabs`,
  `.shell-studio__layout`) and prints a grouped migration report with file +
  line refs and the suggested replacement. Pass `--no-migrate` to skip.

### Fixed

- **@omit-design/cli** — `--no-install` flag is now honored (citty negation
  semantics: defined as a positive `install` flag with default `true`).

## [0.1.3-cli] - 2026-05-08

CLI patch release. Adds one new command, no breaking changes.

### Added

- **@omit-design/cli** — `omit-design upgrade`: one-shot upgrade for all
  `@omit-design/*` dependencies. Reads `package.json`, queries npm registry
  for `latest` versions, rewrites the version ranges to `^X.Y.Z`, then runs
  the project's package manager (`bun` / `pnpm` / `yarn` / `npm`, auto-detected
  from lockfile). Flags: `--dry-run` (preview), `--check` (CI: exit 1 if any
  out-of-date), `--no-install` (rewrite ranges only).

## [0.2.0] - 2026-05-08

Minor release. Project-detail page redesigned as a Figma-style canvas with
floating overlays. Visual + class-name changes — existing consumer CSS
overrides targeting `shell-right-panel__tab*` / `shell-studio__layout` /
`shell-device-screen*` may need adjustment.

### Added

- **@omit-design/engine** — new `shell/canvas` module exporting `SinglePageCanvas`,
  `EntryPicker`, `ToolRail`, `useCanvasStore`. Drives the redesigned
  `/workspace/:projectId` view: single design rendered directly (no iframe,
  no html-to-image), zoom/pan stage with rAF-coalesced wheel/pointer.
- **@omit-design/engine** — three independent inspect tools on the tool rail:
  `inspect` (📐), `measure` (📏), `a11y` (♿). Tool selection drives
  `inspectStore.mode`; the right-panel mode segment is gone.
- **@omit-design/engine** — `EntryPicker` (group + page tree, search + collapse)
  with two layouts: pinned 240px column or 280px floating popover triggered
  from the header `≡ Pages` pill. Pin state persisted per project.

### Changed

- **@omit-design/engine** — `DesignFrame` no longer wraps designs in a phone /
  desktop chrome (notch / status bar / rounded screen removed). Single-design
  view shares the canvas tool rail and conditional right panel.
- **@omit-design/engine** — `RightPanel` is now a floating card (280px,
  shadow-lift), opens automatically for inspect / measure / a11y / theme tools
  and closes via `×` button. The legacy three-tab structure
  (overview / inspect / theme) is gone.
- **@omit-design/engine** — `findInspectableTarget` whitelist accepts
  `.canvas-page-frame` and `.shell-design-frame` in addition to the legacy
  `.shell-device-content`.
- **@omit-design/preset-mobile** — peerDependency `@omit-design/engine` bumped
  to `^0.2.0` to match the engine 0.2.0 release.
- **@omit-design/cli** — `templates/init/package.json.tmpl` references
  `@omit-design/engine ^0.2` and `@omit-design/preset-mobile ^0.2` so new
  scaffolds pin the redesigned shell.

### Removed

- **@omit-design/engine** — `RightPanel` three-tab navigation
  (`shell-right-panel__tabs` / `__tab` / `__tab-icon` / `__tab-label`).
- **@omit-design/engine** — `DesignFrame` device chrome (`shell-device-screen`,
  `shell-device-notch`, `shell-device-statusbar*`, `DeviceStatusBar`).
- **@omit-design/engine** — `ProjectDetail` legacy grid layout
  (`shell-studio__layout` + `__toc` + `__main` + `__group` + `__grid` + `__card`
  + `__thumb` + `__meta`); these classes are no longer applied (CSS rules
  retained for now).

## [0.1.1] - 2026-05-08

Patch release. Fixes a P0 visual bug from 0.1.0 (workspace shell rendered
with no styles) and adds two new cli subcommands. No breaking changes.

### Fixed

- **@omit-design/engine** — `shell/index.ts` now imports its own `styles.css`
  (aggregator for shell / workspace / device-frame / device-toolbar / sidebar /
  right-panel / studio / capture/export-dialog). 0.1.0 shipped this CSS in the
  `files` field but never imported it, so consumers of `@omit-design/engine/shell`
  rendered as unstyled HTML (default-blue underlined links, no grid). Also
  changes `sideEffects: false` → `["**/*.css"]` to keep prod bundles from
  tree-shaking the CSS.

### Added

- **@omit-design/cli** — `omit-design skills update`: sync the cli's bundled
  `.claude/skills/` into an existing project's `.claude/skills/`. Reports
  `+ added / ~ updated / = same`, supports `--dry-run` and `--target`.
- **@omit-design/cli** — `omit-design new-page <pattern> <path>`: scaffold a
  design page from one of the 8 preset-mobile pattern templates. Auto-appends
  `.tsx`, warns if outside `design/`, requires `--force` to overwrite.
- **@omit-design/cli** — `omit-design --help` top-level output now includes a
  Quick start block. Detailed command examples live in the cli README.
- **@omit-design/preset-mobile** — declares missing `peerDependency` on
  `@omit-design/engine ^0.1.0` (catalog.tsx and preset.manifest.ts use
  type-only imports from engine).

## [0.1.0] - 2026-05-08

Initial public release. Five packages under the `@omit-design` scope.

### Added

- **@omit-design/cli** — three commands (`init` / `dev` / `lint`) built on citty. `init` scaffolds a single-project directory with a demo design, `.claude/skills/`, ESLint config, and Vite setup.
- **@omit-design/engine** — runtime modules shipped as TypeScript source (consumer compiles): `registry`, `discovery` (path-flexible glob), `inspect` overlay, `theme-editor`, `capture` (FigmaNode JSON exporter), and `shell` (workspace UI). Pure UI library — no router boot, no module-level side effects.
- **@omit-design/eslint-plugin** — three hard rules: `no-design-literal` (forbid raw colors / sizes), `no-non-whitelist-import` (only `Om*` components), `require-pattern-header` (each design file declares its pattern).
- **@omit-design/preset-mobile** — 21 `Om*` components, `--om-*` token map (Ionic 8 runtime), 8 patterns + 8 `.tmpl.tsx` scaffolds.
- **@omit-design/figma-plugin** — Figma plugin that consumes `FigmaNode` JSON exported from engine `capture` and creates Frames in Figma. Distributed as both an npm package and a `omit-web-to-figma.zip` for manual install in Figma desktop.
