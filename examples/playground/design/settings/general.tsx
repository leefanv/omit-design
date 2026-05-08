// @pattern: list-view
export const meta = {
  name: "General Settings",
  pattern: "list-view",
  description: "Shop basics",
} as const;

import { OmHeader, OmListRow, OmPage } from "@omit-design/preset-mobile";

export function GeneralSettingsPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="General Settings" />}>
      <OmListRow title="Shop Name" detail="omit cafe" />
      <OmListRow title="Hours" detail="08:00 – 22:00" />
      <OmListRow title="Language" detail="Simplified Chinese" />
      <OmListRow title="Timezone" detail="GMT+08:00" />
    </OmPage>
  );
}
export default GeneralSettingsPage;
