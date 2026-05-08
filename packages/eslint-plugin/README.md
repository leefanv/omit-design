# @omit-design/eslint-plugin

> Three hard rules for [omit-design](https://github.com/leefanv/omit-design) business pages.

The rules below are **the** enforcement boundary for AI-collaborative design composition. They keep design files predictable so agents can reliably read, edit, and reason about them.

## Install

```bash
npm install -D @omit-design/eslint-plugin eslint
```

## Rules

| Rule | What it does |
|---|---|
| `omit-design/no-design-literal` | Forbid raw colors / sizes / spacing in design files. Use `var(--om-*)` tokens. |
| `omit-design/whitelist-ds-import` | Only `Om*` whitelist components and approved engine subpaths can be imported into design files. |
| `omit-design/require-pattern-header` | Each design file must declare a `pattern: "..."` header that maps to a registered pattern. |

## Usage (flat config)

```js
// eslint.config.js
import omit from "@omit-design/eslint-plugin";

export default [
  {
    files: ["design/**/*.tsx"],
    plugins: { "omit-design": omit },
    rules: {
      "omit-design/no-design-literal": "error",
      "omit-design/whitelist-ds-import": "error",
      "omit-design/require-pattern-header": "error",
    },
  },
];
```

Projects created with `npx @omit-design/cli init` already include this configuration.

## License

MIT
