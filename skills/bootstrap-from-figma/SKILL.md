---
name: bootstrap-from-figma
description: Bootstrap a fresh omit-design project's visual theme from an existing Figma file — extract design tokens (colors + spacing) and PUT the result to the dev-server so the workspace can apply it to theme-editor. Use when the user pastes a figma.com URL and wants to seed the project's theme. Patterns are produced separately via /distill-patterns-from-prd or /add-pattern.
---

# bootstrap-from-figma — seed a project's visual theme from Figma

## When to trigger

- The user pastes a `figma.com/(design|file|board|make|slides)/...` URL and says "bootstrap" / "start a project from this" / "extract the theme".
- The user copied a prompt from the workspace's **Bootstrap from Figma** banner (LibraryPage top). That prompt names this skill explicitly and includes the URL + target preset + writeback endpoint.

Do **not** trigger this skill for:
- Modifying an already-imported theme (use theme-editor in the workspace).
- Writing pages — that's `new-design`. This skill stops at the theme.
- Suggesting patterns — patterns are produced exclusively via `/distill-patterns-from-prd` (from a PRD) or `/add-pattern` (conversational or manual). Visual theme and patterns are intentionally decoupled.

## Output contract (read first)

Produce a JSON object matching `BootstrapPayload` in
`packages/dev-server/src/handlers/bootstrap.ts`:

```json
{
  "source": { "kind": "figma", "url": "...", "fileKey": "...", "nodeId": "..." },
  "extractedAt": "2026-05-11T12:00:00.000Z",
  "theme": {
    "presetName": "mobile",
    "colors": {
      "primary": "#0d8ce9",
      "secondary": "#00cfff",
      "tertiary": "#e56e35",
      "success": "#22c55e",
      "warning": "#e56e35",
      "danger": "#da342e",
      "dark": "#1f2024",
      "medium": "#90909a",
      "light": "#dbd9e0"
    },
    "spacing": { "xs": "4px", "sm": "8px", "md": "12px", "lg": "16px", "xl": "24px", "2xl": "32px" }
  },
  "notes": "Figma uses a single 'brand' token — mapped to primary; warning had no dedicated token, reused tertiary."
}
```

The **color keys must match the preset's `semanticColors`** exactly — for `preset-mobile`:
`primary / secondary / tertiary / success / warning / danger / dark / medium / light`.

The **spacing keys must match baseline** — for `preset-mobile`:
`xs / sm / md / lg / xl / 2xl`.

Keys outside these sets are dropped by the workspace store (with a console warning).

## Execution flow

### Step 1 — Parse the URL

Extract `fileKey` and `nodeId`:
- `figma.com/design/:fileKey/:fileName?node-id=:nodeId` — convert any `-` to `:` in nodeId.
- `figma.com/design/:fileKey/branch/:branchKey/...` — use `branchKey` as fileKey.
- `figma.com/board/...` — FigJam file; abort with a note that FigJam doesn't carry design tokens.

If the URL has no `nodeId`, you'll work at the file root.

### Step 2 — Read the design

Call Figma MCP tools in this order, **bailing as soon as you have enough**:

1. **`mcp__figma__get_variable_defs`** with `nodeId` (or no nodeId for file root). This is the **primary** source — Figma Variables already carry the design tokens you want. If the file uses Variables, you'll get a clean color/number/string map.
2. **`mcp__figma__get_metadata`** — file name + page list for the `source.notes`.
3. **`mcp__figma__get_design_context`** — returns React+Tailwind code with Code Connect / token hints. Use this **only if Variables came back empty or sparse** — fall back to extracting hex from the generated code.
4. **`mcp__figma__get_screenshot`** — one screenshot for the `notes` context (e.g. "dark-mode app with neon accent"). Optional.

Real-world caveat: the desktop-bound Figma MCP `get_variable_defs` and `get_design_context` tools require an active layer selection in the user's Figma desktop app. If those return "nothing selected", continue with metadata + screenshot only and **note in `notes`** that tokens were inferred visually rather than extracted from Figma Variables.

### Step 3 — Map tokens to the preset

Read `packages/preset-mobile/theme/baseline.ts` (or whichever preset the writeback prompt named) to see the target schema. Build a mapping table that lines up Figma variable names with the preset's `semanticColors`.

Common name patterns to recognize:
- `brand` / `accent` / `primary` → `primary`
- `accent-2` / `secondary` → `secondary`
- `cta` / `highlight` / `tertiary` → `tertiary`
- `error` / `destructive` / `red` → `danger`
- `caution` / `alert` / `amber` → `warning`
- `positive` / `confirm` / `green` → `success`
- `text` / `foreground` / `ink-900` → `dark`
- `text-secondary` / `muted` / `ink-500` → `medium`
- `surface-alt` / `divider` / `ink-100` → `light`

If you cannot find a confident match for a semantic key:
- Prefer leaving it **off** the output (the store keeps the baseline value).
- Record the gap in `notes` so the user sees what was inferred vs. left alone.

Color values **must be hex** (`#rrggbb` or `#rrggbbaa`). Convert OKLCH / HSL / rgba() yourself.

For `spacing`, only emit keys you have actual evidence for — don't fabricate values. If Figma exposes a `space/4`, `space/8`, etc. scale, map by numeric proximity to the baseline keys (`xs=4`, `sm=8`, `md=12`, `lg=16`, `xl=24`, `2xl=32`).

### Step 4 — Write back

PUT the payload to the endpoint provided in the prompt (typically
`http://localhost:5173/__omit/bootstrap`). The body is the JSON above, sent with
`Content-Type: application/json`.

If the writeback endpoint is unreachable (no dev-server running, port wrong, CORS), **fall back to writing the file directly**: `<projectRoot>/.omit/bootstrap.json`. Create the `.omit/` dir if needed.

### Step 5 — Report to the user

A single short message:

> Theme extracted from `<file name>` — N colors.
> Go to the workspace's Library page and click **Apply to theme**.
>
> To create patterns for this project, write a PRD and run /distill-patterns-from-prd,
> or invoke /add-pattern directly. Patterns are decoupled from visual theme bootstrap.

No verbose recap, no dumping the JSON — the workspace UI handles the preview.

## Counter-examples

- Calling `get_design_context` first, then `get_variable_defs` — wastes context; Variables alone usually suffice.
- Emitting Figma variable names verbatim as keys (e.g., `"brand-500": "#..."`) — the preset only accepts `semanticColors`, so the data is dropped.
- Filling `success` with `#00ff00` because "green" without checking the Figma — confident-looking guesses are worse than gaps.
- PUTing to the wrong port (Vite dev-server) when the user is on a different one — read the endpoint from the prompt, don't hardcode.
- Adding a `patterns: [...]` field to the payload — it's removed from the schema. Patterns are produced via `/distill-patterns-from-prd` or `/add-pattern`, not from Figma.
- Going on to scaffold pages — stop at theme; pages are `new-design`'s job.
