---
name: new-design
description: Generate a new design page (under design/) from a PRD. Picks a pattern from <project>/patterns/, copies its template, fills in fields, registers via auto-discovery. If no existing pattern fits the PRD's archetype, calls add-pattern to create one first. Use when the user wants to scaffold a new design page.
---

# new-design — generate a design page from a PRD

## When to trigger

- The user provides a PRD.
- The user says "make a design for the X page" / "add a design for X".

## Decision tree (stop here — confirm pattern + whitelist before going further)

<HARD-GATE>
**Before writing the first line of business code**, confirm two things:

1. **Find or create the matching pattern in `<project>/patterns/`**.
   - **If `patterns/` is empty**:
     - User provided a PRD → invoke `/distill-patterns-from-prd` first. Resume here only after files land and the user approves.
     - No PRD → invoke `/add-pattern` in **conversational mode** (it asks 3-5 clarifying questions and produces a minimal pattern). Resume here only after the user approves.
   - **If `patterns/` is non-empty**:
     - Read each `<project>/patterns/<id>/README.md` and decide. If nothing fits → invoke `/add-pattern` to create one. Surface the choice to the user before proceeding.
   - **Never** pick a pattern silently — the chosen pattern name must be confirmed in chat.

2. **All required components are on the preset Om* whitelist** (exported from `@omit-design/preset-mobile`).
   If a component is missing → stop. Either re-scope the pattern via `add-pattern`, or propose adding an upstream `Om*` wrapper. **Never** bypass the whitelist by importing visual components directly from `@ionic/react`.
</HARD-GATE>

## Execution flow

See [references/checklist.md](references/checklist.md) for the full 7-step checklist (read PRD / read patterns/ / check whitelist / prepare mock / **copy template** / self-check / verify).

**The core point**: step 5, "write the page," really means "**copy `<project>/patterns/<chosen>/template.tmpl.tsx` and replace placeholders**" — not write from scratch.

## Delegate the mechanical work (when `pattern-applier` agent is present)

Once the HARD-GATE passes (pattern confirmed + whitelist verified) and the user has approved the chosen pattern + target path, **delegate steps 5–7 (template copy → self-check → verify) to the `pattern-applier` sub-agent** if `.claude/agents/pattern-applier.md` exists. This keeps the main conversation focused on user dialogue and prevents the template + lint-output from clogging context.

Pass it three things: the pattern name, the absolute target path under `design/`, and the PRD text. It will return a single-line success message or a structured failure with a question for the user. **You** stay in charge of: pattern selection (HARD-GATE), reviewing the agent's summary, and answering follow-ups.

If `pattern-applier` is not installed, fall back to doing steps 5–7 inline.

## Output

When done, tell the user:

- The new file path.
- The chosen pattern and why (and whether `add-pattern` had to create it just now).
- Where the mock data lives.
- The access URL (`/designs/<group>/<file>`).

## Counter-examples

- The user didn't specify a pattern, you found nothing fitting in `patterns/`, you wrote the design anyway with a guess header.
- A component isn't on the whitelist → you imported it directly from `@ionic/react`.
- `patterns/` was empty and you proceeded without first invoking `/distill-patterns-from-prd` (when PRD exists) or `/add-pattern` in conversational mode (when no PRD).
- Writing `<div style={{ padding: 16 }}>`.
- Stuffing mock data into `design/` instead of `mock/`.
- A template exists in `<project>/patterns/<chosen>/template.tmpl.tsx` but you wrote the skeleton from scratch anyway.
