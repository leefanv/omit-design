# new-design 执行清单(完整流程)

主 SKILL.md 已涵盖 HARD-GATE 与触发条件。本文件展开每一步细节。

## 1. 读 PRD,识别 5 件事

- 页面名 + 路由(`/designs/<groupId>/<filename>`)
- **选定的 pattern**(必须出现在 `node_modules/@omit-design/preset-mobile/PATTERNS.md`)
- 关键字段
- 关键状态(空/加载/错误/成功)
- 主操作(放底部 / 顶部 / 内联)

## 2. 读 preset 的 PATTERNS.md

`node_modules/@omit-design/preset-mobile/PATTERNS.md` — 8 个 pattern,每个有「用途」「骨架」「Template」「何时不用」。

## 3. 检查组件白名单

打开 `node_modules/@omit-design/preset-mobile/components/index.ts`,确认 PRD 用得到的所有组件都已导出。

缺组件 → **停下来告知用户**,提议先用 `add-pattern` 或单独加一个白名单组件。**绝不**绕过白名单从 `@ionic/react` 直接 import 视觉组件。

## 4. 准备 mock 数据

- 在 `mock/` 下加文件或扩展现有文件(项目根目录的 `mock/`)
- 字段类型与 PRD 对齐
- 至少 3-5 条样例覆盖不同状态
- 业务稿用相对路径 import,如 `import { items } from "../mock/orders"`

## 5. 复制 template 后替换占位符

优先走 template 路径:

1. Read `node_modules/@omit-design/preset-mobile/templates/<pattern>.tmpl.tsx`
2. 复制到目标位置 `design/[<groupId>/]<filename>.tsx`
3. 替换 `TODO` 占位符与示例字段为业务内容

模板缺失时回退:
- 参考 PATTERNS.md 的「骨架」描述改写
- 不能凭空构造 import 与组件结构

约束:
- **第一行**:`// @pattern: <pattern-name>`
- **import 只能**来自:`@omit-design/preset-mobile`、`react`、`react-router(-dom)`、`ionicons/icons`、白名单 Ionic 容器(`IonList` / `IonBackButton` / `IonIcon`)、相对路径
- **禁止**字面量颜色 / 间距 / 字号(走 `var(--om-*)` 或 Om* 组件 props)

## 6. 自动注册(无需手改路由)

omit-design 用 `import.meta.glob` 自动发现 `design/**/*.tsx`,加文件即生效。Group 来自路径第一段(如 `design/orders/detail.tsx` → group=orders)。

## 7. 自检

- 跑 `npm run lint`,必须通过(0 违规)
- 在 dev server 上访问新路由 `/designs/<group>/<file>`
- 描述视觉给用户(或截图)
