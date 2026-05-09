// @pattern: list-view
// TEMPLATE — 复制到 design/<filename>/<filename>.tsx 后:
//   1. 替换 meta.name / description
//   2. 把 ITEMS 换成真实 mock import
//   3. 替换 IonBackButton 的 defaultHref
//   4. 调整空态文案

export const meta = {
  name: "TODO List page",
  pattern: "list-view",
  description: "TODO one-line description",
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
  { id: "1", title: "Sample item 1", detail: "Subinfo" },
  { id: "2", title: "Sample item 2" },
];

export function TodoListPage() {
  return (
    <OmPage
      padding="none"
      header={
        <OmHeader
          title="TODO Title"
          start={<IonBackButton defaultHref="/designs/TODO" />}
        />
      }
    >
      {ITEMS.length === 0 ? (
        <OmEmptyState title="No data" description="TODO empty-state description" />
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
