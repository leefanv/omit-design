# omit-design preset-mobile — 设计模式目录

所有业务页面(`design/**/*.tsx`)必须从这里挑一个模式作为骨架,并在文件头标注 `// @pattern: <name>`。

新增模式 → 用 `.claude/skills/add-pattern`。

每个 pattern 都有可复制的 **Template**。`new-design` skill 优先复制对应模板,再替换占位符。

---

## list-view

**用途**:一屏内展示同质条目的集合,每个条目可点击进详情。

**骨架**:
- `OmHeader` — 标题(含或不含返回)
- 可选:`OmSearchBar` / tab 条 / 分类胶囊
- `IonList` 或原生 `div` 包裹一组行(`OmListRow` / `OmCouponCard` / `OmSettingRow` / 自定义卡)
- 列表空态:`OmEmptyState` 居中提示

**Template**:[./templates/list-view.tmpl.tsx](./templates/list-view.tmpl.tsx)

**何时不用**:条目数 ≤ 3 → 用 `dashboard` 或单独卡片

---

## detail-view

**用途**:从列表跳进的单条详情,通常带主操作按钮。

**骨架**:
- `OmHeader` + `IonBackButton`(返回上一级)
- `OmCard`(基本信息)
- 0~N 个 `OmCard` / 列表分块(关联信息分区)
- 底部 1 个主操作 `OmButton expand="block"` 或「取消 / 确认」双按钮

**Template**:[./templates/detail-view.tmpl.tsx](./templates/detail-view.tmpl.tsx)

**何时不用**:编辑场景 → 用 `form-view`

---

## form-view

**用途**:新建或编辑一条记录。

**骨架**:
- `OmHeader` + `IonBackButton`(返回/取消)
- 一组 `OmInput` / `OmSelect`,按业务分组
- 内联错误态(红框 + 红色辅助文案)
- 底部固定 `OmButton expand="block"` 提交
- 可选:提交结果用 `OmDialog` 弹出

**Template**:[./templates/form-view.tmpl.tsx](./templates/form-view.tmpl.tsx)

---

## sheet-action

**用途**:从底部弹起的操作菜单 / 详情抽屉,避免离开当前上下文。设计稿语境下不走 JS 回调,而是每个 sheet 一张独立稿(同 `dialog-view` 哲学)。

**骨架**:
- `OmPage padding="none"`
- `OmSheet title="..." dismissHref="..."` 内部放:
  - 一组按钮条(菜单形态)
  - 或纯信息块(明细形态)
- 关闭行为:点击 scrim / 右上 × / 菜单条任意一项跳转走

**Template**:[./templates/sheet-action.tmpl.tsx](./templates/sheet-action.tmpl.tsx)

**何时不用**:只展示一句提示 + 单按钮 → `dialog-view`;需要录入 → `form-view`

---

## dialog-view

**用途**:把一个"对话框状态"当成一张独立的设计稿。设计稿工具语境下,弹窗不是 JS 回调,而是一张可独立访问的稿 — 每个状态有 URL、侧边目录里可点。

**骨架**:
- `OmPage padding="none" header={<OmHeader .../>}`(通常复用来源页的 header)
- 背景层:来源页的 frozen 快照(表单禁用,仅作视觉背景),或纯渐变背景
- `OmDialog` — icon / title / subtitle + 一个主按钮;按钮通过 `confirmHref` 跳转到下一张稿

**Template**:[./templates/dialog-view.tmpl.tsx](./templates/dialog-view.tmpl.tsx)

**何时不用**:需要输入 / 选项 → 独立 `form-view`;纯操作菜单 → `sheet-action`

---

## welcome-view

**用途**:启动 / 欢迎 / 引导页。品牌 logo + 一句话欢迎语 + 单一主 CTA。不接任何表单。

**骨架**:
- `OmPage padding="none"` 自己控制留白
- 品牌头区:LOGO + 品名(可含副标题)
- 欢迎语:主标题 + 描述
- 底部单一 `OmButton expand="block"` 主操作
- 可选:最底部版本号

**Template**:[./templates/welcome-view.tmpl.tsx](./templates/welcome-view.tmpl.tsx)

**何时不用**:带输入 → `form-view`;功能介绍多屏滑动 → 需新增 `onboarding-carousel` 模式

---

## dashboard

**用途**:工作台 / 首页式聚合页 — 顶部状态指标(数字卡)+ 功能宫格入口。
非 tab 导航、非列表、非表单,而是多入口聚合。

**骨架**:
- `OmHeader` + 返回
- 若干 `OmStatCard`(指标区)
- 3 列 `OmMenuCard` 宫格(主功能入口,可用 `disabled + badge="二期"` 标灰态)

**Template**:[./templates/dashboard.tmpl.tsx](./templates/dashboard.tmpl.tsx)

**何时不用**:单一主操作 → `welcome-view`;扁平列表 → `list-view`

---

## tab-view

**用途**:底部主导航 tab 之一 — 主品牌 header + 主体内容 + 底部 4 个 tab 切换。

**骨架**:
- `OmAppBar variant="brand"` 顶部品牌标题 + 右上角头像
- 主体内容(表单 / 列表 / 卡片 / 空态)
- 底部 `OmTabBar` 多个主 tab

**Template**:[./templates/tab-view.tmpl.tsx](./templates/tab-view.tmpl.tsx)

**何时不用**:无底部 tab 导航(如独立表单页)→ `form-view`
