interface BoxModelOverlayProps {
  el: HTMLElement;
}

/**
 * 盒模型可视化：在选中元素四周叠加分色矩形
 * - 橙色 = margin
 * - 黄色 = border
 * - 绿色 = padding
 * - 蓝色 = content
 */
export function BoxModelOverlay({ el }: BoxModelOverlayProps) {
  const rect = el.getBoundingClientRect();
  const cs = window.getComputedStyle(el);
  const mt = parseFloat(cs.marginTop) || 0;
  const mr = parseFloat(cs.marginRight) || 0;
  const mb = parseFloat(cs.marginBottom) || 0;
  const ml = parseFloat(cs.marginLeft) || 0;
  const pt = parseFloat(cs.paddingTop) || 0;
  const pr = parseFloat(cs.paddingRight) || 0;
  const pb = parseFloat(cs.paddingBottom) || 0;
  const pl = parseFloat(cs.paddingLeft) || 0;
  const bt = parseFloat(cs.borderTopWidth) || 0;
  const br = parseFloat(cs.borderRightWidth) || 0;
  const bb = parseFloat(cs.borderBottomWidth) || 0;
  const bl = parseFloat(cs.borderLeftWidth) || 0;

  return (
    <>
      {/* Margin (橙) — 在元素外侧 */}
      <div className="box-model box-model--margin" style={{ top: rect.top - mt, left: rect.left - ml, width: rect.width + ml + mr, height: mt }} />
      <div className="box-model box-model--margin" style={{ top: rect.bottom, left: rect.left - ml, width: rect.width + ml + mr, height: mb }} />
      <div className="box-model box-model--margin" style={{ top: rect.top, left: rect.left - ml, width: ml, height: rect.height }} />
      <div className="box-model box-model--margin" style={{ top: rect.top, left: rect.right, width: mr, height: rect.height }} />

      {/* Border (黄) — 在元素边线 */}
      <div className="box-model box-model--border" style={{ top: rect.top, left: rect.left, width: rect.width, height: bt }} />
      <div className="box-model box-model--border" style={{ top: rect.bottom - bb, left: rect.left, width: rect.width, height: bb }} />
      <div className="box-model box-model--border" style={{ top: rect.top + bt, left: rect.left, width: bl, height: rect.height - bt - bb }} />
      <div className="box-model box-model--border" style={{ top: rect.top + bt, left: rect.right - br, width: br, height: rect.height - bt - bb }} />

      {/* Padding (绿) — 内边距 */}
      <div className="box-model box-model--padding" style={{ top: rect.top + bt, left: rect.left + bl, width: rect.width - bl - br, height: pt }} />
      <div className="box-model box-model--padding" style={{ top: rect.bottom - bb - pb, left: rect.left + bl, width: rect.width - bl - br, height: pb }} />
      <div className="box-model box-model--padding" style={{ top: rect.top + bt + pt, left: rect.left + bl, width: pl, height: rect.height - bt - bb - pt - pb }} />
      <div className="box-model box-model--padding" style={{ top: rect.top + bt + pt, left: rect.right - br - pr, width: pr, height: rect.height - bt - bb - pt - pb }} />

      {/* 数值标签 */}
      {(mt > 0 || ml > 0 || mr > 0 || mb > 0) && (
        <div className="box-model-label" style={{ top: rect.top - mt - 18, left: rect.left }}>
          margin: {mt} {mr} {mb} {ml}
        </div>
      )}
      {(pt > 0 || pl > 0 || pr > 0 || pb > 0) && (
        <div className="box-model-label box-model-label--padding" style={{ top: rect.bottom + 4, left: rect.left }}>
          padding: {pt} {pr} {pb} {pl}
        </div>
      )}
    </>
  );
}
