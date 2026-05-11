# Patterns are project-local

Patterns live in your project's `patterns/` directory and are owned by you. They are **not** shipped by `@omit-design/preset-mobile`.

New projects (`omit-design init`) start with an empty `patterns/`. Patterns grow on demand:

1. **From a PRD** — write a PRD in the workspace's **Library → PRDs** tab → click **Distill patterns from this PRD** → paste into Claude Code. The `distill-patterns-from-prd` skill scans existing patterns for reuse, then writes new ones for the gaps into `<project>/patterns/<id>/`.
2. **From a conversation** — when no PRD exists, just ask Claude to make a page. The `new-design` skill auto-invokes `add-pattern` in **conversational mode**: 5 short questions → one minimal pattern → review → resume.
3. **Manually** — workspace's **Library → Patterns → + New**, fill four fields by hand.

Each pattern is three files:

```
patterns/<id>/
├── pattern.json         # { "name", "whitelist": ["OmFoo", ...], "description" }
├── template.tmpl.tsx    # TSX skeleton copied by new-design (first line: // @pattern: <id>)
└── README.md            # When to use / Skeleton / When NOT to use
```

ESLint's `require-pattern-components` rule reads `<cwd>/patterns/<id>/pattern.json` directly — no central config file.
