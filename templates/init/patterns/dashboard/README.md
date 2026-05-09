# dashboard

Workspace / home aggregator. Top metrics, then a menu grid of entry points.

Not a tab navigator, not a list, not a form — it's a multi-entry hub.

## When to use

- A "home" page that fans out to many sub-flows
- Has both at-a-glance numbers AND navigational entry tiles

## Skeleton

- `OmHeader` with optional back
- A row (or two) of `OmStatCard` for KPIs
- A 3-column grid of `OmMenuCard` for primary entry points
  (use `disabled + badge="Coming soon"` to render upcoming features greyed)

## When NOT to use

- A single primary action → `welcome-view`
- A flat list of records → `list-view`
