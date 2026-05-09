---
name: audit-design
description: Scan all design pages in an omit-design project for compliance violations (whitelist imports, design literals, missing pattern headers). Use when the user asks "is my design compliant?" or wants a batch audit before refactoring.
---

# audit-design — design page compliance review

## Platform conventions

**Mechanical checks go through `npm run lint`** (the single compliance command, which automatically covers `design/**/*.tsx`). This skill provides the **human-review narrative** (diagnosis, suggestions, summary) and **does not re-implement** rules ESLint already covers.

## Check items at a glance

For each page file under `design/**/*.tsx`, audit 5 items:

1. First-line `// @pattern: <name>` annotation.
2. Import sources whitelist.
3. No color literals.
4. No spacing / font-size literals.
5. Whitelisted components exist.

For the concrete rules, exceptions, and the corresponding ESLint rule name → [references/checks.md](references/checks.md).

## Severity tiers and output format

<HARD-GATE>
The severity tiers, emoji markers, and summary block format used by this skill must align with [references/severity-tiers.md](references/severity-tiers.md).
`omit-design lint` and this skill share the same severity contract — **do not invent your own levels or symbols in the skill output**.
</HARD-GATE>

## Flow

**Step 0 — delegate the scan to `audit-reviewer` if available.** If `.claude/agents/audit-reviewer.md` exists, invoke that sub-agent first to do the raw `omit-design lint --json` collection + a11y scan + per-file aggregation in an isolated context. It returns a structured markdown report. Treat its report as the input to step 3 below (skip steps 1–2). This keeps lint output out of the main conversation.

If `audit-reviewer` is not installed, run inline:

1. Run `npm run lint` to obtain structured machine output.
2. Read the output and aggregate by file: collapse multiple violations in the same file into a single section.
3. For each section, add a **human diagnosis**: why it happened, the recommended fix, whether it requires adding an Om* wrapper / adding a token / splitting a pattern.
4. Append a summary block at the end (formatted per severity-tiers.md).
5. List the top 3–5 files most worth fixing first (sorted by violation density × severity).

## When NOT to use this skill

- A quick compliance check after editing a single file → just run `npm run lint`.
- Just want to know "did my latest change introduce new violations?" → just run `npm run lint`.
- Looking up a pattern before writing a new design → use the `new-design` skill.
