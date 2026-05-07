import { IonIcon } from "@ionic/react";
import { inspectAttrs } from "./inspect-attrs";
import "./om-menu-card.css";

interface OmMenuCardProps {
  /** ionicons 图标 */
  icon: string;
  label: string;
  /** 右上角 badge（数字 / 短 token） */
  badge?: string | number;
  /** 整卡禁用态（二期 / 灰态） */
  disabled?: boolean;
  /** 点击或路由 */
  href?: string;
  onClick?: () => void;
}

/**
 * 工作台宫格入口卡 —— 左上 icon chip + 下方 label + 右上可选 badge。
 * 设计意图：所有 workstation 主入口视觉统一，disabled 态清晰区分二期。
 */
export function OmMenuCard({ icon, label, badge, disabled, href, onClick }: OmMenuCardProps) {
  const className = `om-menu${disabled ? " pos-menu--disabled" : ""}`;
  const inspect = inspectAttrs("OmMenuCard", { bg: "background", radius: "lg", shadow: "sm", spacing: "md" });
  const body = (
    <>
      <div className="om-menu__icon" aria-hidden>
        <IonIcon icon={icon} />
      </div>
      <span className="om-menu__label">{label}</span>
      {typeof badge !== "undefined" && <span className="om-menu__badge">{badge}</span>}
    </>
  );

  if (href && !disabled) {
    return (
      <a className={className} href={href} {...inspect}>
        {body}
      </a>
    );
  }
  return (
    <button type="button" className={className} disabled={disabled} onClick={onClick} {...inspect}>
      {body}
    </button>
  );
}
