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

- [ ] **publish 流程**:CI 跑 `tsc --noEmit` + `eslint .`;`npm publish` 5 个包(注意 access public + 顺序依赖)
- [ ] **真实 `npx omit-design init` 烟雾测试**:发到 npm 后,clean shell 跑 `npx omit-design init test-app && cd test-app && npm install && npm run dev`,确认所有 deps 从 registry 解析
- [ ] **figma-plugin zip 重打**:目前的 `omit-web-to-figma.zip` 是从 pos-design 仓拷过来的;omit-design 仓里 `npm run build:figma-plugin` 还没接上(scripts/zip-figma-plugin.mjs 没迁过来)。要么补这个脚本,要么文档化"用户自己解压目录装"
- [ ] **engine 加 `tsconfig.json`**:engine 自己的 typecheck 现在走消费方;独立 tsc 能更早抓 bug
- [ ] **CHANGELOG.md**:第一版手写,后续接 changesets

### P1:文档与 DX

- [ ] **README "Getting Started" 章节**:`npm install -g @omit-design/cli` 或 `npx`,五步上手
- [ ] **engine 包 README**:每个子模块(registry / discovery / inspect / theme-editor / capture / shell)一段
- [ ] **preset-mobile 组件文档**:21 个 Om* 组件 props 表 + 截图(可后续做)
- [ ] **`omit-design --help` 输出**:citty 默认 help 够用,但每个 command 加 `examples` 字段更友好

### P2:浏览器实测 + 修复运行时 bug

- [ ] 用 Playwright / 手动浏览器加载 `/designs/main/welcome`,确认 React 不抛运行时错
- [ ] 进 `/workspace` → 进项目 → 看缩略图(以前 cloud 缓存路径已剥,只剩 capture 流程,需要测)
- [ ] 进 `/workspace/app/theme-editor` 改 token,确认实时生效 + 发布下载 `theme.css`
- [ ] 开 Inspect overlay,hover Om* 元素,看组件名 + token 显示
- [ ] Figma 插件流程:导出 JSON → Figma 拖入 → Frame 生成

### P3:补强

- [ ] **`omit-design skills update`** 命令:升级项目 `.claude/skills/` 到最新版
- [ ] **`omit-design new-page <pattern> <path>`**(可选):agent 走 skill,人也可以直接命令
- [ ] **包之间循环依赖审计**:engine + preset-mobile 通过 manifest 类型耦合,审一遍
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
