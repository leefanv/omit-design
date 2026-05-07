# Audit 严重度分级(契约)

本文件是合规违规的**严重度单一真源**。`audit-design` skill 与 `omit-design lint` CLI 都按此渲染输出。

## 三级严重度

| 级别 | 标记 | 含义 | 退出码 |
|---|---|---|---|
| 🔴 **block** | 阻塞合并 | pattern / 白名单破坏,直接拒绝 | 1 |
| 🟡 **warn** | 应当修复 | 字面量逃逸 token,允许临时存在但需排期 | 1 |
| 🟢 **hint** | 建议性 | 白名单缺组件等,提示而非阻塞 | 0(单独时) |

## 规则到严重度的映射

| ESLint 规则 / 检查项 | 级别 | 说明 |
|---|---|---|
| `omit-design/require-pattern-header`(missing) | 🔴 | 缺 `// @pattern:` 头 |
| `omit-design/require-pattern-header`(malformed) | 🔴 | `@pattern` 头格式错 |
| `omit-design/whitelist-ds-import`(forbiddenSource) | 🔴 | import 了非白名单包 |
| `omit-design/whitelist-ds-import`(forbiddenIonicNamed) | 🔴 | 从 `@ionic/react` import 了非白名单组件 |
| `omit-design/no-design-literal`(hex / function color) | 🟡 | 颜色字面量 |
| `omit-design/no-design-literal`(px length) | 🟡 | 像素字面量 |
| pattern 名不在 PATTERNS.md(audit 流程检查) | 🔴 | header 写了但 pattern 不存在 |
| 白名单缺组件(audit 流程提示) | 🟢 | 提示加 Om* 封装 |

## 输出格式约定

`omit-design lint` 每条违规渲染为一行:

```
<emoji> [<rule-id>] <file>:<line>:<col> — <sample> → <hint>
```

例:

```
🔴 [omit-design/require-pattern-header] design/foo/bar.tsx:1 — missing → 第一行加 `// @pattern: <name>`
🟡 [omit-design/no-design-literal] design/foo/bar.tsx:42:18 — '#FF6B00' → 走 token: var(--om-*) 或 Om* prop
🟢 [audit] design/foo/bar.tsx — OmFooBar 缺白名单 → 提议加 Om* 封装
```

## 汇总块

输出末尾追加:

```
合规: <ok>/<total> 文件
违规: 🔴 <r> · 🟡 <y> · 🟢 <g>
```
