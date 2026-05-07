// @pattern: tab-view
// TEMPLATE — 复制到 design/<filename>/<filename>.tsx 后:
//   1. 替换 meta + 品牌文案
//   2. 主体内容替换为业务(列表/表单/空态)
//   3. TABS 列表通常项目级常量 —— 抽到 shell 文件复用更好
//
// 注:tab-view 通常由 MemberShell 等 shell 文件统一管理 OmTabBar。
// 本 template 展示扁平结构,首批落地后可重构为 shell。

export const meta = {
  name: "TODO Tab 页",
  pattern: "tab-view",
  description: "TODO 一句话描述",
  source: "prd",
} as const;

import {
  cubeOutline,
  peopleOutline,
  receiptOutline,
  settingsOutline,
} from "ionicons/icons";
import {
  OmAppBar,
  OmPage,
  OmTabBar,
  type OmTabItem,
} from "@omit-design/preset-mobile";

const TABS: OmTabItem[] = [
  { tab: "stored", href: "/designs/TODO-stored", label: "寄存", icon: cubeOutline },
  { tab: "orders", href: "/designs/TODO-orders", label: "订单", icon: receiptOutline },
  { tab: "member", href: "/designs/TODO-member", label: "会员", icon: peopleOutline },
  { tab: "settings", href: "/designs/TODO-settings", label: "设置", icon: settingsOutline },
];

export function TodoTabPage() {
  return (
    <OmPage
      padding="lg"
      header={<OmAppBar variant="brand" brandTitle="TODO 品牌" />}
    >
      <div>
        {/* TODO: 主体内容 —— 表单 / 列表 / 空态 */}
        <h1>TODO Tab 页主体</h1>
      </div>
      <OmTabBar items={TABS} />
    </OmPage>
  );
}
export default TodoTabPage;
