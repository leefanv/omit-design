# dialog-view

A modal dialog state — modeled as its own page in omit-design. Every dialog state has a URL, lives in the side nav, and can be opened directly.

## When to use

- "Confirmation" or "result" overlays: success, failure, are-you-sure
- One short message + at most two buttons
- The flow returns to a known page (no inline state held)

## Skeleton

- `OmPage padding="none" header={...}` (often re-uses the source page's header)
- Background layer:
  - A frozen snapshot of the source page (visually disabled), OR
  - A pure gradient
- `OmDialog` with:
  - icon / title / subtitle
  - one primary button → `confirmHref` to the next page

## When NOT to use

- Need fields / select → `form-view`
- Need an action menu → `sheet-action`
