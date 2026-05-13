/**
 * NewProjectDialog —— 首页"新建项目"弹窗
 *
 * 引导用户把一段提示词 + 命令复制给 AI 助手（Cursor / Claude Code 等）
 * 让助手代为执行 `omit-design init` 流程。
 */
import { useEffect, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import "./new-project-dialog.css";

interface NewProjectDialogProps {
  onClose: () => void;
}

const AGENT_PROMPT = `请用 omit-design 帮我创建一个新项目（名字可以替换成你想要的，下面以 my-app 为例）：

npx @omit-design/cli init my-app
cd my-app && npm install
npm run dev

启动后浏览器打开 http://localhost:5173/ 即可看到工作区。`;

export function NewProjectDialog({ onClose }: NewProjectDialogProps) {
  const [copied, setCopied] = useState(false);

  // ESC 关
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(AGENT_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 用户没授予权限或非 HTTPS context —— 静默失败 */
    }
  }

  function onOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="new-project-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="New project"
      onClick={onOverlayClick}
    >
      <div className="new-project-dialog">
        <header className="new-project-dialog__head">
          <h3>新建项目</h3>
          <button
            type="button"
            className="new-project-dialog__close"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className="new-project-dialog__body">
          <p className="new-project-dialog__lead">
            把下面这段提示词复制给你的 AI 助手（<strong>Cursor</strong> ·{" "}
            <strong>Claude Code</strong> 等），让它帮你跑通 <code>omit-design init</code>
            流程：
          </p>

          <div className="new-project-dialog__code">
            <button
              type="button"
              className="new-project-dialog__copy-btn"
              onClick={copyPrompt}
              title={copied ? "Copied" : "Copy"}
            >
              {copied ? (
                <>
                  <Check size={14} aria-hidden /> Copied
                </>
              ) : (
                <>
                  <Copy size={14} aria-hidden /> Copy
                </>
              )}
            </button>
            <pre>{AGENT_PROMPT}</pre>
          </div>

          <p className="new-project-dialog__hint">
            想自己跑也行——把命令贴到终端依次执行即可。完成后在新项目目录里
            <code>npm run dev</code> 就能看到工作区首页。
          </p>
        </div>
      </div>
    </div>
  );
}
