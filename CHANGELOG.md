# Changelog

All notable changes to omit-design are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
