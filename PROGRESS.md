# omit-design 进度

> 公开追踪文件,git 跟踪。日期格式:YYYY-MM-DD。

## 项目目标

参照 [hyperframes](https://github.com/heygen-com/hyperframes) 的开源 CLI 模式,做一个**简版**:

- 没有云端账号 / 服务端 / 部署
- 本地启动 dev server,agent 通过 `npx omit-design init <name>` 新建项目
- 仓库承载**底层约束 + 核心业务模块**(三层 AI 协作约束 + engine + figma-plugin)
- v1 不发示例项目;`init` 脚手架自带一张 demo 即可

## v0.1 现状

### 已完成 ✅

| 模块 | 路径 | 状态 |
|---|---|---|
| 仓库骨架 | `package.json` / `README.md` / `LICENSE` (MIT) / `CONTRIBUTING.md` | ✅ |
| `@omit-design/cli` | `packages/cli/` | ✅ 三命令 init / dev / lint(citty) |
| `@omit-design/engine` | `packages/engine/` | ✅ registry / discovery / inspect / theme-editor / capture / shell;云端代码已剥;path-flexible globDiscovery |
| `@omit-design/eslint-plugin` | `packages/eslint-plugin/` | ✅ 三条硬规则,文案改为 `--om-*` / `Om*` |
| `@omit-design/preset-mobile` | `packages/preset-mobile/` | ✅ 21 个 Om* 组件(Pos→Om 全量改名),`--om-*` token,8 个 pattern + 8 个 .tmpl.tsx |
| `@omit-design/figma-plugin` | `packages/figma-plugin/` | ✅ Figma 插件,云端调用已剥 |
| Skills | `skills/{omit-design,omit-design-cli,new-design,add-pattern,audit-design}/` | ✅ HARD-GATE 决策卡点 + references 渐进披露 |
| init 脚手架 | `templates/init/` + `packages/cli/templates/init/` | ✅ 单项目目录,自带 demo 稿 + .claude/skills/ |
| Pos→Om 迁移脚本 | `scripts/migrate-pos-to-om.mjs` | ✅ 一次性脚本,跑完已不再需要 |

### 端到端联调通过(2026-05-07)✅

在 `/tmp/omit-test/`(`omit-design init omit-test` 生成,`file:` 链 4 个本地包):

| 检查 | 退出码 | 结果 |
|---|---|---|
| `npx tsc --noEmit` | 0 | 零类型错误(包含 file: 链入的 engine 源码) |
| `npm run lint`(干净) | 0 | `✓ 合规检查通过(1 个文件,0 违规)` |
| `npm run lint`(注入 `#FF6B00` + `16px`) | 1 | `🟡 [omit-design/no-design-literal] design/welcome.tsx:17:61 — \`#FF6B00\` → 走 token: var(--om-*) ...` |
| `npm run dev` | running | Vite 6.4.2 boot,485ms |
| `curl /` + `curl /designs/main/welcome` | HTTP 200 | SPA fallback 正常 |
| Vite 转译 design / preset-mobile / engine source | OK | 跨包 source-only 解析成功 |

详见 commit [`73992f1`](#) 的 message。

### 联调暴露并已修的问题

1. **preset-mobile peer dep 太窄**:`ionicons "^7"` 与 `@ionic/react@8.8` 拉来的 `ionicons@8` 冲突 → 改 `"^7 || ^8"`
2. **`DesignModule` 类型未 re-export**:脚手架 `main.tsx` 用 `import.meta.glob<DesignModule>(...)` 拿不到该类型 → engine/discovery/index.ts 补 export
3. **`shell/panels/OverviewPanel.tsx` 路径深度算错**:depth-2 文件被批量 sed 加了一个 `../` 而非 `../../` → 手动修
4. **脚手架缺 `vite-env.d.ts`**:tsc 看不到 `import.meta.glob` 与 `*.css` 模块声明 → 补 `/// <reference types="vite/client" />`
5. **engine source 解析 React 类型**:omit-design 仓根加 `@types/react @types/react-dom` devDep,让 file: 链消费方沿 symlink 走通

## 显式不做(v0.1)

| 不做 | 原因 |
|---|---|
| 云端账号 / API | 简版 OSS,纯本地 |
| Studio(浏览器内可视化编辑器) | 已有 inspect / theme-editor,够用;Studio 留 v2 |
| AI gen / BYOK | 与云端绑定 |
| 多 preset(desktop / 小程序) | 只发 preset-mobile;其他 preset 后续按需 |
| 示例项目仓 | `init` 脚手架就是唯一示例 |
| Mono-repo `init`(workspace 项目结构) | 单一项目目录;复杂项目留 v2 |
| 其他 CLI 命令(`render` / `publish` / `add` / `inspect`(子命令) / `capture`(子命令) / `doctor` / `new-page` / `cloud / publish`) | 三命令足够覆盖核心循环 |

## 还没做的事(发包前必做)

### P0:发包准备

- [x] **publish 流程**:GitHub Actions CI(`.github/workflows/ci.yml`)跑 typecheck + lint;`npm publish` 5 个包(`publishConfig.access: public` 写进每个 package.json,无须传 flag)
- [x] **真实 `npx omit-design init` 烟雾测试**:见下文 "v0.1.0 发包记录"
- [x] **figma-plugin zip 重打**:[scripts/zip-figma-plugin.mjs](scripts/zip-figma-plugin.mjs)(用 `zip` 命令)+ `bun --cwd packages/figma-plugin run build:zip`
- [x] **engine 加 `tsconfig.json`**:[packages/engine/tsconfig.json](packages/engine/tsconfig.json) + `bun --cwd packages/engine run typecheck`
- [x] **CHANGELOG.md**:[CHANGELOG.md](CHANGELOG.md) Keep a Changelog 格式

### P1:文档与 DX

- [ ] **README "Getting Started" 章节**:`npm install -g @omit-design/cli` 或 `npx`,五步上手
- [ ] **engine 包 README**:每个子模块(registry / discovery / inspect / theme-editor / capture / shell)一段
- [ ] **preset-mobile 组件文档**:21 个 Om* 组件 props 表 + 截图(可后续做)
- [x] **`omit-design --help` 输出**:cli.ts 顶层 description 加 Quick start;subcommand description 保持单行(避免破坏顶层 list 渲染);完整示例放 [packages/cli/README.md](packages/cli/README.md) 的 Examples 章节(citty 的 `CommandMeta` 没有独立 `examples` 字段)

### P2:浏览器实测 + 修复运行时 bug

#### 实测通过(2026-05-08,Claude Preview MCP)

- [x] **`/designs/main/welcome` 渲染**:welcome 设计稿正常显示(9:41 + 标题 + 按钮),0 console error
- [x] **`/workspace` → ProjectsHome**:1 项目卡片 + grid 布局 + MOBILE 标签 + iframe 缩略图
- [x] **`/workspace/app` → ProjectDetail**:分组目录 + 1 张稿(主页·欢迎 @welcome-view)+ 缩略图
- [x] **`/workspace/app/theme-editor` 渲染**:左侧组件目录 + 右侧 颜色/间距 token 表(primary/secondary/...);`--ion-color-primary` / `--om-spacing-md` 正确注入 :root
- [x] **Inspect overlay**:点 OmButton 自动选中,Properties 面板显示 `color=primary` `radius=md` + COMPUTED 尺寸/字体 + EXPORT @1x/@2x/@3x
- [x] **Figma 导出 dialog**:dialog 弹出,捕获稿件下拉、捕获并下载 JSON、捕获全部 bundle、Tokens.json、下载插件 .zip 全部按钮齐
- [ ] (人工)theme token 改值 → apply → 设计稿实时变色:自动化未跑,留人工
- [ ] (人工)Figma 插件 import JSON → Frame 生成:需 Figma 桌面版,留人工

#### 实测暴露并修复的 bug

1. **shell/styles.css 永远不被 import** —— `packages/engine/src/shell/index.ts` 只 export 组件,从不 import 自己的 styles.css(包含 shell.css / workspace.css / device-frame.css / device-toolbar.css / sidebar.css / right-panel.css / studio.css / capture/export-dialog.css)。脚手架 main.tsx 也只 import preset-mobile,所以 shell 完全无样式(链接默认蓝下划线 + 无 grid)。
   - **修复**:`shell/index.ts` 顶部加 `import "./styles.css";`,同时把 `engine/package.json` 的 `sideEffects: false` 改成 `["**/*.css"]`(防止 prod build 摇掉 CSS)
   - 修后视觉验证 ✓:工作台 banner 紫色 logo + 项目卡 grid + 设备框 iPhone 14 + inspect 右侧面板布局齐

### P3:补强

- [x] **`omit-design skills update`** 命令(2026-05-08):同步 cli 内置 `templates/init/.claude/skills/` 到当前项目 `./.claude/skills/`。`--dry-run` 仅预览;`--target` 改目标目录。报告 `+ 新增 / ~ 更新 / = 一致` 三类。幂等。实现:[packages/cli/src/commands/skills.ts](packages/cli/src/commands/skills.ts)
- [x] **`omit-design new-page <pattern> <path>`**(2026-05-08):从 `node_modules/@omit-design/preset-mobile/templates/<pattern>.tmpl.tsx` 复制到目标路径(自动加 `.tsx`)。校验 pattern 存在,目标已存在需 `--force`,目标不在 `design/` 下警告。验证:dev server 立即识别新稿,路由 `/designs/<group>/<name>` 自动可访问。实现:[packages/cli/src/commands/new-page.ts](packages/cli/src/commands/new-page.ts)
- [x] **包之间循环依赖审计**(2026-05-08):无运行时循环。依赖图: `preset-mobile ──(type-only peer)──> engine`,其余 4 个包均无 inter-package dep。修了 1 处缺失声明:`preset-mobile/package.json` 的 peerDependencies 加上 `@omit-design/engine: ^0.1.0`(原先 catalog.tsx / preset.manifest.ts 用了 engine 的 type 但未声明)
- [ ] **HMR 体验**:design/ 文件改后局部刷新(目前是 vite 整页 reload)

## v0.2+ 可能的方向

- desktop preset(`@omit-design/preset-desktop`)
- 小程序 preset
- Studio(浏览器内可视化编辑器,zero auth)
- `omit-design pattern publish`:把 pattern 推到 registry(共建 pattern 库)
- pre-built `.d.ts` + `.js` 发 npm(脱离 source-only 模式)

## 仓库链接

- 主仓:`/Users/fan/Documents/GitHub/omit-design/`(本地,未推 GitHub)
- 来源参考:`/Users/fan/Documents/GitHub/pos-design/`(冰封,不动)
- 模式参照:`/Users/fan/Documents/GitHub/hyperframes/`

## 提交历史

| Commit | 内容 |
|---|---|
| `570c583` | feat: initial omit-design repo (CLI + engine + preset-mobile + skills) |
| `73992f1` | fix(integration): pass tsc + npm run lint + npm run dev end-to-end |
| `327b95e` | docs: add PROGRESS.md tracking v0.1 status + remaining work |
| `3192f59` | feat(release-prep): v0.1.0 publish readiness + smoke-test bug fixes |
