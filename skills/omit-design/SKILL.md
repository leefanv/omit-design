---
name: omit-design
description: AI-collaborative design composition with omit-design. Use when the user is in an omit-design project (has @omit-design/preset-mobile installed and design/ directory) and asks to add or modify design pages, work with patterns, or audit compliance. Covers the three-layer constraint system (skills + ESLint hard rules + templates) that makes AI-generated UI deterministic.
---

# omit-design

设计稿是真实可点击的 React 页面,不是图片。`design/` 下每个 `.tsx` = 一张稿子,自动注册到 `/designs/<group>/<name>` 路由。

## 三层约束(底层契约,不要绕)

1. **Skills** — `.claude/skills/<name>/SKILL.md` 提供领域知识。HARD-GATE 包关键决策点,违反 = 拒绝输出
2. **ESLint plugin** — `@omit-design/eslint-plugin` 三条硬规则:
   - `no-design-literal`:禁止 hex / px / rgb 字面量,走 token
   - `whitelist-ds-import`:`design/` 下只能 import `@omit-design/preset-mobile` + 白名单 Ionic 容器
   - `require-pattern-header`:文件第一行必须 `// @pattern: <name>`
3. **Templates** — `node_modules/@omit-design/preset-mobile/templates/<pattern>.tmpl.tsx` 可复制骨架

`npm run lint` 是单一合规命令(等价 `omit-design lint`),输出 AI 友好的结构化摘要。

## 何时触发哪个 skill

| 用户说什么 | Skill |
|---|---|
| "做个 XX 页"、"加一张订单详情" / 给了 PRD | [new-design](../new-design/SKILL.md) |
| "加一种 wizard 模式" / 现有 pattern 不够 | [add-pattern](../add-pattern/SKILL.md) |
| "稿子合规吗?"、"扫描整仓" | [audit-design](../audit-design/SKILL.md) |
| "怎么 init 项目"、"启动服务"、"跑 lint" | [omit-design-cli](../omit-design-cli/SKILL.md) |

## Pattern 目录(8 个)

`list-view` `detail-view` `form-view` `sheet-action` `dialog-view` `welcome-view` `dashboard` `tab-view`

具体骨架与示例:`node_modules/@omit-design/preset-mobile/PATTERNS.md`。

## 平台约定

- **`<HARD-GATE>` 决策卡点**:Skills 中"AI 容易跳过"的关键决策点必须用 `<HARD-GATE>...</HARD-GATE>` 包起,违反 = 拒绝输出。HARD-GATE 不是装饰;只在该停的地方用
- **`references/` 渐进披露**:主 SKILL.md > 60 行时拆 `references/<topic>.md`,主文件保留触发条件 + 决策树 + HARD-GATE
- **`design/` 是 ESLint 唯一约束目录**:`mock/` `app/` `preset/` 不约束(允许字面量 / 任意 import)

## 反例

- ❌ 在 `design/*.tsx` 里写 `style={{ color: "#FF6B00" }}` — 走 token
- ❌ 从 `@ionic/react` 直接 import `IonButton` — 用 `OmButton`
- ❌ 不读 PATTERNS.md 就编 pattern 名
- ❌ 跳过 HARD-GATE
