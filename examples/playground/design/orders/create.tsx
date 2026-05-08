// @pattern: form-view
export const meta = {
  name: "New Order",
  pattern: "form-view",
  description: "New order form",
} as const;

import { OmButton, OmHeader, OmInput, OmPage, OmSelect } from "@omit-design/preset-mobile";

export function CreateOrderPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="New Order" />}>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <OmInput label="Customer Name" placeholder="Enter name" />
        <OmSelect label="Product" options={[{ value: "p-001", label: "Latte" }, { value: "p-002", label: "Americano" }]} />
        <OmInput label="Quantity" type="number" placeholder="1" />
        <OmButton expand="block">Submit</OmButton>
      </div>
    </OmPage>
  );
}
export default CreateOrderPage;
