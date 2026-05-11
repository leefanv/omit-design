# @omit-design/eslint-plugin

> Four hard rules for [omit-design](https://github.com/leefanv/omit-design) business pages. Where AI-collaborative design correctness gets enforced.

[![npm](https://img.shields.io/npm/v/@omit-design/eslint-plugin)](https://www.npmjs.com/package/@omit-design/eslint-plugin)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

These four rules are **the** enforcement boundary for AI-collaborative design composition. They keep design files predictable enough that an agent (or a human reviewer) can read, edit, and reason about them without surprises.

## Rules

| Rule | Forbids | Use instead |
|---|---|---|
| `omit-design/no-design-literal` | Raw colors / sizes / spacing in design files | `var(--om-*)` tokens |
| `omit-design/whitelist-ds-import` | Imports outside the design-system whitelist | `@omit-design/preset-mobile` (`Om*` components) + a few layout-only Ionic components |
| `omit-design/require-pattern-header` | Files without a `// @pattern: <name>` first-line comment | Add the header; `<name>` must exist as a directory under your project's `patterns/` |
| `omit-design/require-pattern-components` | Files declaring `@pattern: X` but importing none of X's signature components | Import at least one component listed in `<project>/patterns/X/pattern.json` `whitelist` |

### Example violations

```tsx
// ❌ no-design-literal
<div style={{ color: "#FF6B00", padding: "12px" }} />
//          ↑ literal hex          ↑ literal px

// ❌ whitelist-ds-import
import { IonButton } from "@ionic/react";
//       ↑ outside whitelist; use OmButton from @omit-design/preset-mobile

// ❌ require-pattern-header
import { OmPage } from "@omit-design/preset-mobile";  // ← file's first line
//   ↑ missing `// @pattern: <name>` above this line

// ❌ require-pattern-components
// @pattern: list-view
import { OmCard, OmPage } from "@omit-design/preset-mobile";
//       ↑ list-view requires OmListRow / OmCouponCard / OmSettingRow /
//         OmProductCard / OmMenuCard / OmEmptyState — none imported.
```

```tsx
// ✅ all four rules pass
// @pattern: detail-view
import { OmCard, OmHeader, OmPage } from "@omit-design/preset-mobile";
//       ↑ OmCard is in patterns/detail-view/pattern.json's whitelist

export default function OrderDetail() {
  return (
    <OmPage padding="none" header={<OmHeader title="Order" />}>
      <OmCard>
        <span style={{ color: "var(--om-color-text)", padding: "var(--om-spacing-md)" }}>
          ¥58
        </span>
      </OmCard>
    </OmPage>
  );
}
```

## Install

```bash
npm install -D @omit-design/eslint-plugin eslint
```

## Usage (flat config)

```js
// eslint.config.js
import omit from "@omit-design/eslint-plugin";

export default [
  {
    // The four hard rules ONLY apply to design files.
    // Don't enforce them on app shell / mock data / preset overrides.
    files: ["design/**/*.tsx"],
    plugins: { "omit-design": omit },
    rules: {
      "omit-design/no-design-literal": "error",
      "omit-design/whitelist-ds-import": [
        "error",
        { presets: ["@omit-design/preset-mobile"] },
      ],
      "omit-design/require-pattern-header": "error",
      "omit-design/require-pattern-components": "error",
    },
  },
];
```

Projects scaffolded by `@omit-design/cli init` already include this config — and a husky pre-commit hook so the same check runs on every `git commit`.

## Configuration

### `whitelist-ds-import`

```js
{
  presets: ["@omit-design/preset-mobile"],   // declared design-system entries
  // Ionic exceptions (layout / icon hosts only)
  allowedIonic: ["IonList", "IonBackButton", "IonIcon"],
}
```

To add another preset (e.g. `@omit-design/preset-desktop` once it lands), just append to `presets`.

### `no-design-literal`

Detects hex colors, RGB/RGBA strings, and pixel values inside JSX `style={...}` props and CSS-in-JS template literals. Allows:

- Numbers in non-style contexts (`<div data-x={12}>`)
- `0`, `auto`, `inherit`, `currentColor`
- Anything inside `var(--om-*)` (tokens are by design)
- Test files (configurable via overrides)

### `require-pattern-header`

Looks for the first non-blank line. If it's not `// @pattern: <name>`, error. The plugin doesn't validate `<name>` against any registry — that's the next rule's job.

### `require-pattern-components`

Reads the `@pattern: X` header, then walks `<cwd>/patterns/*/pattern.json` to find the pattern's `whitelist` — the "signature components" without which the file cannot meaningfully be that pattern. Errors if the file imports none of them.

Each pattern is a directory under your project's `patterns/`:

```
patterns/list-view/pattern.json:
{
  "name": "list-view",
  "whitelist": ["OmListRow", "OmCouponCard", "OmSettingRow", "OmProductCard", "OmMenuCard", "OmEmptyState"],
  "description": "Vertically-scrolling list of homogeneous items."
}
```

`whitelist` is **any-of** — importing one entry passes. Stops AI from declaring `@pattern: list-view` and writing a single `OmCard`.

If the file's pattern name has no matching `patterns/<name>/pattern.json` → reports an error pointing the user to `/distill-patterns-from-prd` or `/add-pattern`. Patterns are project-local — they are produced on demand, not shipped centrally.

## Why hard rules?

Soft conventions ("please use tokens", "we generally avoid …") fail under AI generation. The model writes plausible-looking code that violates the convention silently, and review-burden creeps up. Hard rules turn the convention into a deterministic gate: `npm run lint` exits non-zero, the agent loops, the violation gets fixed before review.

## License

[MIT](../../LICENSE)
