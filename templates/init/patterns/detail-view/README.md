# detail-view

A single-record detail page reached from a list. Carries one primary action.

## When to use

- User tapped a list row and wants to see / act on that record
- Read-mostly: data is rendered, action is "do the thing" not "edit fields"

## Skeleton

- `OmHeader` + `IonBackButton` (back to the list)
- `OmCard` for the primary record
- 0–N additional `OmCard` blocks for related sections
- Bottom: one `OmButton expand="block"`, or "Cancel / Confirm" pair

## When NOT to use

- User is editing fields → use `form-view`
- Lots of data + multiple sub-pages → consider a `tab-view` shell
