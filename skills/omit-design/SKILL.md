---
name: omit-design
description: AI-collaborative design composition with omit-design. Use when the user is in an omit-design project (has @omit-design/preset-mobile installed and design/ directory) and asks to add or modify design pages, work with patterns, or audit compliance. Covers the four-layer constraint system (skills + ESLint hard rules + pattern-scoped component rule + templates) that makes AI-generated UI deterministic. For "what should I do next?" questions, route through the start skill instead.
---

# omit-design

Designs are real, clickable React pages — not images. Every `.tsx` under `design/` is one design page, auto-registered to the route `/designs/<group>/<name>`.

## When in doubt, route through `/start`

If the user is open-ended ("what now?" / just init'd / unclear intent), invoke the **`start`** skill — it diagnoses project state and recommends one concrete next step. Don't reproduce that routing logic here.

## Four-layer constraint system (the underlying contract — do not bypass)

1. **Skills** — `.claude/skills/<name>/SKILL.md` provides domain knowledge. HARD-GATE blocks wrap critical decision points; violating one means the output is rejected.
2. **ESLint plugin** — `@omit-design/eslint-plugin` ships four hard rules:
   - `no-design-literal`: forbids hex / px / rgb literals; use tokens instead.
   - `whitelist-ds-import`: under `design/`, you may only import `@omit-design/preset-mobile` plus the whitelisted Ionic containers.
   - `require-pattern-header`: the first line of the file must be `// @pattern: <name>`.
   - `require-pattern-components`: the declared pattern must actually import at least one of its signature components (e.g. `@pattern: list-view` requires `OmListRow` / `OmCouponCard` / `OmSettingRow` / `OmProductCard` / `OmMenuCard` / `OmEmptyState`). Mapping lives in `node_modules/@omit-design/preset-mobile/patterns.config.json`.
3. **Templates** — `node_modules/@omit-design/preset-mobile/templates/<pattern>.tmpl.tsx` ships copy-paste skeletons.
4. **Sub-agents (optional, when present in `.claude/agents/`)** — `pattern-applier` writes draft pages in an isolated context; `audit-reviewer` scans the repo and reports violations without polluting the main conversation.

`npm run lint` is the single compliance command (equivalent to `omit-design lint`). It runs automatically on `git commit` (husky pre-commit hook installed by `init`), so violations cannot reach the repo silently.

## The skill catalog (3 phases)

| Phase | Skill | Use when |
|---|---|---|
| **Entry** | [start](../start/SKILL.md) | Open-ended request, fresh init, unclear next step. |
| **Entry** | [omit-design-cli](../omit-design-cli/SKILL.md) | Questions about init / dev / lint / new-page commands. |
| **Make** | [new-design](../new-design/SKILL.md) | "Make a page for X" / a PRD is provided. |
| **Make** | [add-pattern](../add-pattern/SKILL.md) | Existing 8 patterns are not enough. |
| **Deliver** | [audit-design](../audit-design/SKILL.md) | Batch review / "is the whole repo compliant?" |
| **Deliver** | [ship-design](../ship-design/SKILL.md) | Ship one named page (lint + a11y + capture). |

## Pattern catalog (8)

`list-view` `detail-view` `form-view` `sheet-action` `dialog-view` `welcome-view` `dashboard` `tab-view`

For concrete skeletons and examples see `node_modules/@omit-design/preset-mobile/PATTERNS.md`. For required component mapping see `patterns.config.json` in the same directory.

## Platform conventions

- **`<HARD-GATE>` decision points**: in skills, the critical decision points "AI tends to skip" must be wrapped in `<HARD-GATE>...</HARD-GATE>`; violating one means the output is rejected. HARD-GATE is not decoration — use it only where you must stop.
- **Progressive disclosure via `references/`**: when the main `SKILL.md` exceeds 60 lines, split into `references/<topic>.md`; the main file keeps trigger conditions, decision tree, and HARD-GATE blocks.
- **`design/` is the only directory ESLint constrains**: `mock/`, `app/`, and `preset/` are unconstrained (literals and arbitrary imports are allowed there).
- **AI edits stay in `design/` / `mock/` / `preset/`**: `.claude/settings.json` denies writes to `app/`, config files, and `package.json`. Asking for permission is the friction signal — usually means a real skill needs to handle it instead.

## Counter-examples

- Writing `style={{ color: "#FF6B00" }}` inside `design/*.tsx` — use a token instead.
- Importing `IonButton` directly from `@ionic/react` — use `OmButton`.
- Inventing a pattern name without reading PATTERNS.md.
- Skipping a HARD-GATE.
- Declaring `@pattern: list-view` but only using `OmCard` (no list-row component) — `require-pattern-components` will block.
