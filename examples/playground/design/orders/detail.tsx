// @pattern: detail-view
export const meta = {
  name: "Order Details",
  pattern: "detail-view",
  description: "Single order details",
} as const;

import { IonBackButton } from "@ionic/react";
import { OmHeader, OmListRow, OmPage } from "@omit-design/preset-mobile";

export function OrderDetailPage() {
  return (
    <OmPage
      padding="none"
      header={<OmHeader title="Order Details" start={<IonBackButton defaultHref="/designs/orders/list" />} />}
    >
      <div style={{ padding: 16 }}>
        <h2 style={{ margin: 0 }}>#ORD-1001</h2>
        <p style={{ color: "#666" }}>2026-05-08 09:14 · Completed</p>
      </div>
      <OmListRow title="Latte × 2" detail="¥58" />
      <OmListRow title="Payment Method" detail="WeChat Pay" />
      <OmListRow title="Notes" detail="Less ice, less sugar" />
    </OmPage>
  );
}
export default OrderDetailPage;
