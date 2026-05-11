---
name: add-pattern
description: Create a new project-local design pattern under `<project>/patterns/<name>/` — pattern.json (name + whitelist), template.tmpl.tsx (skeleton for new-design to copy), README.md (when to use). Use when the user says "add an approval-queue pattern" or when new-design hits a PRD that doesn't fit any existing pattern. Patterns are project-local — edits land in this repo, get git-tracked, and are picked up automatically by ESLint and the Library UI.
---

# add-pattern — create a project-local design pattern

## When to trigger

- The user proactively asks to add a new pattern.
- During `new-design`, after scanning `<project>/patterns/`, you decide nothing fits the PRD's page archetype.
- Invoked by `new-design` when `patterns/` is empty and the user provided **no PRD** — enter **Conversational mode** (see below).

## Conversational mode (called by new-design with no PRD)

When triggered by `new-design` with no PRD source, you do not have a body to parse. Instead, **ask the user the following 5 questions in order, one per turn**, and collect short answers:

1. 这个页面的核心目的是什么？（一句话）
2. 用户在这页主要做什么动作？（看 / 选 / 填 / 提交 / 对比 / 取消……）
3. 数据形态是单条 / 列表 / 树 / 看板 / 表单 / 嵌套？
4. 类似的页面在 list-view / detail-view / form-view / dashboard / dialog-view 这五个标准类目里靠近哪一个？
5. 有没有特殊约束？（手势 / 离线 / 实时刷新 / 大数据量……）

Once all 5 answers are in, **enter the Flow steps below** with one constraint:

- **Produce exactly ONE pattern**, kept minimal: `whitelist` ≤ 5 `Om*` components, `template.tmpl.tsx` ≤ 30 lines.
- Skip Step 1's "compare with PRD" — instead, treat the 5 answers as the spec.
- After Step 6 HARD-GATE passes, return to `new-design`'s main flow.

This mode is **not** for `add-pattern` invoked directly by the user — when the user explicitly says "add a pattern for X", proceed with the standard Flow below (the user already knows what they want).

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
