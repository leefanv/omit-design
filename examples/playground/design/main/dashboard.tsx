// @pattern: dashboard
export const meta = {
  name: "Dashboard",
  pattern: "dashboard",
  description: "Home: Stat cards + Entry tiles",
} as const;

import { OmHeader, OmPage, OmStatCard } from "@omit-design/preset-mobile";
import { stats } from "../../mock/data";

export function DashboardPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="Dashboard" />}>
      <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {stats.map((s) => (
          <OmStatCard key={s.label} label={s.label} value={s.value} caption={s.caption} />
        ))}
      </div>
    </OmPage>
  );
}
export default DashboardPage;
