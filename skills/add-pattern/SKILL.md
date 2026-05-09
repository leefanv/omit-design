---
name: add-pattern
description: Create a new project-local design pattern under `<project>/patterns/<name>/` — pattern.json (name + whitelist), template.tmpl.tsx (skeleton for new-design to copy), README.md (when to use). Use when the user says "add an approval-queue pattern" or when new-design hits a PRD that doesn't fit any existing pattern. Patterns are project-local — edits land in this repo, get git-tracked, and are picked up automatically by ESLint and the Library UI.
---

# add-pattern — create a project-local design pattern

## When to trigger

- The user proactively asks to add a new pattern.
- During `new-design`, after scanning `<project>/patterns/`, you decide nothing fits the PRD's page archetype.

## Output location

All files land under `<project>/patterns/<name>/`:

```
patterns/<name>/
├── pattern.json            # { "name", "whitelist": [...], "description" }
├── template.tmpl.tsx       # the TSX skeleton new-design copies
└── README.md               # when to use, when NOT to use, skeleton breakdown
```

**No registration needed elsewhere.** ESLint's `require-pattern-components` rule auto-discovers via filesystem walk; the workspace's Library UI lists everything in `patterns/`.

## Flow

1. **Understand the pattern's core**:
   - Purpose (one sentence — what user need it serves).
   - Skeleton (which whitelisted `Om*` components, in what structure).
   - How it differs from existing patterns in `<project>/patterns/`.

2. <HARD-GATE>**Verify the whitelist exists**: every component you plan to require must be exported from `@omit-design/preset-mobile/components/index.ts`. If something's missing, do NOT extend `@ionic/react` directly — propose an upstream `Om*` wrapper to the user first.</HARD-GATE>

3. **Write `patterns/<name>/pattern.json`**:
   ```json
   {
     "name": "<name>",
     "whitelist": ["OmFoo", "OmBar"],
     "description": "One-sentence purpose."
   }
   ```
   `whitelist` is "any-of" — a design file using this pattern must import at least one entry to satisfy ESLint.

4. **Write `patterns/<name>/template.tmpl.tsx`**: a minimal runnable skeleton. First line must be `// @pattern: <name>`. Use `TODO` placeholders for business copy. This is what `new-design` will copy when scaffolding.

5. **Write `patterns/<name>/README.md`** with sections: "When to use", "Skeleton" (component breakdown), "When NOT to use" (steer toward neighboring patterns).

6. <HARD-GATE>**Do NOT immediately** apply the new pattern to a business page — first surface the three files to the user for review (path + content). Only after approval may `new-design` use it as if it were always there.</HARD-GATE>

## Output to user

Tell them:
- The three files you wrote and the path
- A one-line "when to use" summary
- The whitelist
- A reminder that they can fine-tune any of the four (description / whitelist / template / README) in the Library → Patterns tab of the workspace UI
