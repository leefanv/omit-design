// @pattern: list-view
export const meta = {
  name: "Order List",
  pattern: "list-view",
  description: "Recent orders",
} as const;

import { IonList } from "@ionic/react";
import { OmHeader, OmListRow, OmPage } from "@omit-design/preset-mobile";
import { orderItems } from "../../mock/data";

export function OrderListPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="Orders" />}>
      <IonList>
        {orderItems.map((it) => (
          <OmListRow key={it.id} title={it.title} detail={it.detail} href={`/designs/orders/detail`} />
        ))}
      </IonList>
    </OmPage>
  );
}
export default OrderListPage;
