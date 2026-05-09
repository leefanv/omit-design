# @omit-design/preset-mobile

> [omit-design](https://github.com/leefanv/omit-design) 的默认移动端 preset：`Om*` 组件白名单 + `--om-*` token 体系 + Ionic 8 运行时 + 8 个开箱即用 pattern 与对应模板。

[![npm](https://img.shields.io/npm/v/@omit-design/preset-mobile)](https://www.npmjs.com/package/@omit-design/preset-mobile)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

[English](./README.md)

## 这是什么

`preset-mobile` 是 omit-design 项目默认用的 preset，提供：

- **21 个 `Om*` 组件** — `design/**/*.tsx` 的 import 白名单
- **`--om-*` token 体系**，映射到 Ionic 8 运行时（`--ion-*`）
- **8 个 pattern** + 对应的 `.tmpl.tsx` 模板（`omit-design new-page` 消费）
- **`patterns.config.json`** — pattern → 签名组件映射，由 `require-pattern-components` ESLint 规则消费

## 四条硬规则（由 [@omit-design/eslint-plugin](../eslint-plugin/) 强制）

1. **Token 优先**：所有颜色、间距、字号、圆角、阴影必须走 token，**禁止字面量**（`#FF6B00`、`12px`、`16px` 等都不允许出现在业务代码里）。
2. **组件白名单**：业务页面（`design/**`）只能 import `@omit-design/preset-mobile`，**禁止**直接 import `@ionic/react`（例外：`IonList` / `IonBackButton` / `IonIcon`，仅做排版/图标宿主）。
3. **模式标注**：每个业务页面文件头第一行必须是 `// @pattern: <name>`，`<name>` 必须在 [PATTERNS.md](./PATTERNS.md) 里登记。
4. **Pattern 签名组件强制**：声明的 pattern 必须真用其签名组件。`@pattern: list-view` 必须 import `OmListRow` / `OmCouponCard` / `OmSettingRow` / `OmProductCard` / `OmMenuCard` / `OmEmptyState` 至少一个；`@pattern: form-view` 必须 import `OmInput` / `OmSelect` / `OmNumpad` 至少一个；其它 pattern 同理。映射见 [`patterns.config.json`](./patterns.config.json)。

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

## Patterns（8 个）

每个 pattern 自带：
- [PATTERNS.md](./PATTERNS.md) 里一段文档
- 一份可复制的 `.tmpl.tsx` 模板

| Pattern | 适用场景 |
|---|---|
| `dashboard` | 统计卡 + 入口磁贴（咖啡店 POS 首页、admin 总览） |
| `list-view` | 带筛选 / 搜索的纵向列表 |
| `detail-view` | 单条记录详情（订单、商品、会员） |
| `form-view` | 输入密集的编辑 / 创建表单 |
| `dialog-view` | 标题 + 内容 + 操作按钮的模态 |
| `sheet-action` | 底部弹起的快捷操作 |
| `tab-view` | 顶部分段切换 |
| `welcome-view` | 首启 / 引导页 |

从 pattern 生成新页面：

```bash
npx omit-design new-page list-view design/orders/list
# → design/orders/list.tsx 已含 list-view 骨架
```

### 加 / 改 pattern

用 `add-pattern` skill（或手工）新增 pattern 时，要同步三处：
1. [`PATTERNS.md`](./PATTERNS.md) — pattern 意图和骨架的人类文档
2. [`templates/<name>.tmpl.tsx`](./templates/) — 可复制骨架，`omit-design new-page` 消费
3. [`patterns.config.json`](./patterns.config.json) — pattern 必须的签名组件清单（被 `require-pattern-components` ESLint 规则读）

签名组件是"没有就不算这个 pattern"的最小集 — `list-view` 是"任一列表行 / 空态组件"；`form-view` 是"任一输入组件"。是 anyOf 关系，import 一个就过。

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
