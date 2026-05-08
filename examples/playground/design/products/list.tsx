// @pattern: list-view
export const meta = {
  name: "Product List",
  pattern: "list-view",
  description: "Product overview",
} as const;

import { IonList } from "@ionic/react";
import { OmHeader, OmListRow, OmPage } from "@omit-design/preset-mobile";
import { productItems } from "../../mock/data";

export function ProductListPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="Products" />}>
      <IonList>
        {productItems.map((it) => (
          <OmListRow key={it.id} title={it.title} detail={it.detail} />
        ))}
      </IonList>
    </OmPage>
  );
}
export default ProductListPage;
