---
name: new-design
description: Generate a new design page in an omit-design project (under design/) from a PRD or "add a page" request. Picks a pattern from preset-mobile, copies its template, fills in fields, registers via auto-discovery. Use when the user wants to scaffold a new design page.
---

# new-design — generate a design page from a PRD

## When to trigger

- The user provides a PRD.
- The user says "make a design for the X page" / "add a design for X".

## Decision tree (stop here — confirm pattern + whitelist before going further)

<HARD-GATE>
**Before writing the first line of business code**, you must confirm two things:

1. **The PRD specifies a pattern**, and that pattern name appears in `node_modules/@omit-design/preset-mobile/PATTERNS.md` (the 8 patterns: list-view / detail-view / form-view / sheet-action / dialog-view / welcome-view / dashboard / tab-view).
   If the PRD doesn't specify one → **stop**, ask the user or recommend one. **Do NOT** pick on your own initiative.

2. **All components the PRD needs are on the whitelist** (the 21 Om* components in `@omit-design/preset-mobile`).
   If a component is missing → **stop** and tell the user; propose either using `add-pattern` first or adding a single whitelisted component.
   **Never** bypass the whitelist by importing visual components directly from `@ionic/react`.
</HARD-GATE>

## Execution flow

See [references/checklist.md](references/checklist.md) for the full 7-step checklist (read PRD / read PATTERNS / check whitelist / prepare mock / **copy template** / self-check / verify).

**The core point**: step 5, "write the page," really means "**copy `node_modules/@omit-design/preset-mobile/templates/<pattern>.tmpl.tsx` and replace placeholders**" — not write from scratch. Only when the template is missing do you fall back to rewriting from the "skeleton" description in PATTERNS.md; never invent imports or component structure out of thin air.

## Delegate the mechanical work (when `pattern-applier` agent is present)

Once the HARD-GATE passes (pattern confirmed + whitelist verified) and the user has approved the chosen pattern + target path, **delegate steps 5–7 (template copy → self-check → verify) to the `pattern-applier` sub-agent** if `.claude/agents/pattern-applier.md` exists. This keeps the main conversation focused on user dialogue and prevents the template + lint-output from clogging context.

Pass it three things: the pattern name, the absolute target path under `design/`, and the PRD text. It will return a single-line success message or a structured failure with a question for the user. **You** stay in charge of: pattern selection (HARD-GATE), reviewing the agent's summary, and answering follow-ups.

If `pattern-applier` is not installed, fall back to doing steps 5–7 inline.

## Output

When done, tell the user:

- The new file path.
- The chosen pattern and why (and whether a template was reused).
- Where the mock data lives.
- The access URL (`/designs/<group>/<file>`).

## Counter-examples

- The user didn't specify a pattern → you picked one without telling them.
- A component isn't on the whitelist → you imported it directly from `@ionic/react`.
- Writing `<div style={{ padding: 16 }}>`.
- Stuffing mock data into `design/` instead of `mock/`.
- A template exists but you wrote the skeleton from scratch anyway.
