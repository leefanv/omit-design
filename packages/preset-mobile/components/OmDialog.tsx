import type { ReactNode } from "react";
import { IonIcon } from "@ionic/react";
import { useNavigate } from "react-router-dom";
import { inspectAttrs } from "./inspect-attrs";
import { OmButton } from "./OmButton";
import type { ColorTokenName } from "../tokens";
import "./om-dialog.css";

interface OmDialogProps {
  /** 顶部图标（ionicons 名） */
  icon?: string;
  iconColor?: ColorTokenName;
  title: string;
  subtitle?: string;
  /** 主按钮文案，默认"知道了" */
  confirmText?: string;
  /** 主按钮颜色 */
  confirmColor?: ColorTokenName;
  /** 主按钮跳转目标（确定流向 —— 跟 confirmHref 互斥，设计稿首选这个以保持 URL 语义） */
  confirmHref?: string;
  /** 主按钮回调（与 confirmHref 二选一；回调式适合纯状态弹窗） */
  onConfirm?: () => void;
  /** 取消按钮 —— 传入任何一个（cancelHref / onCancel / cancelText）都会启用 */
  cancelText?: string;
  cancelHref?: string;
  onCancel?: () => void;
  /** 自定义主体 —— 代替 subtitle，塞更复杂内容（比如金额详情） */
  body?: ReactNode;
  /** 覆盖整个 actions 区 —— 少数场景需要 3 个以上按钮 */
  actions?: ReactNode;
}

/**
 * 状态对话框 / 确认对话框 —— 全屏 scrim + 居中卡片。
 * 默认 1 按钮；传入 cancelText/cancelHref/onCancel 任一个就切成 2 按钮（左取消右确认）。
 */
export function OmDialog({
  icon,
  iconColor = "primary",
  title,
  subtitle,
  confirmText = "知道了",
  confirmColor = "primary",
  confirmHref,
  onConfirm,
  cancelText,
  cancelHref,
  onCancel,
  body,
  actions,
}: OmDialogProps) {
  const navigate = useNavigate();
  const hasCancel = !!cancelText || !!cancelHref || !!onCancel;

  const handleConfirm = () => {
    if (onConfirm) return onConfirm();
    if (confirmHref) navigate(confirmHref);
  };
  const handleCancel = () => {
    if (onCancel) return onCancel();
    if (cancelHref) navigate(cancelHref);
    else navigate(-1);
  };

  return (
    <div className="om-dialog" {...inspectAttrs("OmDialog", { radius: "xl", bg: "background" })}>
      <div className="om-dialog__scrim" aria-hidden="true" />
      <div className="om-dialog__card" role="dialog" aria-labelledby="pos-dialog-title">
        {icon && (
          <div className="om-dialog__icon">
            <IonIcon icon={icon} color={iconColor} />
          </div>
        )}
        <h2 className="om-dialog__title" id="pos-dialog-title">
          {title}
        </h2>
        {subtitle && <p className="om-dialog__subtitle">{subtitle}</p>}
        {body && <div className="om-dialog__body">{body}</div>}
        <div className={`pos-dialog__actions ${hasCancel ? "pos-dialog__actions--two" : ""}`}>
          {actions ?? (
            <>
              {hasCancel && (
                <OmButton variant="outline" color="medium" onClick={handleCancel}>
                  {cancelText ?? "取消"}
                </OmButton>
              )}
              <OmButton color={confirmColor} onClick={handleConfirm}>
                {confirmText}
              </OmButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
