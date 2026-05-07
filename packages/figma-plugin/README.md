# @omit-design/figma-plugin

把 omit-design 项目通过 engine 端 capture 导出的 JSON 读进 Figma,生成可编辑的 Frame。

## 装插件（首次）

最快路径:在 dev server `/workspace` 项目页右上角点「↗ 导出到 Figma」→ 弹窗里点「↓ 下载插件 .zip」。

或手动:

1. 拉最新仓库
2. 跑 `npm run build:figma-plugin` 重新打 zip(首次已经预打好,仓库里有 `omit-web-to-figma.zip`)
3. 解压到任意目录
4. 打开 Figma 桌面版(浏览器版不支持开发插件)
5. 菜单 → `Plugins` → `Development` → `Import plugin from manifest…`
6. 选解压后的 `manifest.json`

装完在 `Plugins → Development → Omit Web to Figma` 里就能看到。

## 使用流程

1. 启动开发环境:`npm run dev` → 打开 `http://localhost:5173`
2. 进入项目工作台(`/workspace`)
3. 右上角点「↗ 导出到 Figma」→ 选稿件 → 「捕获并下载 JSON」(或「捕获全部 → bundle」)
4. 回到 Figma,`Plugins → Development → Omit Web to Figma`
5. 拖入刚才下载的 JSON
6. 点「导入」→ Figma 里会出现一张或多张 Frame

## 修改插件后重打包

修改 `manifest.json` / `code.js` / `ui.html` 任意一个之后:

```bash
npm run build:figma-plugin
```

这会重新生成 `omit-web-to-figma.zip` —— 下一次刷新 dialog 时下载链接就是新版本。

## 当前支持

### 结构
- [x] FRAME 节点(Auto-Layout 方向 / gap / padding / 对齐方式)
- [x] TEXT 节点(Inter Regular/Medium/Bold + fontSize + lineHeight + color + 对齐)
- [x] 子节点递归(含 light DOM / shadow DOM 合并)
- [x] CSS 伪元素 `::before` / `::after` 合成为子 Frame
- [x] `position: absolute/fixed` 标 `layoutPositioning: ABSOLUTE`
- [x] `opacity` / `overflow: hidden` 保留

### 填色 / 描边 / 圆角 / 阴影
- [x] SOLID fill
- [x] LINEAR_GRADIENT fill(多色标 + angle / `to <dir>`)
- [x] Stroke(颜色 + 宽度 + 虚线)
- [x] cornerRadius(支持四角不同)
- [x] DropShadow(单 / 多层)

### 图片 / 矢量
- [x] `<img>` → `figma.createImage(bytes)` + IMAGE fill
- [x] 原生 `<svg>` → `figma.createNodeFromSvg(outerHTML)`
- [x] `<ion-icon>` → shadow DOM 抽 SVG + `currentColor` → 元素 computed color

### 批量
- [x] bundle 批量导入,自动横排多张 frame

## 已知限制

- `background-image: url(...)` 不转 IMAGE —— 业务稿统一走 `<img>`,shell 装饰会丢背景图但不影响结构
- CSS Variables 未绑定到 Figma Variables
- radial / conic gradient 不支持
- 重复导入同一张稿会堆叠 Frame,没按 `data-design-id` 替换
- `networkAccess.allowedDomains = ["none"]` — plugin 端不能主动拉远程图;当前架构是 capture 端(浏览器里)先 fetch 成 data URL,plugin 端只消费 data
