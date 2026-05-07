# @omit-design/preset-mobile

omit-design 的默认移动端 preset:Om* 组件白名单 + `--om-*` token 体系 + Ionic 8 运行时。

## 三条硬规则(由 [@omit-design/eslint-plugin](../eslint-plugin/) 强制)

1. **Token 优先**:所有颜色、间距、字号、圆角、阴影必须走 token,**禁止字面量**(`#FF6B00`、`12px`、`16px` 等都不允许出现在业务代码里)
2. **组件白名单**:业务页面(`design/**`)只能 import `@omit-design/preset-mobile`,**禁止**直接 import `@ionic/react`(例外:`IonList` / `IonBackButton` / `IonIcon`,仅做排版/图标宿主)
3. **模式标注**:每个业务页面文件头第一行必须是 `// @pattern: <name>`,name 必须存在于 [PATTERNS.md](./PATTERNS.md)

## 组件清单

21 个 Om* 组件,全部从 `@omit-design/preset-mobile` 导出:

`OmPage` `OmHeader` `OmAppBar` `OmButton` `OmCard` `OmListRow` `OmInput` `OmSelect` `OmDialog` `OmTabBar` `OmNumpad` `OmSearchBar` `OmProductCard` `OmEmptyState` `OmTag` `OmOrderFooter` `OmCouponCard` `OmStatCard` `OmMenuCard` `OmSettingRow` `OmSheet`

详见 [components/index.ts](./components/index.ts)。

## 设计模式

8 个开箱即用的 pattern,每个有可复制的 template:

`list-view` `detail-view` `form-view` `sheet-action` `dialog-view` `welcome-view` `dashboard` `tab-view`

详见 [PATTERNS.md](./PATTERNS.md)。

## Token 命名

`--om-color-*` `--om-spacing-*` `--om-radius-*` `--om-font-size-*` `--om-shadow-*` 详见 [theme/variables.css](./theme/variables.css)。
