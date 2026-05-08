# Architecture

How omit-design's pieces fit together. For new contributors and people writing custom presets / shells.

## High-level dependency graph

```
                       ┌─────────────────────────┐
                       │  @omit-design/cli       │  ← published binary; installs templates
                       │  (init / dev / lint /   │
                       │   new-page / upgrade)   │
                       └────────────┬────────────┘
                                    │ scaffolds projects that depend on:
                                    ▼
       ┌─────────────────────────┐     ┌─────────────────────────────┐
       │ @omit-design/           │     │ @omit-design/               │
       │   eslint-plugin         │     │   preset-mobile             │
       │   (3 hard rules)        │     │   (Om* + tokens + patterns) │
       └─────────────────────────┘     └────────────┬────────────────┘
                                                    │ peerDependency (type-only)
                                                    ▼
                                        ┌─────────────────────────┐
                                        │ @omit-design/engine     │
                                        │   shell / registry /    │
                                        │   discovery / inspect / │
                                        │   capture / theme-edit  │
                                        └────────────┬────────────┘
                                                     │ produces
                                                     ▼
                                        ┌─────────────────────────┐
                                        │ FigmaNode JSON          │
                                        └────────────┬────────────┘
                                                     │ consumed by
                                                     ▼
                                        ┌─────────────────────────┐
                                        │ @omit-design/            │
                                        │   figma-plugin           │
                                        │   (in Figma desktop)     │
                                        └─────────────────────────┘
```

There are no runtime cycles. The only inter-package dependency at runtime is the type-only one from `preset-mobile` to `engine` (catalog and preset manifest types).

## Three-layer AI constraint

| Layer | What it constrains | How |
|---|---|---|
| **Skills** | Process / decisions | Natural-language `<HARD-GATE>` markers + references for progressive disclosure. Loaded by Claude Code automatically when triggers match. |
| **ESLint** | Code shape | Three deterministic rules: no design literals, whitelist imports, mandatory pattern header. `npm run lint` fails CI when violated. |
| **Templates** | Starting structure | Per-pattern `.tmpl.tsx` skeletons. Agent copies a template and replaces placeholders rather than inventing structure. |

Together these turn AI design output from "please don't break the conventions" into a deterministic gate.

## Engine modules

```
@omit-design/engine
├── registry/         Provider + hooks (useProjects / useProject / useProjectByHref)
│                     Type: DesignEntry, DesignGroup, DiscoveredProject
├── discovery/        globDiscovery({ project, modules }) → DesignSource
│                     Path convention: design/<group>/<file>.tsx → /designs/<group>/<file>
├── preset/           PresetManifest types, createTokenMap
├── capture/          captureTree(root) → FigmaNode JSON
│                     ExportFigmaDialog, EmbedCaptureBridge
├── inspect/          Hover / measure / a11y overlays
│                     InspectOverlay, InspectInspector, InspectStore
├── theme-editor/     Token-graph editor backing /workspace/:id/theme-editor
└── shell/            Workspace UI
    ├── DesignFrame   Single-design route shell (/designs/*)
    ├── StudioIndex   ProjectsHome + ProjectDetail (canvas)
    ├── RightPanel    Floating-card panel for inspect/theme tools
    ├── ThemeEditorPage  Full-screen theme editor route
    └── canvas/       SinglePageCanvas, EntryPicker, ToolRail, CanvasHUD,
                      useCanvasStore (zoom/pan/active tool/picker pinned)
```

### Single-page canvas (since 0.2.0)

The `/workspace/:projectId` route is a Figma-style canvas. Key design choices:

- **Single design rendered, not tiled.** Earlier 0.2 dev iterations tried tile-grid with capture-iframe thumbnails — too expensive for large projects (one Ionic instance per tile during capture). Replaced with single-page canvas + a left picker. User picks a page, the page renders directly in the host React tree (no iframe, no html-to-image).
- **Stage transform via ref, not React state.** Pan/zoom updates `stageRef.current.style.transform` imperatively. React reconciliation only happens on tool change / page selection / panel open — not on every wheel event.
- **Wheel + pointer rAF-coalesced.** High-frequency events (60+/s) collapse into one store update per frame.
- **Inspect tools split.** Inspect / Measure / A11y are independent ToolRail buttons. Activating any of them sets `inspectStore.mode` + opens the right panel. This replaced the older "single inspect tool with mode segmented control inside the panel".

### Class-name stability

Engine 0.x bumps minor (not patch) for class-name removals. The `omit-design upgrade` CLI command keeps a data-driven `LEGACY_TOKENS` table that grows with each release; running `upgrade` greps the user's project for any of these tokens and prints migration suggestions.

Today's table (after 0.2.0):
- `shell-device-screen` / `__notch` / `__statusbar*` → removed (no replacement, mockup gone)
- `shell-device-content` → `.canvas-page-frame` or `.shell-design-frame`
- `shell-right-panel__tabs` / `__tab*` → `.shell-right-panel__head` (single title)
- `shell-studio__layout` / `__toc` / `__main` / `__group` / `__grid` / `__card` / `__thumb` / `__meta` → `.canvas-*` family

## Capture pipeline

```
DOM tree at design route   ──capture──►   FigmaNode JSON   ──download──►   user's machine
   (live React render)      (capture/)     (in-memory)        (browser)
                                                                  │
                                                                  ▼ user opens Figma plugin
                              ┌─────────────────────────────────────────────────────┐
                              │  @omit-design/figma-plugin (Figma desktop runtime)  │
                              │    ui.html receives JSON via drop / file input     │
                              │    code.js walks tree → figma.createFrame / Text   │
                              └─────────────────────────────────────────────────────┘
```

### Why JSON, not a live API?

- **No outbound calls from the plugin.** `manifest.json` declares `networkAccess.allowedDomains = ["none"]`. All bytes (images, fonts) are pre-baked to data URLs in the capture step, which runs in the user's browser with full origin access.
- **Round-trip works offline.** No keys, no auth, no servers. JSON moves over the local filesystem.
- **Plugin code can be inspected by the user.** Manual install means users can read every line of `code.js` before granting Figma access.

## Repo layout

```
omit-design/
├── packages/                Published packages (workspaces)
│   ├── cli/                 @omit-design/cli  (CLI binary; templates inline)
│   ├── engine/              @omit-design/engine  (source-shipped, no build)
│   ├── eslint-plugin/       @omit-design/eslint-plugin
│   ├── preset-mobile/       @omit-design/preset-mobile  (source-shipped)
│   └── figma-plugin/        @omit-design/figma-plugin  (ships .zip too)
├── examples/
│   └── playground/          Local preview app — workspaces-linked to packages/*
├── skills/                  Claude Code skills (synced to init scaffold)
├── templates/init/          Source of truth for the init scaffold
├── docs/                    Public docs (you're here)
└── scripts/                 Build / sync helpers
```

`scripts/sync-skills.mjs` mirrors `skills/` into `packages/cli/templates/init/.claude/skills/` so the published CLI carries the latest skill versions.

## Versioning policy

- **engine + preset-mobile** lockstep on minor (when one changes class names or peer constraints, the other follows).
- **cli** versions independently; bumps when its own source or its bundled templates change.
- **eslint-plugin** versions independently; bumps when rule semantics change.
- **figma-plugin** versions independently; bumps when plugin code changes.

Pre-1.0: minor bumps may include breaking changes; patch bumps don't. Once we hit 1.0, full SemVer.

## Source-shipping rationale

`engine` and `preset-mobile` ship `.ts` source via the `exports` field, no compiled `dist/`. Why:

| Trade | Win |
|---|---|
| Smaller package size | Source-map UX in consumer dev tools |
| Single bundler config to test | No double-compile artifacts in node_modules |
| Pre-1.0 churn happens in source, not in build outputs | Easier `git bisect` for users |

Cost: consumers must run a TS-aware bundler. In practice, Vite is the default in scaffolded projects, so this hasn't been an issue.

Once 1.0 is in sight we may add a published `dist/` track for environments without TS-aware bundlers (Webpack 4, plain Node).
