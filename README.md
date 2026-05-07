# omit-design

AI-collaborative design composition framework. Write TSX, lint with hard rules, preview locally — no cloud, no accounts.

## Quick start

```bash
npx omit-design init my-app
cd my-app
npm install
npm run dev
```

Opens `http://localhost:5173/designs/welcome`. Add new design pages in `design/`,
auto-discovered as `/designs/<name>`.

## Three-layer AI constraint

omit-design enforces correctness for AI-generated UI in three deterministic layers:

1. **Skills** (`.claude/skills/`) — natural-language guidance Claude reads:
   `<HARD-GATE>` decision points, pattern catalog, references for progressive disclosure.
2. **ESLint plugin** (`@omit-design/eslint-plugin`) — three hard rules: no design literals
   (hex / px), whitelist imports, mandatory `// @pattern: <name>` headers.
3. **Templates** (`@omit-design/preset-mobile/templates`) — copy-paste TSX skeletons per pattern.
   The agent copies a template, replaces placeholders, doesn't invent structure.

The result: `npm run lint` is the single compliance command. Pass it = code respects the design system.

## Packages

| Package | Purpose |
|---|---|
| `@omit-design/cli` | `omit-design` CLI (`init` / `dev` / `lint`) |
| `@omit-design/engine` | Runtime: registry, discovery, inspect, theme-editor, capture, shell |
| `@omit-design/eslint-plugin` | Three hard rules |
| `@omit-design/preset-mobile` | Default mobile preset: Om* components + tokens + PATTERNS + templates |
| `@omit-design/figma-plugin` | Figma plugin (export / sync) |

## Design philosophy

- **TSX is the source of truth.** Designs are real, clickable React pages — not images.
- **Local-first.** No cloud accounts, no servers; dev server / inspect / theme-editor all in-browser.
- **AI as a peer.** Skills + lint + templates make AI output deterministic, not "please don't break it."

## Status

Pre-1.0. Expect breakage. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
