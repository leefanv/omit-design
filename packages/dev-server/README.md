# @omit-design/dev-server

Vite plugin that exposes a small set of HTTP endpoints under `/__omit/*` so the
engine shell's Library page can read and write the user-customizable assets in
their omit-design project — skills, patterns, and PRDs — directly from the
browser, without leaving the dev server.

## Why

omit-design's "AI + human collaboration" story rests on three user-editable
asset types:

- **Skills** (`.claude/skills/<name>/SKILL.md`) — natural-language guidance for
  Claude Code.
- **Patterns** (`patterns/<name>/`) — project-local extensions to the built-in
  preset patterns (whitelist + template).
- **PRDs** (`prds/<slug>.md`) — product requirement docs that get fed into the
  `new-design` skill.

Editing these in a text editor is fine for engineers, but blocks designers and
PMs. This plugin is the file-IO bridge that lets the workspace UI manage them.

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { omitDevServer } from "@omit-design/dev-server";

export default defineConfig({
  plugins: [react(), omitDevServer()],
});
```

Then open `http://localhost:5173/workspace/<projectId>/library`.

## Endpoints

All under `/__omit`. JSON in/out.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/library` | one-shot index of all three kinds |
| `GET` | `/skills` | list skills |
| `GET` | `/skills/:id` | read `SKILL.md` |
| `PUT` | `/skills/:id` | write `SKILL.md` (creates dir if needed) |
| `DELETE` | `/skills/:id` | rm skill dir |
| `POST` | `/skills/rename` | `{ from, to }` |
| `GET` | `/patterns` | list project-local custom patterns |
| `GET` | `/patterns/:id` | read `{config, template, readme}` |
| `PUT` | `/patterns/:id` | write all three files |
| `DELETE` | `/patterns/:id` | rm pattern dir |
| `GET` | `/preset/components` | list `Om*` exports from preset-mobile (for whitelist chips) |
| `POST` | `/starters/import` | copy 8 starter patterns from `@omit-design/cli/templates/init/patterns/` into `<project>/patterns/` (skips existing unless `{ overwrite: true }`) |
| `GET` | `/prds` | list PRDs |
| `GET` | `/prds/:id` | read `<id>.md` |
| `PUT` | `/prds/:id` | write `<id>.md` |
| `DELETE` | `/prds/:id` | rm `<id>.md` |

## Safety

- **Path-traversal guard.** All write/read paths are resolved through
  `safeJoin(root, kind, id)`, which rejects absolute paths, `..` segments, and
  any target that escapes the kind's whitelisted subdirectory.
- **Local-first.** The plugin only registers under Vite's dev-server middleware
  (`apply: "serve"`). It never runs in production builds.
- **Single user.** No auth, no concurrency control. Assumes one developer per
  dev server, which is the existing local-first model.

## License

MIT
