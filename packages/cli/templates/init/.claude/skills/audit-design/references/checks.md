# Audit 检查项细节

主 SKILL.md 只列检查项标题。本文件展开每项的具体规则与例外。

## 1. 首行 pattern 标注

文件第一行必须是 `// @pattern: <name>`,name 必须出现在 `node_modules/@omit-design/preset-mobile/PATTERNS.md`。

由 ESLint `omit-design/require-pattern-header` 实施。kebab-case 文件名(如 `order-list.tsx`)是 page 稿,受检;PascalCase 文件名(如 `MemberShell.tsx`)是 shell/组件,免检。

## 2. import 白名单

业务稿 `.tsx`(`design/**/*.tsx`)只能 import:

- `@omit-design/preset-mobile` 及其子路径
- React 系:`react`、`react-dom`、`react-router`、`react-router-dom`
- 图标常量:`ionicons/icons`
- `@ionic/react` 的 named import 仅:`IonList`、`IonBackButton`、`IonIcon`
- 同目录 / 父目录相对路径(用于 import `mock/` 数据 / 项目内 shell)

由 ESLint `omit-design/whitelist-ds-import` 实施。

发现页面用了上面例外之外的 `@ionic/react` 视觉组件 → 提示用户:要么去 `@omit-design/preset-mobile` 加 Om* 封装(走上游 PR),要么扩大白名单(慎重)。

## 3. 无颜色字面量

禁止 `#hex`、`rgb()`、`rgba()`、`hsl()`、`hsla()`、命名色出现在 `style=` 字面量或 `className` 字符串里。允许:`var(...)` / `inherit` / `currentColor` / `transparent` / `0` / `auto` / `none` / 百分比。

由 ESLint `omit-design/no-design-literal` 实施(包括对模板字符串里 CSS 文本的宽松搜索)。

## 4. 无间距/字号字面量

禁止形如 `padding: 16` `marginTop: '12px'` `fontSize: 14` 出现在 `style={{...}}`。改用 token(`var(--om-spacing-*)` 等)或组件 props(`<OmPage padding="lg">`)。

由 ESLint `omit-design/no-design-literal` 实施(`px` 后缀正则)。

## 5. 白名单组件存在

每个 `<OmXxx />` 都必须在 `@omit-design/preset-mobile/components/index.ts` 导出列表中。**audit 流程**额外做这一项检查(ESLint 不直接检查 JSX 标签解析),违规级别 🟢 — 提示加 Om* 封装(走上游 PR)。
