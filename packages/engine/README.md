# @omit-design/engine

> Runtime modules for [omit-design](https://github.com/leefanv/omit-design): registry, glob discovery, inspect overlay, theme editor, capture (FigmaNode JSON), and the canvas-style workspace shell. Pure UI library — no router boot, no module-level side effects.

[![npm](https://img.shields.io/npm/v/@omit-design/engine)](https://www.npmjs.com/package/@omit-design/engine)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

A typical project never imports engine directly — `@omit-design/cli init` wires everything up via the scaffold. This README is for authors of custom presets, custom shells, or anyone curious how the pieces fit together.

> **Source-shipped.** This package's `main` / `exports` point at `.ts` files. Consumers must run a TS-aware bundler (Vite is the default in projects scaffolded by `@omit-design/cli`).

## Install

```bash
npm install @omit-design/engine react react-dom react-router-dom
```

`react ^19`, `react-dom ^19`, `react-router-dom ^6` are peer dependencies.

## Subpath exports

| Import | What it is |
|---|---|
| `@omit-design/engine/shell` | Canvas-style workspace UI: `DesignFrame` (single-design route), `ProjectsHome`, `ProjectDetail` (multi-page canvas), `ThemeEditorPage`, plus the canvas primitives `SinglePageCanvas` / `EntryPicker` / `ToolRail` / `useCanvasStore`. |
| `@omit-design/engine/registry` | `EngineRoot` provider + `useProjects` / `useProject` / `useProjectByHref` / `useProjectGroups` hooks. Type-only: `DesignEntry`, `DesignGroup`, `DiscoveredProject`. |
| `@omit-design/engine/discovery` | `globDiscovery({ project, modules })` — feed in a `import.meta.glob` result, get a `DesignSource` for `EngineRoot`. |
| `@omit-design/engine/preset` | `PresetManifest` types, `createTokenMap`. |
| `@omit-design/engine/capture` | `captureTree(root, opts)` — DOM → FigmaNode JSON for the figma-plugin to consume. |
| `@omit-design/engine/inspect/*` | Hover/measure/a11y overlay primitives (used internally by the shell's tool rail). |
| `@omit-design/engine/theme-editor/*` | Token editor backing the `/workspace/:projectId/theme-editor` route. |

## Minimal app wiring

This is what `@omit-design/cli init` generates — adapt for custom shells:

```tsx
// app/main.tsx
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { EngineRoot } from "@omit-design/engine/registry";
import { globDiscovery, type DesignModule } from "@omit-design/engine/discovery";
import { presetMobileManifest } from "@omit-design/preset-mobile/preset.manifest";
import "@omit-design/preset-mobile";
import App from "./App";

const designModules = import.meta.glob<DesignModule>("/design/**/*.tsx", { eager: true });

const source = globDiscovery({
  project: {
    id: "my-app",
    name: "My App",
    description: "Demo",
    icon: "🎨",
    preset: presetMobileManifest,
    groups: [{ id: "main", label: "Main" }],
  },
  modules: designModules,
});

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <EngineRoot source={source}>
      <App />
    </EngineRoot>
  </BrowserRouter>
);
```

```tsx
// app/App.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import { IonApp, setupIonicReact } from "@ionic/react";
import {
  DesignFrame, ProjectsHome, ProjectDetail, ThemeEditorPage,
} from "@omit-design/engine/shell";
import { useProjects } from "@omit-design/engine/registry";
import "@ionic/react/css/core.css";
// ...

setupIonicReact({ mode: "ios" });

function DesignRoutes() {
  const projects = useProjects();
  return (
    <Routes>
      {projects.flatMap((p) => p.entries).map((e) => {
        const Cmp = e.component;
        const rel = e.href.replace(/^\/designs\//, "");
        return <Route key={e.href} path={rel} element={<Cmp />} />;
      })}
    </Routes>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/workspace" />} />
      <Route path="/workspace" element={<ProjectsHome />} />
      <Route path="/workspace/:projectId" element={<ProjectDetail />} />
      <Route path="/workspace/:projectId/theme-editor" element={<ThemeEditorPage />} />
      <Route path="/designs/*" element={<DesignFrame><IonApp><DesignRoutes /></IonApp></DesignFrame>} />
    </Routes>
  );
}
```

## Canvas shell (since 0.2.0)

The `/workspace/:projectId` route renders a Figma-style canvas:

```
┌─ Header (transparent, pill buttons) ─────────────────────────────┐
│ ← / 🎨 Project ▾                          ⚙ / 🎨 / Export Figma │
├──────┬─────────────┬──────────────────────────────────┬──────────┤
│      │ EntryPicker │ Canvas viewport                  │  RightP  │
│ Tool │ (groups +   │ (zoom/pan, single design page    │  (only   │
│ Rail │  pages,     │   rendered directly — no iframe) │  when    │
│      │  pinned/    │                                  │  inspect/│
│      │  floating)  │                                  │  measure/│
│      │             │                                  │  a11y/   │
│ 56px │ 240/280px   │   flex                           │  theme)  │
└──────┴─────────────┴──────────────────────────────────┴──────────┘
```

**ToolRail** (left, 62px dark floating capsule):
- `move` (V) — select tile / navigate
- `hand` (H) — drag-to-pan
- `inspect` (I) — DOM overlay + Inspector right panel
- `measure` (M) — anchor + hover distance overlay
- `a11y` (A) — touch-target + alt-text scan
- `comment` (C) — placeholder

**EntryPicker** has a pin/float toggle. Pinned: 240px column always visible. Floating: 280px popover triggered by header `≡ Pages` button. Pin state is per-project, persisted via `useCanvasStore`.

**SinglePageCanvas**: the active design renders directly into the host React tree (no iframe, no html-to-image). Stage transform is applied imperatively via ref to avoid React reconciliation on every pan event. Wheel + pointer events are rAF-coalesced.

### Wiring custom tools

```tsx
import { ToolRail, useCanvasStore, type CanvasTool } from "@omit-design/engine/shell";

const MY_TOOLS: { id: CanvasTool; icon: string; label: string; shortcut: string }[] = [
  { id: "move", icon: "↖", label: "Select", shortcut: "V" },
  { id: "hand", icon: "✋", label: "Pan", shortcut: "H" },
  // omit "inspect" / "measure" / "a11y" if you don't want overlays
];

<ToolRail tools={MY_TOOLS} />
```

### Persistence keys

Per-project canvas state (zoom/pan/active tool/picker pin) is persisted to `localStorage[omit-engine-canvas-${projectId}]`, debounced 250 ms. Clearing it resets the canvas to fit-to-content on next mount.

## Module reference

### `registry`

```ts
import { EngineRoot, useProjects } from "@omit-design/engine/registry";

<EngineRoot source={source}>{children}</EngineRoot>

const projects = useProjects();   // DiscoveredProject[]
const project = useProject(id);   // DiscoveredProject | undefined
const groups = useProjectGroups(id);  // DesignGroup[] (entries grouped + sorted)
const matched = useProjectByHref(pathname);  // { project, entry } | null
```

### `discovery`

```ts
import { globDiscovery } from "@omit-design/engine/discovery";

const source = globDiscovery({
  project: { id, name, preset, groups, icon },
  modules: import.meta.glob<DesignModule>("/design/**/*.tsx", { eager: true }),
  pathRoot: "/design",        // default
  defaultGroupId: "main",     // file with no group dir falls here
});
```

Custom discovery sources: implement the `DesignSource` interface and pass to `EngineRoot`.

### `capture`

```ts
import { captureTree } from "@omit-design/engine/capture";

const json = await captureTree(rootEl, {
  route: "/designs/main/welcome",
  name: "Welcome",
  group: { id: "main", label: "Main" },
  projectId: "my-app",
  viewport: { w: 390, h: 844 },
});
// → FigmaNode JSON, consumed by @omit-design/figma-plugin
```

### `inspect`

`InspectOverlay` mounts in the host document. Element whitelist: must sit inside one of `.canvas-page-frame` / `.shell-design-frame` / `.shell-device-content` (legacy). Clicking exits the overlay's path; `Esc` clears selection; arrow keys navigate the tree.

The shell's `RightPanel` reads `inspectStore.mode` and renders `InspectInspector` accordingly. To wire your own panel:

```ts
import { useInspectStore } from "@omit-design/engine/inspect/store";
import { InspectInspector } from "@omit-design/engine/inspect/InspectInspector";

const enabled = useInspectStore((s) => s.enabled);
const mode = useInspectStore((s) => s.mode);  // "inspect" | "measure" | "a11y"
```

### `theme-editor`

`ThemeEditorPage` is a full-screen editor at `/workspace/:projectId/theme-editor`. To embed the panel without the route shell:

```tsx
import { ThemePanel } from "@omit-design/engine/theme-editor/ThemePanel";

<ThemePanel variant="aside" />   // 360px column variant
<ThemePanel variant="page" />    // full-page variant
```

## Versioning

This package follows SemVer with the pre-1.0 caveat that **minor versions may include breaking class-name changes**. The `omit-design upgrade` CLI command scans your project for class names removed in past releases — see [the root CHANGELOG](https://github.com/leefanv/omit-design/blob/main/CHANGELOG.md).

Notable breaking changes by version:

- **0.2.0** — Canvas redesign. Removed: `.shell-device-screen` / `__notch` / `__statusbar*`, `.shell-right-panel__tabs`, `.shell-studio__layout` / `__toc` / `__main` / `__group` / `__grid` / `__card` / `__thumb` / `__meta`. New: `.canvas-*` family, `.shell-pill`, `.shell-right-panel__head`. Run `omit-design upgrade` to detect remaining references.

## License

[MIT](../../LICENSE)
