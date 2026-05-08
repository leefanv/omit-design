# Audit severity tiers (contract)

This file is the **single source of truth** for compliance violation severity. Both the `audit-design` skill and the `omit-design lint` CLI render output according to it.

## Three severity tiers

| Level | Marker | Meaning | Exit code |
|---|---|---|---|
| block | Blocks merge | Pattern / whitelist breakage; rejected outright | 1 |
| warn | Should fix | Literal escapes a token; tolerated temporarily but must be scheduled | 1 |
| hint | Advisory | A whitelist component is missing, etc.; advisory rather than blocking | 0 (when alone) |

## Mapping rules to severity

| ESLint rule / check item | Level | Notes |
|---|---|---|
| `omit-design/require-pattern-header` (missing) | block | Missing `// @pattern:` header |
| `omit-design/require-pattern-header` (malformed) | block | `@pattern` header is malformed |
| `omit-design/whitelist-ds-import` (forbiddenSource) | block | Imported a non-whitelisted package |
| `omit-design/whitelist-ds-import` (forbiddenIonicNamed) | block | Imported a non-whitelisted component from `@ionic/react` |
| `omit-design/no-design-literal` (hex / function color) | warn | Color literal |
| `omit-design/no-design-literal` (px length) | warn | Pixel literal |
| Pattern name not in PATTERNS.md (audit-flow check) | block | Header is present but the pattern does not exist |
| Whitelist missing a component (audit-flow hint) | hint | Suggests adding an Om* wrapper |

## Output format convention

`omit-design lint` renders each violation on a single line:

```
<emoji> [<rule-id>] <file>:<line>:<col> — <sample> → <hint>
```

Examples:

```
[omit-design/require-pattern-header] design/foo/bar.tsx:1 — missing → add `// @pattern: <name>` on the first line
[omit-design/no-design-literal] design/foo/bar.tsx:42:18 — '#FF6B00' → use a token: var(--om-*) or an Om* prop
[audit] design/foo/bar.tsx — OmFooBar missing from whitelist → propose adding an Om* wrapper
```

## Summary block

Append at the end of the output:

```
Compliance: <ok>/<total> files
Violations: block <r> · warn <y> · hint <g>
```
