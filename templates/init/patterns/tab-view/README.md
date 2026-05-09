# tab-view

A bottom-tab navigation root — one of the app's primary destinations.

## When to use

- A top-level destination reached by tapping the bottom tab bar
- Has a brand header (not a back button) — these pages don't have a "parent"
- Body can be anything (list, form, cards, empty state)

## Skeleton

- `OmAppBar variant="brand"` — brand title + avatar / menu in top-right
- Body: pick the right pattern for the body content (list / form / dashboard…)
- `OmTabBar` at the bottom with the app's primary tabs

## When NOT to use

- No bottom tab present (e.g. a deep form page) → use the body pattern directly
- "Detail" pages reached from a tab → `detail-view`, not another tab-view
