// @pattern: list-view
export const meta = {
  name: "商品列表",
  pattern: "list-view",
  description: "商品总览",
} as const;

import { IonList } from "@ionic/react";
import { OmHeader, OmListRow, OmPage } from "@omit-design/preset-mobile";
import { productItems } from "../../mock/data";

export function ProductListPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="商品" />}>
      <IonList>
        {productItems.map((it) => (
          <OmListRow key={it.id} title={it.title} detail={it.detail} />
        ))}
      </IonList>
    </OmPage>
  );
}
export default ProductListPage;
