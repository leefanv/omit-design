// @pattern: detail-view
export const meta = {
  name: "商品详情",
  pattern: "detail-view",
  description: "商品规格与价格",
} as const;

import { OmHeader, OmListRow, OmPage } from "@omit-design/preset-mobile";

export function ProductDetailPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="商品详情" />}>
      <div style={{ padding: 16 }}>
        <h2 style={{ margin: 0 }}>燕麦拿铁 Oat Latte</h2>
        <p style={{ color: "#666" }}>¥32 · 推荐</p>
      </div>
      <OmListRow title="规格" detail="中杯 / 大杯" />
      <OmListRow title="温度" detail="冷 / 热" />
      <OmListRow title="糖度" detail="无糖 / 半糖 / 全糖" />
    </OmPage>
  );
}
export default ProductDetailPage;
