---
name: distill-patterns-from-prd
description: Distill reusable page patterns from a PRD. Reads the PRD, scans <project>/patterns/ for reuse, decides which new patterns to create (zero or more), writes pattern.json + template.tmpl.tsx + README.md per new pattern. Does NOT generate design pages — pairs with new-design downstream. Use when the user has a PRD and wants patterns extracted before scaffolding.
---

# distill-patterns-from-prd — extract reusable patterns from a PRD

## When to trigger

- The user copied the **"Distill patterns from this PRD"** prompt from the PRDs tab in the workspace.
- The user explicitly asks "从这份 PRD 里抽 pattern" / "see what patterns this PRD needs" / "distill patterns".
- Invoked upstream by `new-design` when `patterns/` is empty and a PRD exists.

Do **not** trigger this skill for:
- Generating actual design pages — that's `new-design`'s job. Stop after patterns land.
- Editing an existing pattern — use the workspace Patterns tab or `add-pattern`.
- Anything not anchored to a concrete PRD body (use `add-pattern` conversational mode instead).

## Output contract

For each new pattern, write **three files** to `<project>/patterns/<id>/`:

```
patterns/<id>/
├── pattern.json         { "name": "<id>", "whitelist": ["OmFoo", "OmBar"], "description": "..." }
├── template.tmpl.tsx    first line `// @pattern: <id>`; minimal skeleton; TODO placeholders for copy
└── README.md            "When to use" / "Skeleton" / "When NOT to use"
```

Whitelist entries **must** come from `GET /preset/components` (the `Om*` names exported by `@omit-design/preset-mobile`). Unknown names break ESLint's `require-pattern-components` rule.

## Execution flow

### Step 1 — Parse the PRD

Read the body (frontmatter already trimmed by the workspace's clipboard handler). Identify:
- **Page count** — how many distinct screens does this PRD cover?
- **Archetype** per screen — list / detail / form / dialog / dashboard / sheet / welcome?
- **Data shape** per screen — single record / homogeneous list / tree / kanban / table?
- **User actions** — read / select / fill / submit / compare / dismiss?

### Step 2 — Scan existing patterns

```
ls <project>/patterns/*/pattern.json
cat <project>/patterns/<id>/README.md  for each
```

For each PRD screen, judge: **does an existing pattern cover this archetype well enough?** Match on the README's "When to use" / "When NOT to use" sections, not just on the name.

### Step 3 — Decide reuse vs. new

Produce two lists:
- `reuse[]` — `{ screen, patternId, reason }` — screens that can use existing patterns
- `new[]`   — `{ id, description, archetype, whitelist[], reason }` — screens that need a new pattern

**Minimization rule**: if reuse can cover everything, `new[]` is empty — say so to the user and stop. **Do not invent patterns to look productive.**

If two PRD screens share an archetype that is missing from `patterns/`, create **one** pattern for both — don't fork by business name (e.g. don't create `orders-list` and `coupons-list` when `list-view` covers both).

### Step 4 — Validate whitelist

Fetch `GET /preset/components` (or fall back to inspecting `node_modules/@omit-design/preset-mobile/components/index.ts`). Every component planned for `new[]` whitelists must appear in the returned `Om*` list. Components missing → **stop and tell the user**; either re-scope the pattern or propose an upstream `Om*` wrapper. Never silently substitute `@ionic/react` directly.

### Step 5 — Write the three files per new pattern

`pattern.json`:
```json
{
  "name": "<id>",
  "whitelist": ["OmFoo", "OmBar"],
  "description": "One-sentence purpose."
}
```

`template.tmpl.tsx`:
- Line 1: `// @pattern: <id>`
- Minimal runnable skeleton: `OmPage` + the whitelisted components.
- Use **TODO placeholders** for business copy. Never inline PRD's actual data — that belongs in the design page that `new-design` will scaffold later.
- Keep it short (≤ ~40 lines). If a pattern needs more, you're probably reaching too wide; split.

`README.md`:
- `## When to use` — bulleted heuristics, one line each.
- `## Skeleton` — list the components in render order.
- `## When NOT to use` — point to neighboring patterns (or note "this is the only fit for X").

### Step 6 — HARD-GATE: surface for review

After all writes, **list the paths and a one-line summary of each new pattern**. Tell the user:

> "Distilled N new patterns. Review the files above; once approved, run `/new-design` to scaffold the actual pages."

**Do not** auto-invoke `new-design`. **Do not** modify `design/`. The hand-off is intentional — the user has to confirm before patterns ossify into git history.

## Counter-examples

- Hallucinating `whitelist: ["OmFancyThing"]` when OmFancyThing is not exported from preset-mobile.
- Splitting one archetype across multiple patterns just because the PRD uses different business names.
- Pasting PRD business copy into `template.tmpl.tsx` instead of using `TODO`.
- Auto-running `new-design` after writing the patterns (this is the user's call).
- Writing files under `design/` (out of scope — that's `new-design`).
- Creating a pattern when an existing one fits (`list-view` already there → don't add `orders-list`).
- Treating `pattern: <name>` in the PRD frontmatter as authoritative — it's a hint, not a contract. Use README "When to use" matching instead.
