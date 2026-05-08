# Audit check item details

The main `SKILL.md` only lists check titles. This file expands the concrete rule and exceptions for each item.

## 1. First-line pattern annotation

The first line of the file must be `// @pattern: <name>`, where `name` must appear in `node_modules/@omit-design/preset-mobile/PATTERNS.md`.

Enforced by the ESLint rule `omit-design/require-pattern-header`. Files with kebab-case names (e.g. `order-list.tsx`) are page designs and are checked; files with PascalCase names (e.g. `MemberShell.tsx`) are shells / components and are exempt.

## 2. Import whitelist

Business `.tsx` files (`design/**/*.tsx`) may only import:

- `@omit-design/preset-mobile` and its subpaths.
- React family: `react`, `react-dom`, `react-router`, `react-router-dom`.
- Icon constants: `ionicons/icons`.
- Named imports from `@ionic/react`, restricted to: `IonList`, `IonBackButton`, `IonIcon`.
- Same-directory / parent-directory relative paths (used for importing `mock/` data or in-project shells).

Enforced by the ESLint rule `omit-design/whitelist-ds-import`.

If a page uses `@ionic/react` visual components beyond the exceptions above → tell the user: either add an Om* wrapper in `@omit-design/preset-mobile` (upstream PR), or expand the whitelist (with caution).

## 3. No color literals

Forbidden: `#hex`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, named colors appearing in `style=` literals or in `className` strings. Allowed: `var(...)` / `inherit` / `currentColor` / `transparent` / `0` / `auto` / `none` / percentages.

Enforced by the ESLint rule `omit-design/no-design-literal` (including a lenient search of CSS text inside template strings).

## 4. No spacing / font-size literals

Forbidden: things like `padding: 16`, `marginTop: '12px'`, `fontSize: 14` appearing in `style={{...}}`. Use tokens (`var(--om-spacing-*)`, etc.) or component props (`<OmPage padding="lg">`) instead.

Enforced by the ESLint rule `omit-design/no-design-literal` (regex on the `px` suffix).

## 5. Whitelisted components exist

Every `<OmXxx />` must appear in the export list of `@omit-design/preset-mobile/components/index.ts`. **The audit flow** performs this extra check (ESLint does not directly verify JSX tag resolution); severity is hint — prompt the user to add an Om* wrapper (upstream PR).
