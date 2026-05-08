# @omit-design/figma-plugin

> Figma plugin that imports `FigmaNode` JSON exported from [omit-design](https://github.com/leefanv/omit-design)'s engine `capture` runtime, and creates editable Frames in Figma.

[![npm](https://img.shields.io/npm/v/@omit-design/figma-plugin)](https://www.npmjs.com/package/@omit-design/figma-plugin)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

[简体中文](./README.zh-CN.md)

## How the round-trip works

```
TSX design page  ──capture──►  FigmaNode JSON  ──import──►  Figma Frame
   (React)         (engine)      (download)      (this plugin)
```

The plugin is consumer-only: it doesn't talk back to your dev server, fetch remote assets, or call any external API (`networkAccess.allowedDomains = ["none"]`). All image bytes are pre-baked into the JSON as data URLs by the capture step in the browser.

## Install (first time)

**Easiest path** — from your dev server, click **`↗ Export to Figma`** in the workspace header → click **`↓ Download plugin .zip`** in the dialog → unzip → `Plugins → Development → Import plugin from manifest…` in Figma desktop.

**Manual** — clone the repo:

```bash
git clone https://github.com/leefanv/omit-design.git
cd omit-design
bun --filter @omit-design/figma-plugin run build:zip   # produces omit-web-to-figma.zip
unzip packages/figma-plugin/omit-web-to-figma.zip -d ~/omit-web-to-figma
```

Then in Figma desktop: `Plugins → Development → Import plugin from manifest…` → pick `manifest.json`.

After install: `Plugins → Development → Omit Web to Figma`.

## Usage

1. `npm run dev` your omit-design project → open `http://localhost:5173`
2. Go to a project workspace (`/workspace/<projectId>`)
3. Click **`↗ Export to Figma`** → pick a design or "All bundle" → **`↓ Capture & download JSON`**
4. In Figma, run `Plugins → Development → Omit Web to Figma`
5. Drop the JSON file into the plugin window
6. Click **Import** → Frame(s) appear in your current Figma page

## Re-packing the plugin after edits

Edited any of `manifest.json` / `code.js` / `ui.html`?

```bash
bun --filter @omit-design/figma-plugin run build:zip
```

Regenerates `omit-web-to-figma.zip`. The `prepublishOnly` hook also runs this automatically before `npm publish`, so the published tarball can never ship stale.

## What's supported

### Structure
- [x] FRAME nodes (Auto-Layout direction / gap / padding / alignment)
- [x] TEXT nodes (Inter Regular/Medium/Bold + fontSize + lineHeight + color + alignment)
- [x] Recursive children (light DOM + shadow DOM merged)
- [x] CSS pseudo-elements `::before` / `::after` synthesized as child Frames
- [x] `position: absolute/fixed` flagged as `layoutPositioning: ABSOLUTE`
- [x] `opacity` / `overflow: hidden` preserved

### Fills / strokes / radius / shadows
- [x] SOLID fill
- [x] LINEAR_GRADIENT fill (multi-stop + angle / `to <dir>`)
- [x] Stroke (color + width + dashes)
- [x] cornerRadius (per-corner support)
- [x] DropShadow (single / multi-layer)

### Images / vectors
- [x] `<img>` → `figma.createImage(bytes)` + IMAGE fill
- [x] Inline `<svg>` → `figma.createNodeFromSvg(outerHTML)`
- [x] `<ion-icon>` → shadow DOM SVG extracted, `currentColor` resolved against element computed color

### Batch
- [x] Bundle import places multiple frames in a horizontal row

## Known limits

- `background-image: url(...)` is not converted to IMAGE fill — business pages should use `<img>`; shell decoration loses background images but structure is preserved.
- CSS Variables aren't bound to Figma Variables (yet).
- `radial-gradient` / `conic-gradient` aren't supported.
- Re-importing the same design stacks new Frames — no `data-design-id` based replace.
- Plugin can't pull remote images at runtime (`networkAccess.allowedDomains = ["none"]` by design); the capture step in the browser pre-fetches everything to data URLs.

## License

[MIT](../../LICENSE)
