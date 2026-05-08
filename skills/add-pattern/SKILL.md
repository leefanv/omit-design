---
name: add-pattern
description: Add a new design pattern to omit-design's preset-mobile (or modify an existing one) — register in PATTERNS.md, write an example design page, ship a template.tmpl.tsx skeleton. Use when the user says "add a wizard pattern" or new-design hits a missing pattern. Note this lives in @omit-design/preset-mobile, which is in node_modules — adding a pattern to your installed copy is local-only; upstream contributions go to the omit-design repo.
---

# add-pattern — add or modify a design pattern

## When to trigger

- The user proactively says "add an X pattern".
- During `new-design` you discover preset-mobile's PATTERNS.md does not have a fitting pattern.

## Platform conventions

When a new pattern lands, you **should** also write a `templates/<pattern>.tmpl.tsx` template for `new-design` to copy.

**Note**: `@omit-design/preset-mobile` is an npm package installed under `node_modules/`. Editing `node_modules/...` locally takes effect after restarting the dev server but **is not persisted**; a real pattern should be contributed via PR to the upstream omit-design repo under `packages/preset-mobile/`. This skill prefers guiding you to produce a patch + commit upstream; in emergencies you can temporarily add a private component under the project's `preset/components/` plus a custom ESLint whitelist entry.

## Flow

1. **Understand the core of the pattern**:
   - Purpose (one sentence).
   - Skeleton (which whitelisted Om* components, in what structure).
   - How it differs from existing patterns.

2. <HARD-GATE>**Check the whitelist**: every component the pattern needs must be in `@omit-design/preset-mobile/components/index.ts`. If anything is missing, **add the Om* wrapper first** (via upstream PR) — do not start with the example. Bypassing the whitelist = rejected.</HARD-GATE>

3. **Write the example file**: under `design/_patterns/<name>.tsx`, create a minimal runnable example (using mock data); the first line must be `// @pattern: <name>`.

4. **Write the template**: extract the reusable skeleton; mark business fields with `TODO` comments and example placeholder values. This is what the new-design skill copies.

5. **Update PATTERNS.md** (upstream patch):
   - `## <name>`
   - **Purpose** / **Skeleton** / **Template** / **When not to use**.

6. <HARD-GATE>**Do NOT immediately** apply this pattern in business design pages — first let the user review the description, example, and template in PATTERNS.md. Only after approval may `new-design` use it.</HARD-GATE>
