---
name: ship-design
description: One-shot delivery pipeline for a single design page — runs lint + accessibility review + screenshot capture in sequence and reports a single pass/fail. Use when the user says "ship X", "is X ready to deliver?", "review and capture <name>", or wants a final check before handing a design off to development. Operates on one named page at a time.
---

# ship-design — one-command delivery for a single page

## When to trigger

- "ship the orders/list page"
- "is design/foo/bar ready?"
- "review and capture <name>"
- The user finished editing a page and asks for a final check before handoff.

**Do NOT trigger** for batch audits across the whole repo → use `audit-design` instead.

## Inputs

The user must specify **one** target. Accept any of:
- A path: `design/orders/list.tsx`
- A route name: `orders/list`
- A bare name: `list` (only if unambiguous)

<HARD-GATE>
If you cannot resolve the input to exactly one file under `design/**/*.tsx`, **stop and ask**. Do not pick the "closest match" silently — shipping the wrong page is worse than asking once.
</HARD-GATE>

## Pipeline (run in order, fail fast)

### Step 1 — lint
- Run `omit-design lint <resolved-path>`.
- If any violation → stop here. Report the violations and recommend `audit-design` to fix. Pipeline aborts.

### Step 2 — accessibility & pattern review
- Delegate to `audit-reviewer` sub-agent (if available in `.claude/agents/`) scoped to the single file.
- If `audit-reviewer` is missing, do the review inline: check tap-target sizes, color contrast, presence of `OmHeader` or equivalent landmark, alt text for images.
- Warnings are non-fatal but must be surfaced.

### Step 3 — screenshot capture
- Ensure `npm run dev` is running (or start it in the background).
- Visit `http://localhost:5173/designs/<group>/<name>`.
- Capture full-page screenshot to `.omit-design/captures/<group>__<name>.png`.
- If the dev server isn't reachable in 5s, skip with a warning — do not block on this.

## Output format

```
# ship-design: <group>/<name>

✓ lint        (0 errors, 0 warnings)
✓ a11y review (<n> notes)
✓ capture     (.omit-design/captures/<group>__<name>.png)

Status: READY
```

Or:

```
✗ lint        (<n> errors) → run /audit-design first
- a11y review SKIPPED (lint failed)
- capture     SKIPPED (lint failed)

Status: BLOCKED
```

## Counter-examples

- Running steps in parallel — they're sequential because each gates the next.
- Reporting "ready" with warnings hidden — surface every warning even on success.
- Trying to "fix" lint issues automatically — that's `audit-design`'s job; ship-design only reports.
- Resolving an ambiguous name to "probably orders/list" without asking.
