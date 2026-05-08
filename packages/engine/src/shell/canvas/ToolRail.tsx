import { useCanvasStore, type CanvasTool } from "./canvasStore";

interface ToolDef {
  id: CanvasTool;
  icon: string;
  label: string;
  shortcut: string;
}

const DEFAULT_TOOLS: ToolDef[] = [
  { id: "move", icon: "↖", label: "Select", shortcut: "V" },
  { id: "hand", icon: "✋", label: "Pan canvas", shortcut: "H" },
  { id: "inspect", icon: "📐", label: "Inspect", shortcut: "I" },
  { id: "comment", icon: "💬", label: "Comment", shortcut: "C" },
];

interface Props {
  tools?: ToolDef[];
  /** 头部展示用户角标的字符（如登录态首字母）。 */
  userInitial?: string;
}

/**
 * 暗色悬浮工具栏（参考 Figma 设计稿 1:764 Aside）：
 * 62px 宽 · 圆角 32 · 距画布边缘 10 · drop-shadow，垂直中心对齐画布。
 */
export function ToolRail({ tools = DEFAULT_TOOLS, userInitial }: Props) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setTool = useCanvasStore((s) => s.setTool);

  return (
    <aside className="canvas-tool-rail" data-no-inspect role="toolbar" aria-label="Canvas tools">
      <div className="canvas-tool-rail__logo" aria-hidden>◆</div>
      <div className="canvas-tool-rail__group">
        {tools.map((t) => {
          const active = activeTool === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className="canvas-tool-rail__btn"
              data-active={active || undefined}
              data-tool={t.id}
              onClick={() => setTool(t.id)}
              aria-label={t.label}
              aria-pressed={active}
            >
              <span className="canvas-tool-rail__icon" aria-hidden>{t.icon}</span>
              <span className="canvas-tool-rail__tip">
                {t.label}
                <kbd>{t.shortcut}</kbd>
              </span>
            </button>
          );
        })}
      </div>
      {userInitial && (
        <div className="canvas-tool-rail__user" title="Account">
          {userInitial}
        </div>
      )}
    </aside>
  );
}

export const TOOL_RAIL_WIDTH = 62;
