# @omit-design/preset-mobile

> Default mobile preset for [omit-design](https://github.com/leefanv/omit-design): `Om*` whitelist components, `--om-*` token system, Ionic 8 runtime.

[![npm](https://img.shields.io/npm/v/@omit-design/preset-mobile)](https://www.npmjs.com/package/@omit-design/preset-mobile)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

[简体中文](./README.zh-CN.md)

## What it is

`preset-mobile` is the canonical preset most omit-design projects use. It provides:

- **21 `Om*` components** — the import whitelist for `design/**/*.tsx`
- **`--om-*` token system** mapped to Ionic 8 runtime (`--ion-*`)
- **Semantic color list + theme baseline** — consumed by the workspace's theme-editor

Patterns are **project-local** and live under `<project>/patterns/`. They are produced on demand by `/distill-patterns-from-prd` or `/add-pattern` — see [PATTERNS.md](./PATTERNS.md).

## Four hard rules (enforced by [@omit-design/eslint-plugin](../eslint-plugin/))

1. **Tokens only.** All colors / spacing / font sizes / radii / shadows must go through tokens. Raw literals (`#FF6B00`, `12px`, `16px`, etc.) are forbidden in business code.
2. **Whitelist imports.** Business pages (under `design/**`) can only import from `@omit-design/preset-mobile`. Direct `@ionic/react` imports are forbidden — exceptions: `IonList`, `IonBackButton`, `IonIcon` (layout / icon hosts only).
3. **Pattern header.** Every business page must start with `// @pattern: <name>`, where `<name>` is registered in [PATTERNS.md](./PATTERNS.md).
4. **Pattern-scoped components.** The declared pattern must actually use one of its signature components. The whitelist for each pattern lives in `<project>/patterns/<id>/pattern.json` — patterns are project-local, not shipped here.

## Components (21)

All exported from `@omit-design/preset-mobile`:

| Layout | Inputs | Display | Overlays |
|---|---|---|---|
| `OmPage` | `OmInput` | `OmCard` | `OmDialog` |
| `OmHeader` | `OmSelect` | `OmListRow` | `OmSheet` |
| `OmAppBar` | `OmSearchBar` | `OmStatCard` | |
| `OmTabBar` | `OmNumpad` | `OmMenuCard` | |
| | `OmButton` | `OmProductCard` | |
| | | `OmCouponCard` | |
| | | `OmSettingRow` | |
| | | `OmEmptyState` | |
| | | `OmTag` | |
| | | `OmOrderFooter` | |

Full source list: [components/index.ts](./components/index.ts).

## Patterns

Patterns are **project-local** — they live in `<project>/patterns/`, not in this package. New projects start with an empty `patterns/` directory.

Three creation paths:

| Path | Trigger |
|---|---|
| **`/distill-patterns-from-prd`** | You have a PRD. The skill scans existing patterns for reuse and writes new ones for the gaps. Use the **Distill patterns from this PRD** button in the workspace PRDs tab. |
| **`/add-pattern`** conversational | No PRD yet. `new-design` auto-invokes this when `patterns/` is empty: 5 short questions → one minimal pattern. |
| **Manual** | Workspace **Library → Patterns → + New**, fill the four fields by hand. |

See [PATTERNS.md](./PATTERNS.md) for file layout and editing semantics.

## Token naming

| Family | Examples |
|---|---|
| `--om-color-*` | `--om-color-primary`, `--om-color-text`, `--om-color-text-muted` |
| `--om-spacing-*` | `--om-spacing-xs` (4) … `--om-spacing-xxl` (32) |
| `--om-radius-*` | `--om-radius-sm`, `--om-radius-md`, `--om-radius-lg` |
| `--om-font-size-*` | `--om-font-size-sm`, `--om-font-size-md`, `--om-font-size-lg` |
| `--om-shadow-*` | `--om-shadow-sm`, `--om-shadow-md` |

Defaults defined in [theme/variables.css](./theme/variables.css). Override in your project's CSS:

```css
:root {
  --om-color-primary: #ff6b00;
  --om-radius-md: 8px;
}
```

Or use the in-browser theme editor at `/workspace/:projectId/theme-editor` (writes back to your `preset/theme.css`).

## Install

```bash
npm install @omit-design/preset-mobile @omit-design/engine @ionic/react ionicons
```

Required peers: `@omit-design/engine ^0.2.0`, `@ionic/react ^8`, `ionicons ^7 || ^8`, `react ^19`, `react-router-dom ^6`.

## Usage

```tsx
// design/main/welcome.tsx
// @pattern: welcome-view
export const meta = {
  name: "Welcome",
  pattern: "welcome-view",
  description: "First-launch screen",
} as const;

import { OmButton, OmPage } from "@omit-design/preset-mobile";

export default function Welcome() {
  return (
    <OmPage padding="none">
      <div style={{ padding: "var(--om-spacing-xl)" }}>
        <h1>Hello</h1>
        <OmButton expand="block">Continue</OmButton>
      </div>
    </OmPage>
  );
}
```

## License

[MIT](../../LICENSE)
