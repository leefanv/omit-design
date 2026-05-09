// @pattern: dashboard
// TEMPLATE — 复制到 design/<filename>/<filename>.tsx 后:
//   1. 替换 meta + hero 文案
//   2. STATS / TILES 换成真实 mock import
//   3. 给 TILES 加合适 ionicons + href

export const meta = {
  name: "TODO Dashboard",
  pattern: "dashboard",
  description: "TODO one-line description",
  source: "prd",
} as const;

import { IonBackButton } from "@ionic/react";
import {
  appsOutline,
  cashOutline,
  receiptOutline,
} from "ionicons/icons";
import {
  OmHeader,
  OmMenuCard,
  OmPage,
  OmStatCard,
} from "@omit-design/preset-mobile";

interface Stat {
  label: string;
  value: string;
  caption?: string;
}

interface Tile {
  id: string;
  icon: string;
  label: string;
  href?: string;
  disabled?: boolean;
  badge?: string;
}

// TODO: 替换为真实 mock import
const STATS: Stat[] = [
  { label: "Today's revenue", value: "$0.00", caption: "Includes settled amount" },
  { label: "Order count", value: "0", caption: "orders" },
];

const TILES: Tile[] = [
  { id: "pos", icon: cashOutline, label: "POS", href: "/designs/TODO" },
  { id: "orders", icon: receiptOutline, label: "Orders", href: "/designs/TODO" },
];

export function TodoDashboardPage() {
  return (
    <OmPage
      padding="lg"
      header={
        <OmHeader
          title="TODO Dashboard"
          start={<IonBackButton defaultHref="/designs/TODO-from" />}
        />
      }
    >
      <div>
        {STATS.map((s) => (
          <OmStatCard
            key={s.label}
            label={s.label}
            value={s.value}
            caption={s.caption}
          />
        ))}
      </div>

      <div>
        {TILES.map((t) => (
          <OmMenuCard
            key={t.id}
            icon={t.icon ?? appsOutline}
            label={t.label}
            href={t.href}
            disabled={t.disabled}
            badge={t.badge}
          />
        ))}
      </div>
    </OmPage>
  );
}
export default TodoDashboardPage;
