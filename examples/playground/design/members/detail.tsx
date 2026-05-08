// @pattern: detail-view
export const meta = {
  name: "会员详情",
  pattern: "detail-view",
  description: "会员档案明细",
} as const;

import { OmHeader, OmListRow, OmPage } from "@omit-design/preset-mobile";

export function MemberDetailPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="会员详情" />}>
      <div style={{ padding: 16 }}>
        <h2 style={{ margin: 0 }}>Lee Fan</h2>
        <p style={{ color: "#666" }}>黑卡会员 · 累计 12 笔</p>
      </div>
      <OmListRow title="联系电话" detail="138 ****  0001" />
      <OmListRow title="加入时间" detail="2025-01-12" />
      <OmListRow title="积分" detail="2,480" />
    </OmPage>
  );
}
export default MemberDetailPage;
