---
name: add-pattern
description: Add a new design pattern to omit-design's preset-mobile (or modify an existing one) — register in PATTERNS.md, write an example design page, ship a template.tmpl.tsx skeleton. Use when the user says "add a wizard pattern" or new-design hits a missing pattern. Note this lives in @omit-design/preset-mobile, which is in node_modules — adding a pattern to your installed copy is local-only; upstream contributions go to the omit-design repo.
---

# add-pattern — 新增/修改设计模式

## 何时触发

- 用户主动提"加一种 XX 模式"
- 在 `new-design` 中发现 preset-mobile PATTERNS.md 没有合适模式

## 平台约定

新模式落地后**应当**同时在 `templates/<pattern>.tmpl.tsx` 写一份 template,供 `new-design` 复制。

**注**:`@omit-design/preset-mobile` 是 npm 包,装在 `node_modules/`。本地改 `node_modules/...` 重启 dev 即生效,但**不会持久化**;真正的 pattern 应当通过 PR 加到上游 omit-design 仓的 `packages/preset-mobile/`。本 skill 优先指导生成补丁 + commit 到上游;紧急情况可临时在项目 `preset/components/` 下加私有组件 + 自定义 ESLint 白名单。

## 流程

1. **理解模式的核心**:
   - 用途(一句话)
   - 骨架(用哪些白名单 Om* 组件按什么结构)
   - 与已有模式的区别

2. <HARD-GATE>**检查白名单**:模式所需的所有组件必须在 `@omit-design/preset-mobile/components/index.ts`。缺则**先加 Om* 封装**(走上游 PR),不要先写示例。绕开白名单 = 拒绝。</HARD-GATE>

3. **写示例文件**:在 `design/_patterns/<name>.tsx` 创建一个最小可运行示例(用 mock),第一行 `// @pattern: <name>`。

4. **写 template**:抽出可复用骨架,业务字段用 `TODO` 注释 + 示例值占位。供 new-design skill 复制。

5. **更新 PATTERNS.md**(上游补丁):
   - `## <name>`
   - **用途** / **骨架** / **Template** / **何时不用**

6. <HARD-GATE>**不要立刻**把这个模式应用到业务稿子里 — 先让用户审阅 PATTERNS.md 的描述、示例与 template。批准后才能在 new-design 中使用。</HARD-GATE>
