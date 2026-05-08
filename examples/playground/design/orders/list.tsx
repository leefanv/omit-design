// @pattern: list-view
export const meta = {
  name: "订单列表",
  pattern: "list-view",
  description: "近 24 小时订单",
} as const;

import { IonList } from "@ionic/react";
import { OmHeader, OmListRow, OmPage } from "@omit-design/preset-mobile";
import { orderItems } from "../../mock/data";

export function OrderListPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="订单" />}>
      <IonList>
        {orderItems.map((it) => (
          <OmListRow key={it.id} title={it.title} detail={it.detail} href={`/designs/orders/detail`} />
        ))}
      </IonList>
    </OmPage>
  );
}
export default OrderListPage;
