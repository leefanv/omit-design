import type { ReactNode } from "react";
import { IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { useNavigate } from "react-router-dom";
import { inspectAttrs } from "./inspect-attrs";
import "./om-sheet.css";

interface OmSheetProps {
  /** 顶部标题（可选；传 null 则不展示 title bar） */
  title?: ReactNode;
  children: ReactNode;
  /** 关闭：点击 scrim 或右上角 × —— 默认 navigate(-1) */
  onDismiss?: () => void;
  /** 关闭后的跳转路由（和 onDismiss 二选一） */
  dismissHref?: string;
  /** sheet 高度策略：auto（内容自适应）/ tall（70% 视口） */
  size?: "auto" | "tall";
}

/**
 * 底部抽屉 sheet —— 从下往上弹出的内容面板。
 * 用于：优惠详情、快捷操作菜单、行内动作列表。
 * 作为独立"弹窗稿"时，放在 OmPage 里叠一层（参考 dialog-view 的做法）。
 */
export function OmSheet({ title, children, onDismiss, dismissHref, size = "auto" }: OmSheetProps) {
  const navigate = useNavigate();
  const dismiss = () => {
    if (onDismiss) return onDismiss();
    if (dismissHref) return navigate(dismissHref);
    navigate(-1);
  };

  return (
    <div className="om-sheet" {...inspectAttrs("OmSheet", { bg: "background", radius: "xl" })}>
      <div className="om-sheet__scrim" aria-hidden onClick={dismiss} />
      <div className={`pos-sheet__panel pos-sheet__panel--${size}`} role="dialog">
        {title && (
          <div className="om-sheet__head">
            <span className="om-sheet__title">{title}</span>
            <button className="om-sheet__close" type="button" onClick={dismiss} aria-label="关闭">
              <IonIcon icon={closeOutline} />
            </button>
          </div>
        )}
        <div className="om-sheet__body">{children}</div>
      </div>
    </div>
  );
}
