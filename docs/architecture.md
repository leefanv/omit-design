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
       │   eslint-plugin         │◄────│   preset-mobile             │
       │   (4 hard rules)        │     │   (Om* components + tokens) │
       │                         │     │                             │
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

Patterns are **project-local** — they live in the consuming project's `patterns/<id>/`, not in any package. `eslint-plugin`'s `require-pattern-components` rule reads `<cwd>/patterns/<id>/pattern.json` at lint-time, so projects can ship arbitrary pattern catalogs without bumping any `@omit-design/*` package.

## Four-layer AI constraint

| Layer | What it constrains | How |
|---|---|---|
| **Skills** | Process / decisions | Natural-language `<HARD-GATE>` markers + references for progressive disclosure. Catalog organized into entry / make / deliver phases. Loaded by Claude Code automatically when triggers match. |
| **ESLint** | Code shape | Four deterministic rules: no design literals, whitelist imports, mandatory pattern header, pattern-scoped component requirements (declared `@pattern: X` must import one of X's signature components per `<project>/patterns/X/pattern.json`'s `whitelist`). `npm run lint` fails CI when violated, and the husky pre-commit hook runs the same check on every staged file. |
| **Templates** | Starting structure | Per-pattern `template.tmpl.tsx` skeletons under `<project>/patterns/<id>/`. `new-design` copies the template and replaces placeholders rather than inventing structure. |
| **Sub-agents** (optional) | Context isolation | `.claude/agents/pattern-applier.md` (Sonnet) and `audit-reviewer.md` (Haiku) run heavy work — template-application and full-repo lint+a11y scan respectively — in their own context. Main conversation stays focused on user dialogue. Skills detect their presence and delegate; if absent, the skills do the work inline. |

Together these turn AI design output from "please don't break the conventions" into a deterministic gate.

## Init scaffolding (since 0.2.0)

`omit-design init <name>` produces a project that's self-defending without the user wiring anything:

```
<name>/
├── .git/                          ← `git init` runs automatically (gated by --no-git)
├── .husky/
│   └── pre-commit                 ← `npx lint-staged` (installed via husky `prepare` script)
├── .claude/
│   ├── settings.json              ← deny rules: AI cannot Edit/Write app/, eslint.config.js,
│   │                                vite.config.ts, tsconfig.json, .husky/, package.json
│   ├── skills/                    ← entry / make / deliver skills (synced from /skills)
│   └── agents/                    ← pattern-applier.md, audit-reviewer.md (synced from /agents)
├── design/welcome.tsx             ← starter page
├── eslint.config.js               ← all 4 hard rules wired up
└── package.json                   ← husky + lint-staged in devDeps; lint-staged config inline
```

The deny list is intentional friction: when AI hits it, the permission prompt usually means a real skill (e.g. `add-pattern`) should be handling the change instead of editing the file directly. For solo designers we ship a single profile (no strict/lean modes) — keeps decisions out of the way.

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
├── agents/                  Claude Code sub-agents (synced to init scaffold)
├── templates/init/          Source of truth for the init scaffold
├── docs/                    Public docs (you're here)
└── scripts/                 Build / sync helpers
```

`packages/cli/scripts/copy-templates.mjs` (run by `bun --cwd packages/cli run build`) copies three sources into `packages/cli/templates/init/`:
- `templates/init/` → the scaffold base (vite config, sample design, husky hook, settings.json)
- `skills/` → `.claude/skills/`
- `agents/` → `.claude/agents/`

So the published CLI tarball always carries the latest skills + agents.

## Versioning policy

- **engine + preset-mobile** lockstep on minor (when one changes class names or peer constraints, the other follows).
- **cli** versions independently; bumps when its own source or its bundled templates change.
- **eslint-plugin** versions independently; bumps when rule semantics change. `require-pattern-components` reads `<cwd>/patterns/<id>/pattern.json` at lint-time, so rule changes don't require a `preset-mobile` bump.
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
