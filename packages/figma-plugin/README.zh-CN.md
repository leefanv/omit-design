# @omit-design/figma-plugin

> [omit-design](https://github.com/leefanv/omit-design) 的 Figma 插件 — 把 engine `capture` 导出的 `FigmaNode` JSON 读进 Figma，生成可编辑的 Frame。

[![npm](https://img.shields.io/npm/v/@omit-design/figma-plugin)](https://www.npmjs.com/package/@omit-design/figma-plugin)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

[English](./README.md)

## 双向往来怎么走

```
TSX 设计稿     ──capture──►   FigmaNode JSON   ──import──►  Figma Frame
 (React)         (engine)        (下载)          (本插件)
```

插件**只消费**，不回调 dev server、不抓远程资源、不打外网（`networkAccess.allowedDomains = ["none"]`）。所有图片字节都在 capture 阶段（浏览器里）预烘到 JSON 里成 data URL。

## 装插件（首次）

**最快路径** — dev server 工作台头部点 **`↗ 导出到 Figma`** → 弹窗里点 **`↓ 下载插件 .zip`** → 解压 → 在 Figma 桌面版 `Plugins → Development → Import plugin from manifest…`

**手动** — 拉仓库：

```bash
git clone https://github.com/leefanv/omit-design.git
cd omit-design
bun --filter @omit-design/figma-plugin run build:zip   # 生成 omit-web-to-figma.zip
unzip packages/figma-plugin/omit-web-to-figma.zip -d ~/omit-web-to-figma
```

然后 Figma 桌面版：`Plugins → Development → Import plugin from manifest…` → 选 `manifest.json`。

装完在 `Plugins → Development → Omit Web to Figma` 里能看到。

## 使用流程

1. `npm run dev` 启动 omit-design 项目 → 打开 `http://localhost:5173`
2. 进入项目工作台（`/workspace/<projectId>`）
3. 头部点 **`↗ 导出到 Figma`** → 选某张稿件或"全部"→ **`↓ 捕获并下载 JSON`**
4. 在 Figma 跑 `Plugins → Development → Omit Web to Figma`
5. 把 JSON 拖进插件窗口
6. 点 **导入** → 当前 Figma 页面上出现 Frame(s)

## 改完插件后重打包

改过 `manifest.json` / `code.js` / `ui.html` 任意一个之后：

```bash
bun --filter @omit-design/figma-plugin run build:zip
```

重新生成 `omit-web-to-figma.zip`。`prepublishOnly` hook 在 `npm publish` 前会自动跑这条，所以发布的 tarball 永远不会 stale。

## 当前支持

### 结构
- [x] FRAME 节点（Auto-Layout 方向 / gap / padding / 对齐方式）
- [x] TEXT 节点（Inter Regular/Medium/Bold + fontSize + lineHeight + color + 对齐）
- [x] 子节点递归（含 light DOM / shadow DOM 合并）
- [x] CSS 伪元素 `::before` / `::after` 合成为子 Frame
- [x] `position: absolute/fixed` 标 `layoutPositioning: ABSOLUTE`
- [x] `opacity` / `overflow: hidden` 保留

### 填色 / 描边 / 圆角 / 阴影
- [x] SOLID fill
- [x] LINEAR_GRADIENT fill（多色标 + angle / `to <dir>`）
- [x] Stroke（颜色 + 宽度 + 虚线）
- [x] cornerRadius（支持四角不同）
- [x] DropShadow（单 / 多层）

### 图片 / 矢量
- [x] `<img>` → `figma.createImage(bytes)` + IMAGE fill
- [x] 原生 `<svg>` → `figma.createNodeFromSvg(outerHTML)`
- [x] `<ion-icon>` → shadow DOM 抽 SVG + `currentColor` → 元素 computed color

### 批量
- [x] bundle 批量导入，自动横排多张 frame

## 已知限制

- `background-image: url(...)` 不转 IMAGE — 业务稿统一走 `<img>`，shell 装饰会丢背景图但不影响结构
- CSS Variables 未绑定到 Figma Variables
- `radial-gradient` / `conic-gradient` 不支持
- 重复导入同一张稿会堆叠 Frame，没按 `data-design-id` 替换
- `networkAccess.allowedDomains = ["none"]` — plugin 端不能主动拉远程图；当前架构是 capture 端（浏览器里）先 fetch 成 data URL，plugin 端只消费 data

## 许可

[MIT](../../LICENSE)
