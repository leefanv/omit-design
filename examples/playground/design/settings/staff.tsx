// @pattern: list-view
export const meta = {
  name: "员工",
  pattern: "list-view",
  description: "员工与权限",
} as const;

import { OmHeader, OmListRow, OmPage } from "@omit-design/preset-mobile";

export function StaffPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="员工" />}>
      <OmListRow title="店长 · Lee" detail="管理员" />
      <OmListRow title="店员 · Mia" detail="收银 + 出品" />
      <OmListRow title="店员 · Tom" detail="出品" />
    </OmPage>
  );
}
export default StaffPage;
