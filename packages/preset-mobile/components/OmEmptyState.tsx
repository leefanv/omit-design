import type { ReactNode } from "react";
import { IonIcon } from "@ionic/react";
import { inspectAttrs } from "./inspect-attrs";
import "./om-empty-state.css";

interface OmEmptyStateProps {
  /** 大图标（ionicons） —— 显示在圆形浅色背景内 */
  icon?: string;
  title: string;
  description?: string;
  /** 主操作 + 次要操作（1~2 个 OmButton 传入） */
  actions?: ReactNode;
}

/**
 * 空状态 —— 列表 / 搜索 / 会员查无结果。
 * 圆形 icon + 标题 + 描述 + actions。
 */
export function OmEmptyState({ icon, title, description, actions }: OmEmptyStateProps) {
  return (
    <div className="om-empty" {...inspectAttrs("OmEmptyState", { bg: "background", spacing: "xl" })}>
      {icon && (
        <div className="om-empty__icon" aria-hidden>
          <IonIcon icon={icon} color="medium" />
        </div>
      )}
      <h2 className="om-empty__title">{title}</h2>
      {description && <p className="om-empty__desc">{description}</p>}
      {actions && <div className="om-empty__actions">{actions}</div>}
    </div>
  );
}
