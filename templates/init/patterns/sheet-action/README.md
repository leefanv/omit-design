# sheet-action

Bottom-sheet action menu or detail drawer. The user stays on the source page contextually.

## When to use

- A short action menu (3–7 items) triggered from a row's "more" / "•••"
- A detail drawer that doesn't deserve a full page

In omit-design's design-page model, each sheet state is its OWN design file (separate URL). No JS callbacks — the sheet is a static frame.

## Skeleton

- `OmPage padding="none"`
- `OmSheet title="..." dismissHref="..."` containing:
  - A series of action rows (menu shape), or
  - A pure information block (detail shape)
- Dismissal: tap scrim, `×`, or any action row navigates away

## When NOT to use

- One-line confirmation + single button → `dialog-view`
- Needs input fields → `form-view`
