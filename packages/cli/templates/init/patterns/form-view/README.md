# form-view

Create or edit a single record via a form.

## When to use

- User needs to type / pick values
- Has at least one input field
- Submission is "save this record"

## Skeleton

- `OmHeader` + `IonBackButton` (back / cancel)
- One or more `OmInput` / `OmSelect`, grouped by business meaning
- Inline error states (red border + helper text)
- Bottom: one fixed `OmButton expand="block"` to submit
- Optional: post-submit confirmation in `OmDialog`

## When NOT to use

- Read-only display → `detail-view`
- Action menu without input → `sheet-action`
