# welcome-view

Launch / welcome / onboarding intro. Brand + headline + one primary CTA.

## When to use

- The very first screen a user sees
- Pure intro: no input, no list, just identity and an entry point
- Single primary action ("Get started", "Open the app")

## Skeleton

- `OmPage padding="none"` (the page controls its own whitespace)
- Brand block: logo + product name (optional tagline)
- Welcome copy: headline + description
- Bottom: a single `OmButton expand="block"` primary CTA
- Optional: version number at the very bottom

## When NOT to use

- Has any input → `form-view`
- Multi-screen swipeable feature tour → propose a new `onboarding-carousel` pattern
