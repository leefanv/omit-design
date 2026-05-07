"use strict";

/**
 * Omit Web to Figma —— 读 engine 端 capture 导出的 FigmaNode JSON，建 SceneNode。
 *
 * 架构：
 *   UI (ui.html) 选文件 → postMessage {type:'import', payload}
 *   main (本文件)  读 payload → 创建 Frame / Text / Rect / Image / Vector
 *
 * 协议 schema 见仓库 packages/engine/src/capture/types.ts —— 这里保持与其对称。
 * 为避免 ts 编译步骤，本文件是纯 JS。
 */

figma.showUI(__html__, { width: 360, height: 520, themeColors: true });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "close") {
    figma.closePlugin();
    return;
  }

  if (msg.type === "import") {
    try {
      await preloadFonts();
      const captures = Array.isArray(msg.payload) ? msg.payload : [msg.payload];
      figma.ui.postMessage({ type: "log", text: `开始导入 ${captures.length} 张 frame…` });

      // 按 group 分组（payload.group.id）。没 group 的全都放 "(no group)" 里。
      const byGroup = new Map();
      for (const c of captures) {
        const key = c.group ? c.group.id : "__none__";
        if (!byGroup.has(key)) byGroup.set(key, { meta: c.group, items: [] });
        byGroup.get(key).items.push(c);
      }

      const created = [];
      let i = 0;
      for (const [, bucket] of byGroup) {
        const page = ensurePageForGroup(bucket.meta);
        // Track existing frames by name on this page —— re-import replaces instead of stacks
        const existingByName = new Map();
        for (const child of page.children) {
          existingByName.set(child.name, child);
        }
        const pageFrames = [];
        for (const c of bucket.items) {
          i += 1;
          figma.ui.postMessage({
            type: "log",
            text: `[${i}/${captures.length}] ${c.route}`,
          });
          // 先删旧（同名 frame 视为同一张稿的历史版本）
          const frameName = buildFrameName(c);
          const old = existingByName.get(frameName);
          if (old && "remove" in old) old.remove();
          const frame = await buildTopLevelFrame(c, frameName);
          page.appendChild(frame);
          pageFrames.push(frame);
          created.push(frame);
        }
        layoutFramesInGrid(pageFrames);
      }

      if (created.length) {
        const targetPage = created[0].parent;
        if (targetPage && targetPage.type === "PAGE") {
          await figma.setCurrentPageAsync(targetPage);
        }
        figma.viewport.scrollAndZoomIntoView(created);
        figma.currentPage.selection = created;
      }

      figma.ui.postMessage({
        type: "done",
        frames: created.length,
        pages: byGroup.size,
      });
    } catch (e) {
      console.error(e);
      figma.ui.postMessage({ type: "error", text: String((e && e.message) || e) });
    }
  }
};

// ---------- Group → Figma Page ----------
function ensurePageForGroup(groupMeta) {
  // groupMeta 为 null/undefined 说明 engine 端关闭了「按分组拆分」，直接落到当前 page
  if (!groupMeta) return figma.currentPage;
  const title = `${groupMeta.icon ? groupMeta.icon + " " : ""}${groupMeta.label}`;
  for (const p of figma.root.children) {
    if (p.type === "PAGE" && p.name === title) return p;
  }
  const page = figma.createPage();
  page.name = title;
  return page;
}

function buildFrameName(capture) {
  // 用 route 保证唯一性（name 可能多张稿重名）；可加 name 作为前缀可读性更好
  return capture.name ? `${capture.name} · ${capture.route}` : capture.route;
}

// ---------- 字体预加载 ----------
async function preloadFonts() {
  await Promise.all([
    figma.loadFontAsync({ family: "Inter", style: "Regular" }),
    figma.loadFontAsync({ family: "Inter", style: "Medium" }),
    figma.loadFontAsync({ family: "Inter", style: "Bold" }),
  ]);
}

// ---------- Top-level frame ----------
async function buildTopLevelFrame(capture, frameName) {
  const frame = figma.createFrame();
  frame.name = frameName || capture.route;
  // 取 viewport 与真实内容高度的大者 —— 长页（如 points-pay / sales/main）
  // 设计稿本身就会超出 844，死限制会整段被裁。
  // Figma runtime 不支持 ?. / ?? —— 手动拆开。
  const rootH = capture.root && capture.root.layout ? capture.root.layout.h : 0;
  const contentHeight = Math.max(capture.viewport.h, rootH || 0);
  frame.resize(capture.viewport.w, contentHeight);
  frame.x = 0;
  frame.y = 0;
  frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  frame.clipsContent = false; // 允许内容溢出可见 —— 设计师可以自己裁

  await buildChildInto(capture.root, frame);
  return frame;
}

// ---------- 递归 ----------
async function buildChildInto(node, parent) {
  let scene;
  try {
    switch (node.kind) {
      case "TEXT":
        scene = buildText(node);
        break;
      case "IMAGE":
        scene = await buildImage(node);
        break;
      case "VECTOR":
        scene = buildVector(node);
        break;
      case "FRAME":
      case "RECT":
      default:
        scene = buildFrame(node);
        break;
    }
  } catch (e) {
    console.warn("build failed:", node.name, e);
    return;
  }
  if (!scene) return;

  scene.name = node.name || "Frame";
  applyLayout(scene, node);
  applyPaint(scene, node);

  if (parent && "appendChild" in parent) {
    parent.appendChild(scene);
  }

  // position: absolute/fixed 的元素必须标记 ABSOLUTE，否则父 auto-layout 会把它
  // 当成普通 flex child 重新排版，典型症状：PosDialog 的 scrim + card 被拉成并排。
  // 注意：layoutPositioning 必须在 appendChild 之后设置。
  if (node.absolute && "layoutPositioning" in scene) {
    try {
      scene.layoutPositioning = "ABSOLUTE";
    } catch (_) {
      // 父没 autoLayout 时设置会抛，忽略
    }
  }

  // opacity < 1
  if (typeof node.opacity === "number" && node.opacity < 1 && "opacity" in scene) {
    scene.opacity = node.opacity;
  }

  // Frame 才有 children
  if (scene.type === "FRAME" && node.children && node.children.length) {
    for (const c of node.children) {
      await buildChildInto(c, scene);
    }
  }
}

function buildFrame(node) {
  const frame = figma.createFrame();
  frame.layoutMode = node.autoLayout ? node.autoLayout.direction : "NONE";

  if (node.autoLayout) {
    const al = node.autoLayout;
    frame.itemSpacing = al.gap;
    frame.paddingTop = al.padding.top;
    frame.paddingRight = al.padding.right;
    frame.paddingBottom = al.padding.bottom;
    frame.paddingLeft = al.padding.left;
    frame.primaryAxisAlignItems = al.justify;
    frame.counterAxisAlignItems = al.align;
    frame.primaryAxisSizingMode = "FIXED";
    frame.counterAxisSizingMode = "FIXED";
  }

  frame.clipsContent = !!node.clipContent;
  return frame;
}

function buildText(node) {
  const txt = figma.createText();
  const ts = node.text || { content: node.name || "" };

  const weight = ts.fontWeight || 400;
  const style = weight >= 600 ? "Bold" : weight >= 500 ? "Medium" : "Regular";
  txt.fontName = { family: "Inter", style };
  txt.characters = ts.content || "";

  if (ts.fontSize) txt.fontSize = ts.fontSize;
  if (ts.lineHeight) txt.lineHeight = { value: ts.lineHeight, unit: "PIXELS" };
  if (ts.letterSpacing) txt.letterSpacing = { value: ts.letterSpacing, unit: "PIXELS" };
  if (ts.textAlign) txt.textAlignHorizontal = ts.textAlign;

  if (ts.color) {
    txt.fills = [{
      type: "SOLID",
      color: { r: ts.color.r, g: ts.color.g, b: ts.color.b },
      opacity: ts.color.a,
    }];
  }

  return txt;
}

// ---------- IMAGE: data URL → Figma Image ----------
async function buildImage(node) {
  const frame = figma.createFrame();
  const src = node.imageSrc;

  if (src && typeof src === "string" && src.startsWith("data:")) {
    try {
      const bytes = dataUrlToBytes(src);
      const image = figma.createImage(bytes);
      frame.fills = [{ type: "IMAGE", scaleMode: "FIT", imageHash: image.hash }];
      return frame;
    } catch (e) {
      figma.ui.postMessage({
        type: "log",
        text: `  ⚠ 图片解析失败 [${node.name}]: ${String((e && e.message) || e).slice(0, 120)}`,
      });
      console.warn("image decode failed for", node.name, e);
    }
  }
  // 兜底：占位灰底 + 标记这是图片占位
  frame.fills = [{ type: "SOLID", color: { r: 0.86, g: 0.86, b: 0.88 } }];
  if (!src) {
    figma.ui.postMessage({
      type: "log",
      text: `  ⚠ 图片无 src [${node.name}]`,
    });
  }
  return frame;
}

function dataUrlToBytes(dataUrl) {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("invalid data URL");
  const b64 = dataUrl.slice(comma + 1);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ---------- VECTOR: svg → Figma createNodeFromSvg ----------
function buildVector(node) {
  if (node.svg && typeof node.svg === "string" && node.svg.includes("<svg")) {
    try {
      // 有时 SVG 文本带 XML 声明 / DOCTYPE，Figma 的解析器不吃 —— 去头
      let svg = node.svg.replace(/<\?xml[^?]*\?>/g, "").replace(/<!DOCTYPE[^>]*>/g, "").trim();
      // Figma 要求 xmlns 存在
      if (!/xmlns\s*=/.test(svg)) {
        svg = svg.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      const inserted = figma.createNodeFromSvg(svg);
      return inserted;
    } catch (e) {
      figma.ui.postMessage({
        type: "log",
        text: `  ⚠ SVG 解析失败 [${node.name}]: ${String((e && e.message) || e).slice(0, 120)}`,
      });
      console.warn("svg decode failed for", node.name, e);
    }
  }
  // 兜底：占位灰 Rect（小尺寸 icon 级）
  const rect = figma.createRectangle();
  rect.fills = [{ type: "SOLID", color: { r: 0.82, g: 0.82, b: 0.82 } }];
  return rect;
}

// ---------- 布局 ----------
function applyLayout(scene, node) {
  const l = node.layout || { x: 0, y: 0, w: 0, h: 0 };

  // Text 由字体决定尺寸，只设 x/y
  if (scene.type !== "TEXT") {
    const w = Math.max(1, l.w);
    const h = Math.max(1, l.h);
    if ("resize" in scene) {
      try {
        scene.resize(w, h);
      } catch (_) {
        // createNodeFromSvg 返回的 Frame 已有自身尺寸，resize 可能抛错 —— 忽略
      }
    }
  }
  scene.x = l.x;
  scene.y = l.y;
}

// ---------- 颜色 / 边框 / 阴影 / 圆角 ----------
function applyPaint(scene, node) {
  // 圆角
  if (node.radius && "cornerRadius" in scene) {
    const { tl, tr, br, bl } = node.radius;
    if (tl === tr && tr === br && br === bl) {
      scene.cornerRadius = tl;
    } else if ("topLeftRadius" in scene) {
      scene.topLeftRadius = tl;
      scene.topRightRadius = tr;
      scene.bottomRightRadius = br;
      scene.bottomLeftRadius = bl;
    } else {
      scene.cornerRadius = Math.max(tl, tr, br, bl);
    }
  }

  // 填充：TEXT / VECTOR / IMAGE 自己已处理；其它 Frame / Rect 必须显式写 fills，
  // 即使 node.fills 是空（元素透明）—— 否则 figma.createFrame() 默认会给一层白底，
  // 所有"无背景"的布局容器（.onboarding__brand 等）就都变成白盒遮住下层渐变。
  const isFill自管 = scene.type === "TEXT" || scene.type === "VECTOR";
  const isImage =
    scene.type === "FRAME" &&
    Array.isArray(scene.fills) &&
    scene.fills.some((f) => f.type === "IMAGE");
  if (!isFill自管 && !isImage && "fills" in scene) {
    if (node.fills && node.fills.length) {
      scene.fills = node.fills.map(mapFill).filter(Boolean);
    } else {
      scene.fills = []; // 透明：清掉 Figma 默认白底
    }
  }

  // 描边
  if (node.strokes && node.strokes.length && "strokes" in scene) {
    const s = node.strokes[0];
    scene.strokes = [{
      type: "SOLID",
      color: { r: s.color.r, g: s.color.g, b: s.color.b },
      opacity: s.color.a,
    }];
    scene.strokeWeight = s.width;
    if (s.style === "dashed" && "dashPattern" in scene) {
      scene.dashPattern = [4, 4];
    }
  }

  // 阴影
  if (node.effects && node.effects.length && "effects" in scene) {
    scene.effects = node.effects.map((sh) => ({
      type: "DROP_SHADOW",
      color: { r: sh.color.r, g: sh.color.g, b: sh.color.b, a: sh.color.a },
      offset: { x: sh.offsetX, y: sh.offsetY },
      radius: sh.blur,
      spread: sh.spread || 0,
      visible: true,
      blendMode: "NORMAL",
    }));
  }
}

function mapFill(f) {
  if (f.type === "SOLID") {
    return {
      type: "SOLID",
      color: { r: f.color.r, g: f.color.g, b: f.color.b },
      opacity: f.color.a,
    };
  }
  if (f.type === "LINEAR_GRADIENT") {
    const rad = ((f.angleDeg - 90) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      type: "GRADIENT_LINEAR",
      gradientTransform: [
        [cos, sin, (1 - cos - sin) / 2],
        [-sin, cos, (1 + sin - cos) / 2],
      ],
      gradientStops: f.stops.map((s) => ({
        position: s.offset,
        color: { r: s.color.r, g: s.color.g, b: s.color.b, a: s.color.a },
      })),
    };
  }
  return null;
}

// ---------- Top-level frame 排版 ----------
function layoutFramesInGrid(frames) {
  const GAP = 80;
  const COLS = 6;
  let maxRowHeight = 0;
  for (let i = 0; i < frames.length; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const frame = frames[i];
    frame.x = col * (frame.width + GAP);
    frame.y = row * (maxRowHeight + GAP);
    if (col === COLS - 1 || i === frames.length - 1) {
      const rowFrames = frames.slice(row * COLS, i + 1);
      maxRowHeight = Math.max(...rowFrames.map((f) => f.height));
    }
  }
}
