// @pattern: list-view
export const meta = {
  name: "Staff",
  pattern: "list-view",
  description: "Staff & permissions",
} as const;

import { OmHeader, OmListRow, OmPage } from "@omit-design/preset-mobile";

export function StaffPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="Staff" />}>
      <OmListRow title="Manager · Lee" detail="Admin" />
      <OmListRow title="Staff · Mia" detail="Cashier + Barista" />
      <OmListRow title="Staff · Tom" detail="Barista" />
    </OmPage>
  );
}
export default StaffPage;
