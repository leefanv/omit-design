// @pattern: dashboard
export const meta = {
  name: "工作台",
  pattern: "dashboard",
  description: "首页：核心指标卡 + 入口磁贴",
} as const;

import { OmHeader, OmPage, OmStatCard } from "@omit-design/preset-mobile";
import { stats } from "../../mock/data";

export function DashboardPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="工作台" />}>
      <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {stats.map((s) => (
          <OmStatCard key={s.label} label={s.label} value={s.value} caption={s.caption} />
        ))}
      </div>
    </OmPage>
  );
}
export default DashboardPage;
