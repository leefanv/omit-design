# @omit-design/engine

> Runtime modules for [omit-design](https://github.com/leefanv/omit-design): registry, glob discovery, inspect overlay, theme editor, capture (FigmaNode JSON), shell. Pure UI library — no router boot, no module-level side effects.

This package ships **TypeScript source** (no build). Consumers must run a TS-aware bundler (Vite is the default in projects scaffolded by `@omit-design/cli`).

## Install

```bash
npm install @omit-design/engine
# peer deps
npm install react react-dom react-router-dom
```

## Subpath exports

| Import | Use |
|---|---|
| `@omit-design/engine/shell` | Workspace shell UI (sidebar / right panel / device toolbar) |
| `@omit-design/engine/registry` | Pattern registry — register / lookup design files |
| `@omit-design/engine/discovery` | `globDiscovery()` — collect designs via `import.meta.glob` |
| `@omit-design/engine/preset` | Preset manifest types |
| `@omit-design/engine/capture` | DOM → FigmaNode JSON exporter |
| `@omit-design/engine/inspect/*` | Hover-overlay inspect for `Om*` elements |
| `@omit-design/engine/theme-editor/*` | Theme variable editor + CSS download |

A typical project never imports engine directly — `@omit-design/cli init` wires it up via the scaffold. Use this README when authoring custom presets or shells.

## License

MIT
