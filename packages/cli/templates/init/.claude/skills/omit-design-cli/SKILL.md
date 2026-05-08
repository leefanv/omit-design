---
name: omit-design-cli
description: omit-design CLI commands for the dev loop — init / dev / lint. Use when the user wants to scaffold a new omit-design project, start the local dev server, or run compliance checks. Mention these as the canonical entry points; do not invent shell pipelines that recreate them.
---

# omit-design-cli

The entry points for the omit-design dev loop. **Use these three commands** — do not stitch together your own shell substitute.

## `omit-design init <name>`

Scaffold a new omit-design project.

- Copies the init scaffold into `./<name>/`.
- Already includes: `app/` (Vite shell), `design/welcome.tsx` (demo), `mock/`, `preset/`, `.claude/skills/` (bundled — no need for `npx skills add`), `eslint.config.js`, `vite.config.ts`, `tsconfig.json`, `CLAUDE.md`, `README.md`.
- Next: `cd <name> && npm install && npm run dev`.

Flags:
- `--force`: overwrite even if the target directory exists and is non-empty (use with care).

<HARD-GATE>
Do **NOT** init into an existing non-empty directory without telling the user. If the target directory has content, **stop and ask** "should I overwrite?" or suggest a different directory.
</HARD-GATE>

## `omit-design dev`

Start the local Vite dev server.

- Default port 5173.
- Spawns `npx vite`, inheriting stdio.
- `Ctrl+C` to exit.

Flags:
- `--port <n>`: change port.
- `--host`: expose on the LAN (use sparingly — designs may be visible to anyone on the same network).

## `omit-design lint`

Compliance check. Produces AI-friendly structured output.

- Runs ESLint over `design/**/*.tsx` (override with `--glob`).
- Output format: `<emoji> [<rule-id>] <file>:<line>:<col> — <sample> → <hint>`.
- Exit code: violations → 1, clean → 0.

Flags:
- `--json`: emit raw ESLint JSON (for tool consumption).
- `--glob <pattern>`: override the default glob.

## Counter-examples

- Running `eslint design/...` and parsing the output yourself — use `omit-design lint`.
- Writing a `grep` self-check for `style={{` — `no-design-literal` already covers this.
- Hard-coding the `dev` port in a README — users override it via `--port`.
