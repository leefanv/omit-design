import type { InspectTarget } from "./store";

interface MeasureOverlayProps {
  anchor: InspectTarget | null;
  hovered: HTMLElement | null;
}

/**
 * Measure mode：第一次点击锁定锚点（蓝框），随后 hover 任意元素
 * 显示锚点矩形与目标矩形之间的四向距离（gap）。
 *
 * 距离规则：
 * - 同方向 = 两矩形外边之间的最短距离
 * - 重叠 = 显示负值
 */
export function MeasureOverlay({ anchor, hovered }: MeasureOverlayProps) {
  if (!anchor) {
    return (
      <div className="measure-hint">
        点击一个元素作为<strong>测量起点</strong>，再 hover 另一个元素查看距离
      </div>
    );
  }

  const aRect = anchor.el.getBoundingClientRect();

  if (!hovered || hovered === anchor.el) {
    return (
      <>
        <div
          className="measure-anchor"
          style={{ top: aRect.top, left: aRect.left, width: aRect.width, height: aRect.height }}
        >
          <span className="measure-anchor-label">起点：{anchor.component}</span>
        </div>
        <div className="measure-hint">已锁定起点，hover 另一个元素查看距离</div>
      </>
    );
  }

  const bRect = hovered.getBoundingClientRect();
  const gapTop = bRect.top - aRect.bottom;
  const gapBottom = aRect.top - bRect.bottom;
  const gapLeft = bRect.left - aRect.right;
  const gapRight = aRect.left - bRect.right;

  const horizontal = Math.max(gapLeft, gapRight);
  const vertical = Math.max(gapTop, gapBottom);

  const renderHGuide = horizontal !== Infinity && horizontal !== -Infinity;
  const renderVGuide = vertical !== Infinity && vertical !== -Infinity;

  return (
    <>
      <div
        className="measure-anchor"
        style={{ top: aRect.top, left: aRect.left, width: aRect.width, height: aRect.height }}
      >
        <span className="measure-anchor-label">A · {anchor.component}</span>
      </div>
      <div
        className="measure-target"
        style={{ top: bRect.top, left: bRect.left, width: bRect.width, height: bRect.height }}
      >
        <span className="measure-target-label">B · {hovered.getAttribute("data-omit-component")}</span>
      </div>

      {renderHGuide && (
        <HorizontalGuide aRect={aRect} bRect={bRect} gap={horizontal} />
      )}
      {renderVGuide && (
        <VerticalGuide aRect={aRect} bRect={bRect} gap={vertical} />
      )}
    </>
  );
}

function HorizontalGuide({ aRect, bRect, gap }: { aRect: DOMRect; bRect: DOMRect; gap: number }) {
  const y = (Math.max(aRect.top, bRect.top) + Math.min(aRect.bottom, bRect.bottom)) / 2;
  const left = Math.min(aRect.right, bRect.right);
  const right = Math.max(aRect.left, bRect.left);
  const width = Math.abs(right - left);
  return (
    <>
      <div className="measure-guide measure-guide--h" style={{ top: y, left: Math.min(left, right), width }} />
      <div className="measure-distance" style={{ top: y - 22, left: Math.min(left, right) + width / 2 - 30 }}>
        {Math.round(gap)} px
      </div>
    </>
  );
}

function VerticalGuide({ aRect, bRect, gap }: { aRect: DOMRect; bRect: DOMRect; gap: number }) {
  const x = (Math.max(aRect.left, bRect.left) + Math.min(aRect.right, bRect.right)) / 2;
  const top = Math.min(aRect.bottom, bRect.bottom);
  const bottom = Math.max(aRect.top, bRect.top);
  const height = Math.abs(bottom - top);
  return (
    <>
      <div className="measure-guide measure-guide--v" style={{ left: x, top: Math.min(top, bottom), height }} />
      <div className="measure-distance" style={{ left: x + 8, top: Math.min(top, bottom) + height / 2 - 10 }}>
        {Math.round(gap)} px
      </div>
    </>
  );
}
