# Changelog

All notable changes to omit-design are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-08

Initial public release. Five packages under the `@omit-design` scope.

### Added

- **@omit-design/cli** — three commands (`init` / `dev` / `lint`) built on citty. `init` scaffolds a single-project directory with a demo design, `.claude/skills/`, ESLint config, and Vite setup.
- **@omit-design/engine** — runtime modules shipped as TypeScript source (consumer compiles): `registry`, `discovery` (path-flexible glob), `inspect` overlay, `theme-editor`, `capture` (FigmaNode JSON exporter), and `shell` (workspace UI). Pure UI library — no router boot, no module-level side effects.
- **@omit-design/eslint-plugin** — three hard rules: `no-design-literal` (forbid raw colors / sizes), `no-non-whitelist-import` (only `Om*` components), `require-pattern-header` (each design file declares its pattern).
- **@omit-design/preset-mobile** — 21 `Om*` components, `--om-*` token map (Ionic 8 runtime), 8 patterns + 8 `.tmpl.tsx` scaffolds.
- **@omit-design/figma-plugin** — Figma plugin that consumes `FigmaNode` JSON exported from engine `capture` and creates Frames in Figma. Distributed as both an npm package and a `omit-web-to-figma.zip` for manual install in Figma desktop.
