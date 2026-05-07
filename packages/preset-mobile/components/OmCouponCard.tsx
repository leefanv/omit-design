import type { ReactNode } from "react";
import { IonIcon } from "@ionic/react";
import { checkmark } from "ionicons/icons";
import { inspectAttrs } from "./inspect-attrs";
import "./om-coupon-card.css";

interface OmCouponCardProps {
  /** 面额 label，如 "¥50" / "8.5" / "15% OFF" */
  valueLabel: string;
  /** 单位 label，如 "代金券" / "折"。省略则只显示面额 */
  unitLabel?: string;
  title: string;
  /** 次要文本：使用门槛说明 */
  condition?: string;
  /** 有效期文案 */
  expireDate?: string;
  /** 选中态 —— 蓝描边 + 右侧 check 圆 */
  selected?: boolean;
  /** 右侧自定义 slot（替换默认 radio），如 rewards 页把 condition 挪到这里作为 tag */
  trailing?: ReactNode;
  onClick?: () => void;
}

/**
 * 优惠券 / 奖励卡 —— 左侧徽章（面额）+ 中部标题 + 右侧单选圆。
 * 点击整张卡即选中；`selected` 控制高亮。
 */
export function OmCouponCard({
  valueLabel,
  unitLabel,
  title,
  condition,
  expireDate,
  selected,
  trailing,
  onClick,
}: OmCouponCardProps) {
  const interactive = !!onClick;
  const className = `om-coupon${selected ? " pos-coupon--selected" : ""}`;

  const inner = (
    <>
      <div className="om-coupon__badge">
        <span className="om-coupon__badge-value">{valueLabel}</span>
        {unitLabel && <span className="om-coupon__badge-unit">{unitLabel}</span>}
      </div>
      <div className="om-coupon__body">
        <p className="om-coupon__title">{title}</p>
        {condition && <p className="om-coupon__condition">{condition}</p>}
        {expireDate && <p className="om-coupon__expire">⏳ {expireDate}</p>}
      </div>
      {trailing ?? (
        <div className="om-coupon__radio" aria-hidden>
          {selected && <IonIcon icon={checkmark} />}
        </div>
      )}
    </>
  );

  const inspect = inspectAttrs("OmCouponCard", { bg: "background", radius: "md", spacing: "md" });

  return interactive ? (
    <button type="button" className={className} onClick={onClick} {...inspect}>
      {inner}
    </button>
  ) : (
    <div className={className} {...inspect}>
      {inner}
    </div>
  );
}
