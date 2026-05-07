---
name: new-design
description: Generate a new design page in an omit-design project (under design/) from a PRD or "add a page" request. Picks a pattern from preset-mobile, copies its template, fills in fields, registers via auto-discovery. Use when the user wants to scaffold a new design page.
---

# new-design — 从 PRD 生成设计稿

## 何时触发

- 用户提供一份 PRD
- 用户说"做个 XX 页面的稿子"/"加一个 XX 设计稿"

## 决策树(读到这里就停下,先确认 pattern + 白名单)

<HARD-GATE>
**写第一行业务代码前**,必须先确认两件事:

1. **PRD 已指定 pattern**,且该 pattern 名出现在 `node_modules/@omit-design/preset-mobile/PATTERNS.md`(8 个:list-view / detail-view / form-view / sheet-action / dialog-view / welcome-view / dashboard / tab-view)。
   PRD 没指定 → **停下来**,问用户或推荐一个,**不要自作主张**选。

2. **PRD 用得到的所有组件都在白名单里**(`@omit-design/preset-mobile` 的 21 个 Om* 组件)。
   缺组件 → **停下来**告知用户,提议先用 `add-pattern` 或单独加一个白名单组件。
   **绝不**绕过白名单从 `@ionic/react` 直接 import 视觉组件。
</HARD-GATE>

## 执行流程

详见 [references/checklist.md](references/checklist.md) — 7 步完整清单(读 PRD / 读 PATTERNS / 检查白名单 / 准备 mock / **复制 template** / 自检 / 验证)。

**核心**:第 5 步「写页面」实际是「**复制 `node_modules/@omit-design/preset-mobile/templates/<pattern>.tmpl.tsx` 后替换占位符**」,而不是从零写。模板缺失才回退到参考 PATTERNS.md 的"骨架"描述改写,绝不凭空构造 import 与组件结构。

## 输出

完成后告知用户:

- 新文件路径
- 所选 pattern 与原因(以及是否复用了 template)
- mock 数据放在哪里
- 访问 URL(`/designs/<group>/<file>`)

## 反例

- ❌ 用户没给 pattern → 自己选了一个不告知
- ❌ 白名单没有组件 → 直接 `import { Foo } from "@ionic/react"`
- ❌ 写 `<div style={{ padding: 16 }}>`
- ❌ mock 数据塞进 design/ 而不是 mock/
- ❌ template 存在但绕过它从零写骨架
