// @pattern: list-view
export const meta = {
  name: "会员列表",
  pattern: "list-view",
  description: "会员档案",
} as const;

import { IonList } from "@ionic/react";
import { OmHeader, OmListRow, OmPage } from "@omit-design/preset-mobile";
import { memberItems } from "../../mock/data";

export function MemberListPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="会员" />}>
      <IonList>
        {memberItems.map((it) => (
          <OmListRow key={it.id} title={it.title} detail={it.detail} />
        ))}
      </IonList>
    </OmPage>
  );
}
export default MemberListPage;
