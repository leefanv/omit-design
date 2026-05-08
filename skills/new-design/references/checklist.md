# new-design execution checklist (full flow)

The main `SKILL.md` covers the HARD-GATE and trigger conditions. This file expands every step in detail.

## 1. Read the PRD; identify 5 things

- Page name + route (`/designs/<groupId>/<filename>`).
- **Chosen pattern** (must appear in `node_modules/@omit-design/preset-mobile/PATTERNS.md`).
- Key fields.
- Key states (empty / loading / error / success).
- Primary action (placed at the bottom / top / inline).

## 2. Read the preset's PATTERNS.md

`node_modules/@omit-design/preset-mobile/PATTERNS.md` — 8 patterns; each has "Purpose", "Skeleton", "Template", and "When not to use".

## 3. Check the component whitelist

Open `node_modules/@omit-design/preset-mobile/components/index.ts` and confirm every component the PRD needs is exported.

If a component is missing → **stop and tell the user**. Propose either using `add-pattern` first or adding a single whitelisted component. **Never** bypass the whitelist by importing visual components directly from `@ionic/react`.

## 4. Prepare mock data

- Add a file under `mock/` or extend an existing one (the project-root `mock/`).
- Field types should match the PRD.
- At least 3–5 entries covering different states.
- Business pages import via relative paths, e.g. `import { items } from "../mock/orders"`.

## 5. Copy the template, then replace placeholders

Prefer the template path:

1. Read `node_modules/@omit-design/preset-mobile/templates/<pattern>.tmpl.tsx`.
2. Copy to the target location `design/[<groupId>/]<filename>.tsx`.
3. Replace `TODO` placeholders and example fields with business content.

Fallback when the template is missing:
- Rewrite from the "Skeleton" description in PATTERNS.md.
- Do not invent imports or component structure out of thin air.

Constraints:
- **First line**: `// @pattern: <pattern-name>`.
- **Imports may only** come from: `@omit-design/preset-mobile`, `react`, `react-router(-dom)`, `ionicons/icons`, the whitelisted Ionic containers (`IonList` / `IonBackButton` / `IonIcon`), or relative paths.
- **No** literal colors / spacings / font sizes — use `var(--om-*)` or Om* component props.

## 6. Auto-registration (no manual route changes)

omit-design uses `import.meta.glob` to auto-discover `design/**/*.tsx`; adding a file is enough. The group comes from the first path segment (e.g. `design/orders/detail.tsx` → group=orders).

## 7. Self-check

- Run `npm run lint`; it must pass (0 violations).
- Visit the new route on the dev server: `/designs/<group>/<file>`.
- Describe the visual to the user (or attach a screenshot).
