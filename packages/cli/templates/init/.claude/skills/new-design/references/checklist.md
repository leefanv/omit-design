# new-design execution checklist (full flow)

The main `SKILL.md` covers the HARD-GATE and trigger conditions. This file expands every step in detail.

## 1. Read the PRD; identify 5 things

- Page name + route (`/designs/<groupId>/<filename>`).
- **Chosen pattern** (must be a directory under `<project>/patterns/`).
- Key fields.
- Key states (empty / loading / error / success).
- Primary action (placed at the bottom / top / inline).

## 2. Read the project's `patterns/`

List `<project>/patterns/`. Each subdirectory `<name>/` has:

- `pattern.json` — `{ "name", "whitelist": [...], "description" }`
- `README.md` — when to use, when NOT to use
- `template.tmpl.tsx` — the TSX skeleton to copy

Cases:

- **Empty `patterns/`** →
  - PRD provided → invoke `/distill-patterns-from-prd` first; resume from step 1 after the user approves the files it creates.
  - No PRD → invoke `/add-pattern` in **conversational mode** (5 fixed questions → minimal pattern); resume from step 1 after approval.
- **No fitting pattern** for the PRD → call `add-pattern` skill. After it produces a new `<project>/patterns/<new>/`, resume from step 1 with that pattern selected.
- **A fitting pattern exists** → continue.

## 3. Check the component whitelist

Open `node_modules/@omit-design/preset-mobile/components/index.ts` and confirm every component the PRD needs is exported.

Cross-check against the chosen pattern's `whitelist` field — your design file MUST import at least one of those (lint will reject otherwise).

If a needed component is missing from preset → **stop and tell the user**. Propose either using `add-pattern` to scope around the gap or adding a single whitelisted component upstream. **Never** bypass the whitelist by importing visual components directly from `@ionic/react`.

## 4. Prepare mock data

- Add a file under `mock/` or extend an existing one (the project-root `mock/`).
- Field types should match the PRD.
- At least 3–5 entries covering different states.
- Business pages import via relative paths, e.g. `import { items } from "../mock/orders"`.

## 5. Copy the template, then replace placeholders

1. Read `<project>/patterns/<pattern>/template.tmpl.tsx`.
2. Copy to the target location `design/[<groupId>/]<filename>.tsx`.
3. Replace `TODO` placeholders and example fields with business content.

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
