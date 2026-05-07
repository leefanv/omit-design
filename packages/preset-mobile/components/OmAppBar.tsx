import type { ReactNode } from "react";
import { IonIcon } from "@ionic/react";
import { storefront } from "ionicons/icons";
import { inspectAttrs } from "./inspect-attrs";
import "./om-app-bar.css";

interface BrandVariantProps {
  variant: "brand";
  brandTitle: string;
  /** 右侧按钮组（IonIcon 按钮等） */
  right?: ReactNode;
  /** 右侧头像 slot（圆形） */
  avatar?: ReactNode;
}

interface StoreVariantProps {
  variant?: "store";
  /** 门店名 + 门店编码：e.g. "文庙后街店（01001-029）" */
  storeTitle: string;
  /** 银台描述：e.g. "银台（0048）" */
  tillTitle: string;
  /** 右侧按钮组（扫码 / 更多） */
  right?: ReactNode;
}

type OmAppBarProps = BrandVariantProps | StoreVariantProps;

/**
 * POS 应用级 header。
 * - `variant="store"` —— 销售主页：显示门店 + 银台 + 右侧图标区。
 * - `variant="brand"` —— 商户中心：显示品牌 logo 文案 + 右侧头像/按钮。
 *
 * 作为 `<OmPage header={...}>` 的传参，与 IonContent 同级，不随内容滚动。
 */
export function OmAppBar(props: OmAppBarProps) {
  if (props.variant === "brand") {
    const { brandTitle, right, avatar } = props;
    return (
      <div className="om-app-bar pos-app-bar--brand" {...inspectAttrs("OmAppBar", { bg: "background", spacing: "lg" })}>
        <div className="om-app-bar__brand">
          <IonIcon icon={storefront} color="primary" className="om-app-bar__brand-icon" aria-hidden />
          <span className="om-app-bar__brand-title">{brandTitle}</span>
        </div>
        <div className="om-app-bar__right">
          {right}
          {avatar && <div className="om-app-bar__avatar">{avatar}</div>}
        </div>
      </div>
    );
  }

  const { storeTitle, tillTitle, right } = props;
  return (
    <div className="om-app-bar pos-app-bar--store" {...inspectAttrs("OmAppBar", { bg: "background", spacing: "lg" })}>
      <div className="om-app-bar__info">
        <p className="om-app-bar__info-primary">{storeTitle}</p>
        <p className="om-app-bar__info-secondary">{tillTitle}</p>
      </div>
      <div className="om-app-bar__divider" aria-hidden />
      <div className="om-app-bar__right">{right}</div>
    </div>
  );
}
