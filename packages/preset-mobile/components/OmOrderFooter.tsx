import { IonIcon } from "@ionic/react";
import { cartOutline, chevronForward } from "ionicons/icons";
import { inspectAttrs } from "./inspect-attrs";
import "./om-order-footer.css";

interface OmOrderFooterProps {
  /** 购物车计数（badge）；0 / undefined 不展示 badge */
  cartCount?: number;
  /** 主要金额文案："¥999.00" / "¥68.00" */
  primaryAmount: string;
  /** 右侧 CTA 文案，如 "结算" / "¥999.00"（稿里两种 pattern） */
  ctaLabel?: string;
  /** 副信息："-¥124.00 优惠明细 >" */
  discountLabel?: string;
  /** 副信息 tap */
  onDiscountClick?: () => void;
  /** CTA tap */
  onCta?: () => void;
  onCartClick?: () => void;
  /** 控制 CTA 文案与主金额的关系：
   * - "split" ：左主金额 + 右 CTA 按钮（如销售主页的 ¥999.00 按钮本身） */
  layout?: "amount-in-cta" | "amount-split";
}

/**
 * 销售主页 / 购物车底部栏。
 * 左：购物车图标 + badge + 可选优惠明细行；右：金额 CTA 按钮。
 * 通过 `<OmPage>` 下的 absolute 定位，不跟随滚动。
 */
export function OmOrderFooter({
  cartCount,
  primaryAmount,
  ctaLabel,
  discountLabel,
  onDiscountClick,
  onCta,
  onCartClick,
  layout = "amount-in-cta",
}: OmOrderFooterProps) {
  return (
    <div className="om-order-footer" {...inspectAttrs("OmOrderFooter", { bg: "background", spacing: "md" })}>
      <button
        className="om-order-footer__cart"
        type="button"
        onClick={onCartClick}
        aria-label="Cart"
      >
        <IonIcon icon={cartOutline} />
        {typeof cartCount === "number" && cartCount > 0 && (
          <span className="om-order-footer__badge">{cartCount > 99 ? "99+" : cartCount}</span>
        )}
      </button>

      {discountLabel && (
        <button className="om-order-footer__discount" type="button" onClick={onDiscountClick}>
          <span className="om-order-footer__discount-amount">{discountLabel}</span>
          <span className="om-order-footer__discount-label">
            Discount details
            <IonIcon icon={chevronForward} aria-hidden />
          </span>
        </button>
      )}

      {layout === "amount-in-cta" ? (
        <button className="om-order-footer__cta" type="button" onClick={onCta}>
          {ctaLabel ?? primaryAmount}
        </button>
      ) : (
        <div className="om-order-footer__split">
          <span className="om-order-footer__amount">{primaryAmount}</span>
          <button className="om-order-footer__cta pos-order-footer__cta--compact" type="button" onClick={onCta}>
            {ctaLabel}
          </button>
        </div>
      )}
    </div>
  );
}
