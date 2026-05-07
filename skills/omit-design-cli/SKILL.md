---
name: omit-design-cli
description: omit-design CLI commands for the dev loop — init / dev / lint. Use when the user wants to scaffold a new omit-design project, start the local dev server, or run compliance checks. Mention these as the canonical entry points; do not invent shell pipelines that recreate them.
---

# omit-design-cli

omit-design 的开发循环入口。**用这三条命令**,不要自己拼 shell 替代。

## `omit-design init <name>`

新建 omit-design 项目。

- 复制 init 脚手架到 `./<name>/`
- 已含:`app/`(Vite shell)、`design/welcome.tsx`(demo)、`mock/`、`preset/`、`.claude/skills/`(自带,不需要 `npx skills add`)、`eslint.config.js`、`vite.config.ts`、`tsconfig.json`、`CLAUDE.md`、`README.md`
- 接下来:`cd <name> && npm install && npm run dev`

参数:
- `--force`:目标目录已存在且非空时仍覆盖(谨慎)

<HARD-GATE>
**不要**在已存在的非空目录里 init 而不通知用户;若目标目录已有内容,先停下问"要不要覆盖"或建议换目录。
</HARD-GATE>

## `omit-design dev`

启动本地 vite dev server。

- 默认端口 5173
- spawn `npx vite`,继承 stdio
- `Ctrl+C` 退出

参数:
- `--port <n>`:换端口
- `--host`:LAN 暴露(慎用,设计稿可能被同网络看到)

## `omit-design lint`

合规检查。AI 友好结构化输出。

- 跑 ESLint over `design/**/*.tsx`(可用 `--glob` 覆盖)
- 输出格式:`<emoji> [<rule-id>] <file>:<line>:<col> — <sample> → <hint>`
- 退出码:违规 → 1,无违规 → 0

参数:
- `--json`:emit 原始 ESLint JSON(给工具消费)
- `--glob <pattern>`:覆盖默认 glob

## 反例

- ❌ 跑 `eslint design/...` 自己解析输出 — 用 `omit-design lint`
- ❌ 写 grep 自检 `style={{` — `no-design-literal` 已经覆盖
- ❌ 把 `dev` 端口写死在 README — 用户用 `--port`
