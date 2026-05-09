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

1. **A matching pattern exists in `<project>/patterns/`**.
   Each subdirectory `<project>/patterns/<name>/` has `pattern.json` (with `whitelist`) and `README.md` (with "when to use"). Read the READMEs to choose.
   - If `patterns/` is empty → tell the user to run "Import 8 starters" in the workspace's Library → Patterns tab, or run `omit-design init` if this is a fresh project.
   - If no existing pattern fits → call `add-pattern` (it will create `patterns/<new-name>/{pattern.json, template.tmpl.tsx, README.md}`); only after that file lands do you proceed here.
   - **Do NOT** pick a pattern on your own initiative without surfacing the choice to the user first.

2. **All components the PRD needs are exported from `@omit-design/preset-mobile`** (the `Om*` whitelist).
   If a component is missing → stop and tell the user; either use `add-pattern` to scope around the gap or propose adding the missing `Om*` upstream.
   **Never** bypass the whitelist by importing visual components directly from `@ionic/react`.
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
- `patterns/` was empty and you proceeded without prompting the user to import starters or create a new pattern.
- Writing `<div style={{ padding: 16 }}>`.
- Stuffing mock data into `design/` instead of `mock/`.
- A template exists in `<project>/patterns/<chosen>/template.tmpl.tsx` but you wrote the skeleton from scratch anyway.
