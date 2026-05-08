// @pattern: list-view
export const meta = {
  name: "Member List",
  pattern: "list-view",
  description: "Member profile",
} as const;

import { IonList } from "@ionic/react";
import { OmHeader, OmListRow, OmPage } from "@omit-design/preset-mobile";
import { memberItems } from "../../mock/data";

export function MemberListPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="Members" />}>
      <IonList>
        {memberItems.map((it) => (
          <OmListRow key={it.id} title={it.title} detail={it.detail} />
        ))}
      </IonList>
    </OmPage>
  );
}
export default MemberListPage;
