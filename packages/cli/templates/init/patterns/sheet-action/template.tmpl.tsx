// @pattern: sheet-action
// TEMPLATE — 复制到 design/<filename>/<filename>.tsx 后:
//   1. 替换 meta
//   2. 替换 ITEMS 为业务菜单项
//   3. dismissHref 改成来源页路径

export const meta = {
  name: "TODO Action menu",
  pattern: "sheet-action",
  description: "TODO one-line description",
  source: "prd",
} as const;

import { useNavigate } from "react-router-dom";
import { IonIcon } from "@ionic/react";
import { ellipsisHorizontalOutline } from "ionicons/icons";
import { OmPage, OmSheet } from "@omit-design/preset-mobile";

interface MenuItem {
  label: string;
  icon: string;
  href: string;
  danger?: boolean;
}

const ITEMS: MenuItem[] = [
  { label: "TODO Item one", icon: ellipsisHorizontalOutline, href: "/designs/TODO" },
  { label: "TODO Item two", icon: ellipsisHorizontalOutline, href: "/designs/TODO" },
];

export function TodoSheetActionPage() {
  const navigate = useNavigate();
  return (
    <OmPage padding="none">
      <OmSheet title="TODO Title" dismissHref="/designs/TODO-from">
        <div>
          {ITEMS.map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={() => navigate(it.href)}
            >
              <IonIcon icon={it.icon} />
              {it.label}
            </button>
          ))}
        </div>
      </OmSheet>
    </OmPage>
  );
}
export default TodoSheetActionPage;
