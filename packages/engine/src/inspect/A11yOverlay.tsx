import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useProjects, useProjectByHref } from "../registry";

interface Issue {
  el: HTMLElement;
  rect: DOMRect;
  severity: "error" | "warn";
  message: string;
}

const TOUCH_MIN = 44;

/**
 * A11y mode：扫描页面，标记
 *  🔴 触控区 < 44×44 的可点击元素
 *  🟡 缺 alt / aria-label 的图片
 *
 * 可点击元素的 selector 列表来自当前 project 的 preset.manifest.a11ySelectors，
 * 这样不同 preset 下要标的组件可以不同（mobile = PosButton/PosListRow；desktop = UiButton/UiListRow）。
 *
 * 颜色对比度暂未实现（计算 WCAG ratio 较重，留待后续）。
 */
export function A11yOverlay() {
  const location = useLocation();
  const allProjects = useProjects();
  const project = useProjectByHref(location.pathname)?.project ?? allProjects[0];
  const clickableSelector = project.preset.a11ySelectors.clickable.join(", ");

  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    const collected: Issue[] = [];

    const clickables = document.querySelectorAll<HTMLElement>(clickableSelector);
    clickables.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.width < TOUCH_MIN || r.height < TOUCH_MIN) {
        collected.push({
          el,
          rect: r,
          severity: "error",
          message: `Touch target ${Math.round(r.width)}×${Math.round(r.height)} < ${TOUCH_MIN}`,
        });
      }
    });

    const images = document.querySelectorAll<HTMLImageElement>("img");
    images.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      if (!el.alt && !el.getAttribute("aria-label")) {
        collected.push({ el, rect: r, severity: "warn", message: "Missing alt / aria-label" });
      }
    });

    setIssues(collected);

    const observer = new MutationObserver(() => {
      // 简单实现：只在加载后扫一次。可扩展为动态扫描
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [clickableSelector]);

  return (
    <>
      <div className="a11y-summary">
        Found {issues.length} issues ({issues.filter((i) => i.severity === "error").length} errors / {issues.filter((i) => i.severity === "warn").length} warnings)
      </div>
      {issues.map((it, i) => (
        <div
          key={i}
          className={`a11y-mark a11y-mark--${it.severity}`}
          style={{ top: it.rect.top, left: it.rect.left, width: it.rect.width, height: it.rect.height }}
          title={it.message}
        >
          <span className="a11y-mark-label">{it.message}</span>
        </div>
      ))}
    </>
  );
}
