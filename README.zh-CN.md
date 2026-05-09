<div align="center">

# omit-design

**AI 协作式设计编排框架**
*用 TSX 写设计稿、用硬规则 lint、本地预览 — 无云端、无账号。*

[![npm engine](https://img.shields.io/npm/v/@omit-design/engine?label=engine)](https://www.npmjs.com/package/@omit-design/engine)
[![npm cli](https://img.shields.io/npm/v/@omit-design/cli?label=cli)](https://www.npmjs.com/package/@omit-design/cli)
[![CI](https://github.com/leefanv/omit-design/actions/workflows/ci.yml/badge.svg)](https://github.com/leefanv/omit-design/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

[English](./README.md) · [架构](./docs/architecture.md) · [更新日志](./CHANGELOG.md) · [贡献指南](./CONTRIBUTING.md)

</div>

---

## 这是什么

omit-design 是一个面向 "人 + AI 协作出 UI" 场景的设计框架：

- **设计稿就是真实 React 页面**。每张"设计稿"都是可点、可跳转的 TSX 组件 — 不是图片、不是 Figma 框。同一份 TSX 在 dev server / 生产构建 / Figma 插件之间双向流转。
- **AI 输出在四层确定性约束里**：Skills（自然语言指引）、ESLint 四条硬规则（禁字面量 / 白名单 import / 强制 pattern 头 / pattern 签名组件强制）、按 pattern 复制的模板。`npm run lint` 是单一合规闸门 — 同时挂在 git pre-commit hook 上，违规无法 commit。
- **本地优先、零账号**。无云端、无认证、无埋点。Dev server / 标注 overlay / 主题编辑器 / Figma 导出 全部跑在浏览器里。

## 5 分钟快速上手

```bash
npx @omit-design/cli init my-app
cd my-app
npm install
npm run dev
```

打开 `http://localhost:5173/`。脚手架自带 `design/welcome.tsx`。新增页面 = `design/<group>/<name>.tsx`，自动发现，路由自动是 `/designs/<group>/<name>`。

```bash
# 1. 新建项目
npx @omit-design/cli init cafe-pos
cd cafe-pos && npm install

# 2. 用 pattern 模板生成新页面
npx omit-design new-page list-view design/orders/list

# 3. 启动设计 server（底层是 Vite）
npm run dev    # http://localhost:5173/

# 4. 跑四条硬规则（git commit 时也会自动跑，挡掉违规提交）
npm run lint   # 拦字面量 / 非白名单 import / 缺 @pattern 头 / pattern 没用对应签名组件

# 5. omit-design 发布新版后，一键升级
npx omit-design upgrade   # 升 deps + 扫项目里残留的旧类名
```

## 架构总览

```
┌────────────────────────────────────────────────────────────────────┐
│                       AI agent / 人类作者                            │
│                  (主对话 = "director" 调度者)                        │
└────────────────────────────────────────────────────────────────────┘
        │              │              │                  │
        ▼              ▼              ▼                  ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────────┐
│ .claude/    │ │ ESLint 4 条 │ │ Pattern     │ │ .claude/agents/│
│   skills/   │ │  硬规则     │ │   模板      │ │  pattern-      │
│ （自然语言   │ │ （确定性    │ │ （复制粘贴） │ │    applier     │
│   指引）    │ │   闸门）    │ │             │ │   audit-       │
│             │ │             │ │             │ │    reviewer    │
└─────────────┘ └─────────────┘ └─────────────┘ └────────────────┘
        │              │              │                  │
        └──────────────┴──────┬───────┴──────────────────┘
                              ▼
        ┌────────────────────────────────────────────────────┐
        │           design/<group>/<file>.tsx                │
        │      （真实 React 页面 — dev + prod 都跑）          │
        │            ↑ husky pre-commit 闸门                 │
        └────────────────────────────────────────────────────┘
                                 │
                                 ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ @omit-design/engine                                         │
   │   shell/    画布化工作台 UI（Figma 风格布局）                 │
   │   registry/ 设计稿发现 + 注册中心                             │
   │   inspect/  开发时 hover/measure/a11y 标注                  │
   │   capture/  DOM → FigmaNode JSON → @omit-design/figma-plugin│
   │   theme-editor/  所见即所得的 token 编辑器                    │
   └─────────────────────────────────────────────────────────────┘
```

详细模块依赖图见 [docs/architecture.md](./docs/architecture.md)。

## 包列表

| 包 | 版本 | 作用 |
|---|---|---|
| [`@omit-design/cli`](./packages/cli/) | [![npm](https://img.shields.io/npm/v/@omit-design/cli?label=)](https://www.npmjs.com/package/@omit-design/cli) | CLI — `init`（含 husky + git + agents）/ `dev` / `lint` / `new-page` / `skills update` / `upgrade` |
| [`@omit-design/engine`](./packages/engine/) | [![npm](https://img.shields.io/npm/v/@omit-design/engine?label=)](https://www.npmjs.com/package/@omit-design/engine) | 运行时 — registry / discovery / inspect / theme-editor / capture / 画布 shell |
| [`@omit-design/eslint-plugin`](./packages/eslint-plugin/) | [![npm](https://img.shields.io/npm/v/@omit-design/eslint-plugin?label=)](https://www.npmjs.com/package/@omit-design/eslint-plugin) | 四条硬规则 |
| [`@omit-design/preset-mobile`](./packages/preset-mobile/) | [![npm](https://img.shields.io/npm/v/@omit-design/preset-mobile?label=)](https://www.npmjs.com/package/@omit-design/preset-mobile) | 移动端 preset：21 个 `Om*` 组件 + token + 8 个 pattern + 模板 |
| [`@omit-design/figma-plugin`](./packages/figma-plugin/) | [![npm](https://img.shields.io/npm/v/@omit-design/figma-plugin?label=)](https://www.npmjs.com/package/@omit-design/figma-plugin) | Figma 插件 — 把 capture 的 JSON 导成可编辑 Frame |

## 四条硬规则

由 `@omit-design/eslint-plugin` 强制，作用域 `design/**`：

1. **禁字面量**。`#FF6B00` / `16px` / `8px` 这种原始色值或像素值不允许出现在业务设计稿里 — 必须走 token：`var(--om-color-primary)`、`var(--om-spacing-md)` 等。
2. **白名单 import**。设计稿只能 `import` 自 `@omit-design/preset-mobile`（`Om*` 白名单），加上少数仅做排版/图标宿主的 Ionic 组件（`IonList` / `IonBackButton` / `IonIcon`）。不允许深入框架内部。
3. **强制 pattern 头**。每个设计稿首行注释必须是 `// @pattern: <name>`，`<name>` 必须在 [PATTERNS.md](./packages/preset-mobile/PATTERNS.md) 里登记。Pattern 是设计稿编目的单位 — 没有它，AI 无法可靠地推断应该套哪个模板。
4. **Pattern 签名组件强制**。声明的 pattern 必须真用其签名组件 — `@pattern: list-view` 必须 import `OmListRow` / `OmCouponCard` / `OmSettingRow` / `OmProductCard` / `OmMenuCard` / `OmEmptyState` 至少一个；`@pattern: form-view` 必须 import `OmInput` / `OmSelect` / `OmNumpad` 至少一个；其它 pattern 同理。映射见 [`patterns.config.json`](./packages/preset-mobile/patterns.config.json)。防止 AI 挂着 `@pattern: list-view` 头但只写一个 `OmCard` 的"假列表"。

`npm run lint` 任一违反就 exit 非零。`init` 时自动安装的 husky pre-commit hook 会在每个 `git commit` 时跑同一份检查 — 违规无法静默进仓。

## Skill 目录（三段）

`init` 时自动 sync 进 `.claude/skills/`，Claude Code 自动加载：

| 阶段 | Skill | 何时用 |
|---|---|---|
| **入口** | `start` | 开放性请求、刚 init 完、"接下来该做什么？" — 诊断项目状态后推荐唯一一条 skill |
| **入口** | `omit-design-cli` | 关于 init / dev / lint / new-page 命令的问题 |
| **制作** | `new-design` | "做一张 X 页面" / 给了 PRD |
| **制作** | `add-pattern` | 现有 8 个 pattern 不够用 |
| **交付** | `audit-design` | 全仓批量审查 |
| **交付** | `ship-design` | 单页发布（lint + a11y + 截图一气呵成） |

主对话保持 director 角色；当配置了 `.claude/agents/` 里的 sub-agents（`pattern-applier` / `audit-reviewer`），重活会自动委托到独立 context 跑，不污染主对话。

## 设计哲学

| | |
|---|---|
| **TSX 是唯一真相** | 设计稿就是 React 页面。和 Figma 的双向往来通过 `capture`（DOM → JSON → 插件）实现，但权威资产留在代码里。 |
| **本地优先** | 0 账号、0 服务器、0 出网。标注 overlay 和主题编辑器都离线工作。 |
| **AI 是合作者** | Lint 规则 + pattern 模板不是"求你别坏" — 是 agent 输出必须过的确定性闸门。 |
| **源码即产物** | `@omit-design/engine` 和 `@omit-design/preset-mobile` 直接发 TypeScript 源码，不构建。消费方的 Vite 自己编译。包小、source-map 体验好。 |

## 状态

**Pre-1.0（当前 0.2.x）**。API 仍在演进 — minor 版本可能含 breaking change。删过的类名 `omit-design upgrade` 会扫描并提示，让升级一条命令完成。详细变更见 [CHANGELOG.md](./CHANGELOG.md)。

内部已在生产用（一个咖啡店 POS app + 几个其他 app 在开发中），但毛刺难免。Issue + PR 都欢迎。

## 升级老项目

老项目锁着旧版本？一条命令：

```bash
npx @omit-design/cli@latest upgrade
```

它会：
1. 扫 `package.json` 里所有 `@omit-design/*` 依赖
2. 查 npm 拿 `latest` 版本
3. 改写 version range 为 `^X.Y.Z`
4. 自动检测 lockfile 跑对应 `bun install` / `pnpm install` / `yarn install` / `npm install`
5. grep 项目源码里历次发布删过的 class / API，按 file:line 报告并给出迁移建议

加 `--dry-run` 预览、加 `--check` 当 CI 闸门（有更新就 exit 1）。

## 贡献

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。一句话：

```bash
git clone https://github.com/leefanv/omit-design.git
cd omit-design
bun install        # workspaces：engine / cli / preset-mobile / eslint-plugin / figma-plugin
bun run lint
bun --cwd packages/engine run typecheck
```

CI 闸门：`bun run lint` + 每个包 `tsc --noEmit`。pre-1.0 暂不写测试 — surface 还在动。

## 许可

[MIT](./LICENSE) © omit-design contributors。
