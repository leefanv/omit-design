---
name: start
description: Active state diagnosis for an omit-design project — figure out what the user should do next based on the project's current state (empty / single welcome page / lint failing / healthy). Use when the user enters an omit-design project and says something open-ended like "what should I do next?", "I just init'd this", "let's get started", or runs the skill explicitly. Do NOT use if the user already specified a concrete intent (use the targeted skill instead).
---

# start — diagnose project state and recommend the next skill

## When to trigger

- Right after `omit-design init`.
- The user says something open-ended: "what now?", "I want to make something", "where do I begin?".
- The user explicitly invokes `/start`.

**Do NOT trigger** when the user already named a concrete action ("add a list page" → use `new-design` directly).

## Decision tree

<HARD-GATE>
Before recommending anything you must run all four checks below in order. Do **not** skip a step because you "feel" you know the answer — checks are cheap, false recommendations waste a context.
</HARD-GATE>

### Check 1 — is this an omit-design project?
- Does `package.json` declare `@omit-design/preset-mobile` as a dep?
- Does `design/` exist?
- If either is no → tell the user this isn't an omit-design project, suggest `npx @omit-design/cli init <name>`. Stop.

### Check 2 — is `design/` essentially empty?
- Count `.tsx` files under `design/**`.
- If only `welcome.tsx` (or 0 files) → recommend **`new-design`**. The user just scaffolded; first action is making a real page.

### Check 3 — does the project pass `npm run lint`?
- Run `omit-design lint --json` (silent) to inspect violations.
- If violations > 0 → recommend **`audit-design`** in repair mode. Quote the top 3 most-violated files.
- If lint passes → continue to Check 4.

### Check 4 — pattern diversity
- Inspect `// @pattern:` headers across `design/**/*.tsx`.
- If only 1–2 distinct patterns used and the project has > 3 pages → suggest **`add-pattern`** if the user describes a need that doesn't fit the 8 built-ins; otherwise suggest **`new-design`** to broaden coverage.
- If everything looks healthy → list the design pages with their patterns and ask the user what they want to do next.

## Output format

Always end with a single concrete recommendation, formatted as:

```
→ Recommended next step: /<skill-name>
   Why: <one-line reason from the check that fired>
   To proceed: <one-line concrete invocation, e.g. "tell me the PRD for the next page">
```

If multiple recommendations apply, pick the **earliest-stage** one (Check 1 > 2 > 3 > 4). Do not dump all four — the point is reducing decision load.

## Counter-examples

- Recommending `new-design` without first running lint (Check 3) — broken project should be fixed first.
- Listing all 5 skills as "options" — defeats the purpose; pick one.
- Skipping Check 1 because "the directory is called my-design-app" — name is not enough; check the actual deps.
