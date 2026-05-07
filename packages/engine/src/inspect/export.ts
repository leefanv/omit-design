import { toPng } from "html-to-image";

export type ExportScale = 1 | 2 | 3;

/** 从选中元素里找"资源型"节点（<img> / <ion-icon>），返回可直链下载的 URL + 推荐文件名 */
export function detectAssetSource(el: HTMLElement): { url: string; filename: string } | null {
  // <img src>
  const img = el.tagName === "IMG" ? (el as HTMLImageElement) : el.querySelector("img");
  if (img && img.src) {
    return { url: img.src, filename: filenameFromUrl(img.src) ?? "image" };
  }
  // <ion-icon src="..."> 或 <ion-icon icon="url(...)">
  const ionIcon = el.tagName.toLowerCase() === "ion-icon" ? el : el.querySelector("ion-icon");
  if (ionIcon) {
    const src = ionIcon.getAttribute("src");
    if (src) return { url: src, filename: filenameFromUrl(src) ?? "icon.svg" };
    // 内嵌 svg 作为 ion-icon shadow content 的情况：抓 shadow 内的 <svg>
    const shadowSvg = (ionIcon as HTMLElement & { shadowRoot: ShadowRoot | null }).shadowRoot?.querySelector("svg");
    if (shadowSvg) {
      const svgText = new XMLSerializer().serializeToString(shadowSvg);
      const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgText);
      const name = ionIcon.getAttribute("name") ?? "icon";
      return { url, filename: `${name}.svg` };
    }
  }
  return null;
}

function filenameFromUrl(url: string): string | null {
  try {
    const u = new URL(url, window.location.href);
    const last = u.pathname.split("/").filter(Boolean).pop();
    return last || null;
  } catch {
    return null;
  }
}

/** 把 DOM 节点栅格化成 PNG，按 scale 输出 @1x/@2x/@3x */
export async function exportElementAsPng(
  el: HTMLElement,
  scale: ExportScale,
  componentName: string
): Promise<void> {
  const rect = el.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  const dataUrl = await toPng(el, {
    pixelRatio: scale,
    cacheBust: true,
    // 跳过 inspect 自身的覆盖层，避免把选中描边 / 盒模型 overlay 也截进去
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return true;
      return !node.matches(
        ".inspect-hover, .inspect-selected, .box-model, .box-model-label, .measure-anchor, .measure-target, .measure-guide, .measure-distance, [data-no-inspect]"
      );
    },
  });
  downloadDataUrl(dataUrl, `${sanitize(componentName)}-${width}x${height}@${scale}x.png`);
}

/** 通过 <a download> 触发下载（同源 URL 或 data:/blob: 都支持） */
export function downloadUrl(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function sanitize(name: string): string {
  return name.replace(/[^\w.-]+/g, "_");
}
