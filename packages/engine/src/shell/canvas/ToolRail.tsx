import {
  Hand,
  MessageSquare,
  MousePointer2,
  SquareDashed,
  type LucideIcon,
} from "lucide-react";
import { useCanvasStore, type CanvasTool } from "./canvasStore";

interface ToolDef {
  id: CanvasTool;
  icon: LucideIcon;
  label: string;
  shortcut: string;
}

const DEFAULT_TOOLS: ToolDef[] = [
  { id: "move", icon: MousePointer2, label: "Select", shortcut: "V" },
  { id: "hand", icon: Hand, label: "Pan canvas", shortcut: "H" },
  { id: "inspect", icon: SquareDashed, label: "Inspect", shortcut: "I" },
  { id: "comment", icon: MessageSquare, label: "Comment", shortcut: "C" },
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
      <div className="canvas-tool-rail__logo" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="16" height="16" rx="3" fill="currentColor" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.5111 4.80005C13.2784 4.80005 14.7111 6.23274 14.7111 8.00005C14.7111 9.76736 13.2784 11.2 11.5111 11.2H4.39995C2.63264 11.2 1.19995 9.76736 1.19995 8.00005C1.19995 6.23274 2.63264 4.80005 4.39995 4.80005H11.5111ZM4.39995 6.93338C3.81085 6.93338 3.33328 7.41095 3.33328 8.00005C3.33328 8.58915 3.81085 9.06672 4.39995 9.06672H11.5111C12.1002 9.06672 12.5777 8.58915 12.5777 8.00005C12.5777 7.41095 12.1002 6.93338 11.5111 6.93338H4.39995Z"
            fill="#000"
          />
        </svg>
      </div>
      <div className="canvas-tool-rail__group">
        {tools.map((t) => {
          const active = activeTool === t.id;
          const Icon = t.icon;
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
              <span className="canvas-tool-rail__icon" aria-hidden>
                <Icon size={20} strokeWidth={1.75} />
              </span>
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
