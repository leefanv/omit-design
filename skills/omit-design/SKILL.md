---
name: omit-design
description: AI-collaborative design composition with omit-design. Use when the user is in an omit-design project (has @omit-design/preset-mobile installed and design/ directory) and asks to add or modify design pages, work with patterns, or audit compliance. Covers the three-layer constraint system (skills + ESLint hard rules + templates) that makes AI-generated UI deterministic.
---

# omit-design

Designs are real, clickable React pages — not images. Every `.tsx` under `design/` is one design page, auto-registered to the route `/designs/<group>/<name>`.

## Three-layer constraint system (the underlying contract — do not bypass)

1. **Skills** — `.claude/skills/<name>/SKILL.md` provides domain knowledge. HARD-GATE blocks wrap critical decision points; violating one means the output is rejected.
2. **ESLint plugin** — `@omit-design/eslint-plugin` ships three hard rules:
   - `no-design-literal`: forbids hex / px / rgb literals; use tokens instead.
   - `whitelist-ds-import`: under `design/`, you may only import `@omit-design/preset-mobile` plus the whitelisted Ionic containers.
   - `require-pattern-header`: the first line of the file must be `// @pattern: <name>`.
3. **Templates** — `node_modules/@omit-design/preset-mobile/templates/<pattern>.tmpl.tsx` ships copy-paste skeletons.

`npm run lint` is the single compliance command (equivalent to `omit-design lint`); it produces an AI-friendly structured summary.

## Which skill to trigger

| What the user says | Skill |
|---|---|
| "Make a page for X" / "add an order detail page" / a PRD is provided | [new-design](../new-design/SKILL.md) |
| "Add a wizard pattern" / existing patterns are not enough | [add-pattern](../add-pattern/SKILL.md) |
| "Is this design compliant?" / "scan the whole repo" | [audit-design](../audit-design/SKILL.md) |
| "How do I init a project?" / "start the server" / "run lint" | [omit-design-cli](../omit-design-cli/SKILL.md) |

## Pattern catalog (8)

`list-view` `detail-view` `form-view` `sheet-action` `dialog-view` `welcome-view` `dashboard` `tab-view`

For concrete skeletons and examples see `node_modules/@omit-design/preset-mobile/PATTERNS.md`.

## Platform conventions

- **`<HARD-GATE>` decision points**: in skills, the critical decision points "AI tends to skip" must be wrapped in `<HARD-GATE>...</HARD-GATE>`; violating one means the output is rejected. HARD-GATE is not decoration — use it only where you must stop.
- **Progressive disclosure via `references/`**: when the main `SKILL.md` exceeds 60 lines, split into `references/<topic>.md`; the main file keeps trigger conditions, decision tree, and HARD-GATE blocks.
- **`design/` is the only directory ESLint constrains**: `mock/`, `app/`, and `preset/` are unconstrained (literals and arbitrary imports are allowed there).

## Counter-examples

- Writing `style={{ color: "#FF6B00" }}` inside `design/*.tsx` — use a token instead.
- Importing `IonButton` directly from `@ionic/react` — use `OmButton`.
- Inventing a pattern name without reading PATTERNS.md.
- Skipping a HARD-GATE.
