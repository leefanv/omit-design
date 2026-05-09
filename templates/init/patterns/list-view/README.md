# list-view

A scrolling list of homogeneous items, each tappable into a detail.

## When to use

- ≥ 4 items of the same shape (orders, products, members, coupons, settings rows…)
- Each item drills into a detail or triggers an action

## Skeleton

- `OmHeader` (with or without back button)
- Optional: `OmSearchBar`, tab strip, category chips
- `IonList` or a `<div>` wrapping a sequence of rows: `OmListRow` / `OmCouponCard` / `OmSettingRow` / `OmProductCard` / `OmMenuCard`
- Empty state: centered `OmEmptyState`

## When NOT to use

- ≤ 3 items → use `dashboard` or a single card
- Editing items inline → use `form-view`
