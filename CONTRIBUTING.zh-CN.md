# 贡献 omit-design

欢迎提 issue / PR / 报 bug。当前是单维护者小项目。

[English](./CONTRIBUTING.md)

## 仓库结构

```
omit-design/
├── packages/
│   ├── cli/                @omit-design/cli
│   ├── engine/             @omit-design/engine
│   ├── eslint-plugin/      @omit-design/eslint-plugin
│   ├── preset-mobile/      @omit-design/preset-mobile
│   └── figma-plugin/       @omit-design/figma-plugin
├── examples/
│   └── playground/         本地预览 app — 通过 workspace 链到 packages/*
├── skills/                 Claude Code skills（同步到 init 脚手架）
├── templates/init/         `omit-design init` 用的脚手架
├── docs/                   架构 / 发版手册 / 迁移指南
└── scripts/                内部构建 / 同步脚本
```

## 本地开发

```bash
git clone https://github.com/leefanv/omit-design.git
cd omit-design
bun install                 # workspaces
bun run lint
bun --cwd packages/cli run typecheck
bun --cwd packages/engine run typecheck
```

### 跑 playground

`examples/playground` 是一个真实的 omit-design 项目，通过 `workspace:*` 链到本地 engine + preset。这是验证改动的最快路径：

```bash
bun --filter @omit-design/playground run dev
# http://localhost:5173/workspace/playground
```

改 `packages/engine/src/...` 后 Vite HMR 立即生效。

### 本地测 CLI

```bash
bun --cwd packages/cli run build
node packages/cli/dist/cli.js init /tmp/test-app
cd /tmp/test-app && npm install && npm run dev
```

## 加新东西

### 加一条 CLI 命令
1. `packages/cli/src/commands/<name>.ts`，用 citty 定义
2. `packages/cli/src/cli.ts` 的 `subCommands` 注册
3. 更新 [packages/cli/README.md](./packages/cli/README.md) 和 `skills/` 里相关 skill
4. 如果是顶层工作流命令，更新 root README

### 加一个 pattern
用 `add-pattern` skill 或手工：
1. 在 `packages/preset-mobile/PATTERNS.md` 加段
2. 在 `packages/preset-mobile/templates/<name>.tmpl.tsx` 放可复制骨架
3. 评审后再用到业务稿

### 加一个 skill
`skills/<name>/` 下放 `SKILL.md` + 可选 `references/<topic>.md`（渐进披露）。
发版前同步到脚手架：
```bash
node scripts/sync-skills.mjs
```

## 代码风格

- **全 TypeScript**。`packages/` 下不允许新增 `.js` 源文件
- **不用 `any`**。要么写真类型，要么 `unknown` + narrow
- **设计稿里不准字面量**。lint 拦着，agent 和人类一视同仁
- **注释只写 *为什么*，不写 *做什么***。`// @pattern: ...` 是唯一强制注释
- **conventional commits**。`feat(scope): ...` / `fix(scope): ...` / `chore: ...` / `docs(scope): ...`。scope 走包名（`cli` / `engine` / `eslint-plugin` / `preset-mobile` / `figma-plugin`），子域用 `engine/shell` 风格

## CI

唯一 workflow [.github/workflows/ci.yml](./.github/workflows/ci.yml)。触发：

- push 到 `main`（合并后兜底）
- 任何 PR（合并前预检）

单 job（ubuntu-latest, bun 1.1.0）：
1. `bun install`（workspaces）
2. `bun run lint`（eslint .）
3. `bun --cwd packages/cli run typecheck`
4. `bun --cwd packages/engine run typecheck`

暂无单测。surface 还在动，等类名 / 模块形态稳了再加 Vitest。

## 发版（仅维护者）

详见 [docs/release.md](./docs/release.md)。简版：

```bash
# 1. 改 package.json 里 version（engine 和 preset-mobile 通常 lockstep）
# 2. 写 CHANGELOG.md（Keep a Changelog 格式）
# 3. 提交：chore: release v0.X.Y (engine / preset-mobile)
# 4. 推到 main（CI 跑绿）
# 5. 逐包发：
cd packages/engine && npm publish --access public
cd packages/preset-mobile && npm publish --access public
cd packages/cli && npm publish --access public      # 仅 CLI 改了才发

# 6. 校验：
curl -s https://registry.npmjs.org/@omit-design/engine/latest | grep version
```

故意保留手动 publish — 每次发包都过人工。

## 防云端绑定

本仓库故意**不含云端 / 鉴权代码**。PR review 拒绝：

- API endpoints（Hono / Express / Next.js API routes）
- 鉴权流程（登录、session、BYOK key 管理）
- 云端部署配置（`fly.toml` / `vercel.json` / `wrangler.toml`）
- 账号 / 会员 UI

云端能力归属下游独立产品，不在本仓库。

## 报 bug

issue 里写：
- 版本：`npm ls @omit-design/engine @omit-design/cli @omit-design/preset-mobile`
- 复现：最小化的 `init` 脚手架项目 + 触发 bug 的最简设计稿
- 预期 vs 实际

视觉回归请贴 `/workspace/<projectId>` 的 before/after 截图。

## 许可

提交即同意你的贡献按 [MIT](./LICENSE) 许可。
