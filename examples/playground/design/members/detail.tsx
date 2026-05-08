// @pattern: detail-view
export const meta = {
  name: "Member Details",
  pattern: "detail-view",
  description: "Member profile detail",
} as const;

import { OmHeader, OmListRow, OmPage } from "@omit-design/preset-mobile";

export function MemberDetailPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="Member Details" />}>
      <div style={{ padding: 16 }}>
        <h2 style={{ margin: 0 }}>Lee Fan</h2>
        <p style={{ color: "#666" }}>Black Card · 12 orders total</p>
      </div>
      <OmListRow title="Phone" detail="138 ****  0001" />
      <OmListRow title="Joined" detail="2025-01-12" />
      <OmListRow title="Points" detail="2,480" />
    </OmPage>
  );
}
export default MemberDetailPage;
