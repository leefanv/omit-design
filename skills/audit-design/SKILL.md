---
name: audit-design
description: Scan all design pages in an omit-design project for compliance violations (whitelist imports, design literals, missing pattern headers). Use when the user asks "is my design compliant?" or wants a batch audit before refactoring.
---

# audit-design — 设计稿合规审查

## 平台约定

**机器化检查走 `npm run lint`**(单一合规命令,自动覆盖 `design/**/*.tsx`);本 skill 提供**人工审查叙事**(诊断、建议、汇总),**不重复实现** ESLint 已覆盖的规则。

## 检查项概览

对 `design/**/*.tsx` 每个 page 文件检查 5 项:

1. 首行 `// @pattern: <name>` 标注
2. import 来源白名单
3. 无颜色字面量
4. 无间距/字号字面量
5. 白名单组件存在

每项的具体规则、例外、所属 ESLint 规则名 → [references/checks.md](references/checks.md)。

## 严重度与输出格式

<HARD-GATE>
本 skill 输出的严重度分级、emoji 标记、汇总块格式,必须对齐 [references/severity-tiers.md](references/severity-tiers.md)。
`omit-design lint` 与本 skill 共用同一份分级契约 — **不要在 skill 输出里发明自己的级别或符号**。
</HARD-GATE>

## 流程

1. 跑 `npm run lint`,获取结构化机器输出
2. 读输出,按文件聚合:把同文件多条违规合并为一段
3. 给每段加**人工诊断**:为什么会这样、推荐怎么改、是否需要加 Om* 封装 / 加 token / 拆 pattern
4. 末尾输出汇总块(对齐 severity-tiers.md 格式)
5. 列出最值得优先修的 3-5 个文件(按违规密度 × 严重度排)

## 何时不用本 skill

- 单个文件改动后的快速合规验证 → 直接 `npm run lint`
- 想知道"我这次改动有没有引入新违规" → 直接 `npm run lint`
- 写新稿前查 pattern → `new-design` skill
