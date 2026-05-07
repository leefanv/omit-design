import { IonIcon } from "@ionic/react";
import { add } from "ionicons/icons";
import { inspectAttrs } from "./inspect-attrs";
import "./om-product-card.css";

interface OmProductCardProps {
  /** 图片 emoji / 占位文字 */
  emoji?: string;
  name: string;
  sku: string;
  /** 单价（元） */
  price: number;
  /** 单位：瓶/盒/件 */
  unit: string;
  /** 可售库存 */
  stock: number;
  onAdd?: () => void;
  onClick?: () => void;
}

/**
 * 商品卡（销售主页 / 搜索结果）。
 * 左侧 80×80 图，右侧名称 + SKU + 价格 + 库存，右下角 "加购" FAB。
 */
export function OmProductCard({
  emoji,
  name,
  sku,
  price,
  unit,
  stock,
  onAdd,
  onClick,
}: OmProductCardProps) {
  return (
    <div
      className="om-product"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...inspectAttrs("OmProductCard", { bg: "background", radius: "md", shadow: "sm", spacing: "md" })}
    >
      <div className="om-product__image" aria-hidden>
        {emoji && <span className="om-product__emoji">{emoji}</span>}
      </div>
      <div className="om-product__body">
        <div className="om-product__titles">
          <p className="om-product__name">{name}</p>
          <p className="om-product__sku">{sku}</p>
        </div>
        <div className="om-product__foot">
          <div className="om-product__price-group">
            <span className="om-product__price">
              <span className="om-product__price-sign">￥</span>
              <span className="om-product__price-value">{price.toFixed(2)}</span>
            </span>
            <span className="om-product__unit">/{unit}</span>
            <span className="om-product__stock">库存{stock}</span>
          </div>
          <button
            className="om-product__add"
            type="button"
            aria-label={`加购 ${name}`}
            onClick={(e) => {
              e.stopPropagation();
              onAdd?.();
            }}
          >
            <IonIcon icon={add} />
          </button>
        </div>
      </div>
    </div>
  );
}
