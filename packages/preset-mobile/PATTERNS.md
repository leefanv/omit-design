# Patterns are project-local

Starting in 0.3.x, **patterns no longer live in `@omit-design/preset-mobile`**. They live in your project's `patterns/` directory and are owned by you.

The recommended creation flow is:

1. Write a PRD in the workspace's **Library → PRDs** tab
2. Click "Copy Claude prompt" and paste into Claude Code
3. The `new-design` skill picks an existing pattern, or — if nothing fits — calls `add-pattern` to create one and writes it into `<project>/patterns/<name>/`
4. Review and tweak the new pattern in **Library → Patterns**

Eight starter patterns ship with `omit-design init` (`list-view`, `detail-view`, `form-view`, `sheet-action`, `dialog-view`, `welcome-view`, `dashboard`, `tab-view`). Use `init --no-starters` to opt out.

For the description and skeleton of each starter, read its `README.md` under your project's `patterns/<name>/`.
