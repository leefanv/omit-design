// @pattern: detail-view
export const meta = {
  name: "Product Details",
  pattern: "detail-view",
  description: "Product specs & price",
} as const;

import { OmHeader, OmListRow, OmPage } from "@omit-design/preset-mobile";

export function ProductDetailPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="Product Details" />}>
      <div style={{ padding: 16 }}>
        <h2 style={{ margin: 0 }}>Oat Latte</h2>
        <p style={{ color: "#666" }}>¥32 · Recommended</p>
      </div>
      <OmListRow title="Size" detail="Medium / Large" />
      <OmListRow title="Temperature" detail="Iced / Hot" />
      <OmListRow title="Sweetness" detail="None / Half / Full" />
    </OmPage>
  );
}
export default ProductDetailPage;
