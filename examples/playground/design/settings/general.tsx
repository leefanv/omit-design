// @pattern: list-view
export const meta = {
  name: "通用设置",
  pattern: "list-view",
  description: "店铺基础信息",
} as const;

import { OmHeader, OmListRow, OmPage } from "@omit-design/preset-mobile";

export function GeneralSettingsPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="通用设置" />}>
      <OmListRow title="店铺名称" detail="omit cafe" />
      <OmListRow title="营业时间" detail="08:00 – 22:00" />
      <OmListRow title="语言" detail="简体中文" />
      <OmListRow title="时区" detail="GMT+08:00" />
    </OmPage>
  );
}
export default GeneralSettingsPage;
