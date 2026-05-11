# @omit-design/preset-mobile

> [omit-design](https://github.com/leefanv/omit-design) 的默认移动端 preset：`Om*` 组件白名单 + `--om-*` token 体系 + Ionic 8 运行时。

[![npm](https://img.shields.io/npm/v/@omit-design/preset-mobile)](https://www.npmjs.com/package/@omit-design/preset-mobile)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

[English](./README.md)

## 这是什么

`preset-mobile` 是 omit-design 项目默认用的 preset，提供：

- **21 个 `Om*` 组件** — `design/**/*.tsx` 的 import 白名单
- **`--om-*` token 体系**，映射到 Ionic 8 运行时（`--ion-*`）
- **语义色清单 + 主题 baseline** —— 由工作台 theme-editor 消费

Patterns 是 **项目本地** 资产，落在 `<project>/patterns/`。按需由 `/distill-patterns-from-prd` 或 `/add-pattern` 产生 —— 详见 [PATTERNS.md](./PATTERNS.md)。

## 四条硬规则（由 [@omit-design/eslint-plugin](../eslint-plugin/) 强制）

1. **Token 优先**：所有颜色、间距、字号、圆角、阴影必须走 token，**禁止字面量**（`#FF6B00`、`12px`、`16px` 等都不允许出现在业务代码里）。
2. **组件白名单**：业务页面（`design/**`）只能 import `@omit-design/preset-mobile`，**禁止**直接 import `@ionic/react`（例外：`IonList` / `IonBackButton` / `IonIcon`，仅做排版/图标宿主）。
3. **模式标注**：每个业务页面文件头第一行必须是 `// @pattern: <name>`，`<name>` 必须在 [PATTERNS.md](./PATTERNS.md) 里登记。
4. **Pattern 签名组件强制**：声明的 pattern 必须真用其签名组件。每个 pattern 的白名单来自 `<project>/patterns/<id>/pattern.json` —— patterns 是项目本地资产，不再随 preset 发布。

## 组件清单（21 个）

全部从 `@omit-design/preset-mobile` 导出：

| 布局 | 输入 | 展示 | 浮层 |
|---|---|---|---|
| `OmPage` | `OmInput` | `OmCard` | `OmDialog` |
| `OmHeader` | `OmSelect` | `OmListRow` | `OmSheet` |
| `OmAppBar` | `OmSearchBar` | `OmStatCard` | |
| `OmTabBar` | `OmNumpad` | `OmMenuCard` | |
| | `OmButton` | `OmProductCard` | |
| | | `OmCouponCard` | |
| | | `OmSettingRow` | |
| | | `OmEmptyState` | |
| | | `OmTag` | |
| | | `OmOrderFooter` | |

完整列表：[components/index.ts](./components/index.ts)。

## Patterns

Patterns 是 **项目本地** 资产 —— 落在 `<project>/patterns/`，不再随 preset-mobile 发布。新项目 `patterns/` 起步为空。

三条创建路径：

| 路径 | 触发方式 |
|---|---|
| **`/distill-patterns-from-prd`** | 有 PRD。skill 先扫现有 patterns 看能否复用，再为缺口写新 pattern。用工作台 PRDs tab 的 **Distill patterns from this PRD** 按钮 |
| **`/add-pattern`** 对话模式 | 无 PRD。`new-design` 在 `patterns/` 为空时自动调起：5 个固定问题 → 一个最小 pattern |
| 手工 | 工作台 **Library → Patterns → + New**，自己填 4 个字段 |

文件结构与编辑语义见 [PATTERNS.md](./PATTERNS.md)。

## Token 命名

| 类别 | 例子 |
|---|---|
| `--om-color-*` | `--om-color-primary` / `--om-color-text` / `--om-color-text-muted` |
| `--om-spacing-*` | `--om-spacing-xs` (4) … `--om-spacing-xxl` (32) |
| `--om-radius-*` | `--om-radius-sm` / `--om-radius-md` / `--om-radius-lg` |
| `--om-font-size-*` | `--om-font-size-sm` / `--om-font-size-md` / `--om-font-size-lg` |
| `--om-shadow-*` | `--om-shadow-sm` / `--om-shadow-md` |

默认值在 [theme/variables.css](./theme/variables.css)。在项目 CSS 里覆盖：

```css
:root {
  --om-color-primary: #ff6b00;
  --om-radius-md: 8px;
}
```

或用浏览器内的主题编辑器（`/workspace/:projectId/theme-editor`），编辑后写回项目的 `preset/theme.css`。

## 安装

```bash
npm install @omit-design/preset-mobile @omit-design/engine @ionic/react ionicons
```

peer 依赖：`@omit-design/engine ^0.2.0`、`@ionic/react ^8`、`ionicons ^7 || ^8`、`react ^19`、`react-router-dom ^6`。

## 用例

```tsx
// design/main/welcome.tsx
// @pattern: welcome-view
export const meta = {
  name: "欢迎",
  pattern: "welcome-view",
  description: "首启页",
} as const;

import { OmButton, OmPage } from "@omit-design/preset-mobile";

export default function Welcome() {
  return (
    <OmPage padding="none">
      <div style={{ padding: "var(--om-spacing-xl)" }}>
        <h1>你好</h1>
        <OmButton expand="block">开始</OmButton>
      </div>
    </OmPage>
  );
}
```

## 许可

[MIT](../../LICENSE)
