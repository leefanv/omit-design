// @pattern: detail-view
export const meta = {
  name: "订单详情",
  pattern: "detail-view",
  description: "单个订单详情",
} as const;

import { IonBackButton } from "@ionic/react";
import { OmHeader, OmListRow, OmPage } from "@omit-design/preset-mobile";

export function OrderDetailPage() {
  return (
    <OmPage
      padding="none"
      header={<OmHeader title="订单详情" start={<IonBackButton defaultHref="/designs/orders/list" />} />}
    >
      <div style={{ padding: 16 }}>
        <h2 style={{ margin: 0 }}>#ORD-1001</h2>
        <p style={{ color: "#666" }}>2026-05-08 09:14 · 已完成</p>
      </div>
      <OmListRow title="拿铁 Latte × 2" detail="¥58" />
      <OmListRow title="支付方式" detail="微信支付" />
      <OmListRow title="备注" detail="少冰、少糖" />
    </OmPage>
  );
}
export default OrderDetailPage;
