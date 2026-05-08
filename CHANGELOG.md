# Changelog

All notable changes to omit-design are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
