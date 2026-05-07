// @pattern: list-view
// TEMPLATE — 复制到 design/<filename>/<filename>.tsx 后:
//   1. 替换 meta.name / description
//   2. 把 ITEMS 换成真实 mock import
//   3. 替换 IonBackButton 的 defaultHref
//   4. 调整空态文案

export const meta = {
  name: "TODO 列表页名",
  pattern: "list-view",
  description: "TODO 一句话描述",
  source: "prd",
} as const;

import { IonBackButton, IonList } from "@ionic/react";
import {
  OmEmptyState,
  OmHeader,
  OmListRow,
  OmPage,
} from "@omit-design/preset-mobile";

interface Item {
  id: string;
  title: string;
  detail?: string;
}

// TODO: 替换为 import { items } from ""./mock/<group>" 相对路径";
const ITEMS: Item[] = [
  { id: "1", title: "示例条目 1", detail: "副信息" },
  { id: "2", title: "示例条目 2" },
];

export function TodoListPage() {
  return (
    <OmPage
      padding="none"
      header={
        <OmHeader
          title="TODO 标题"
          start={<IonBackButton defaultHref="/designs/TODO" />}
        />
      }
    >
      {ITEMS.length === 0 ? (
        <OmEmptyState title="暂无数据" description="TODO 空态描述" />
      ) : (
        <IonList lines="none">
          {ITEMS.map((it) => (
            <OmListRow key={it.id} title={it.title} detail={it.detail} />
          ))}
        </IonList>
      )}
    </OmPage>
  );
}
export default TodoListPage;
