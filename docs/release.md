# Release process

Maintainer-only. There is no automated release workflow — `npm publish` is intentionally manual so a human approves every public-surface change.

## When to bump what

| Change | Bump |
|---|---|
| Engine source change | `engine` patch (or minor if class names removed) |
| Engine class names removed / peer dep widened | `engine` minor + `preset-mobile` minor (lockstep) + add `LEGACY_TOKENS` entries to `cli/upgrade` |
| `Om*` component added / removed | `preset-mobile` minor |
| Token defaults changed | `preset-mobile` patch |
| ESLint rule semantics changed | `eslint-plugin` minor |
| ESLint rule new option / fixer | `eslint-plugin` patch |
| CLI new command / template change | `cli` patch (rebuild dist before publish) |
| CLI init scaffold change (skills / agents / settings.json / husky hook) | `cli` minor — users on `^X.Y` will pick up new scaffold features on `init` |
| Figma plugin behavior changed | `figma-plugin` patch (zip rebuilt automatically by `prepublishOnly`) |

Pre-1.0, **breaking changes go in minor**, not major. Once we hit 1.0 this changes to standard SemVer.

## Step-by-step

### 1. Bump versions

Edit each affected package's `package.json`. If `engine` and `preset-mobile` move together (typical), update peer dep range in `preset-mobile/package.json` too:

```json
"peerDependencies": {
  "@omit-design/engine": "^0.X.0"
}
```

If `cli` changes, update both:
- `packages/cli/package.json` `version`
- `packages/cli/src/cli.ts` `meta.version` (the `--version` output)

If templates are updated (e.g. version pin for new engine major in `templates/init/package.json.tmpl`), `bun --cwd packages/cli run build` regenerates `packages/cli/templates/init/` from `templates/init/`.

### 2. Update CHANGELOG.md

Use [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. New section at top:

```markdown
## [0.X.0] - YYYY-MM-DD

One-paragraph summary.

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Removed
- ...
```

Per-package release notes (e.g. CLI-only patch) get their own dated entry like `## [0.1.4-cli] - YYYY-MM-DD`.

For minor releases that remove class names: add an explicit list under `### Removed` so the LEGACY_TOKENS table updater has source-of-truth.

### 3. Add LEGACY_TOKENS entries (when class names removed)

If the release removes any CSS class / API names, add them to `packages/cli/src/commands/upgrade.ts`'s `LEGACY_TOKENS` array:

```ts
{ token: "shell-device-screen", removedIn: "engine 0.2.0", replacement: ".shell-design-frame" },
```

Then `bun --cwd packages/cli run build` to rebuild `dist/`.

### 4. Commit

```bash
git add -p   # staged review
git commit -m "chore: release v0.X.Y (engine / preset-mobile)"
```

Conventional commit message. The release commit is `chore:` regardless of the underlying change kind — the CHANGELOG carries the detail.

### 5. Push to main + verify CI

```bash
git push origin main   # CI runs lint + typecheck
```

Wait for the CI run on `main` to go green before publishing. If it fails, fix forward (don't unpublish).

### 6. Pre-publish checks

```bash
# Local lint + typecheck
bun run lint
bun --cwd packages/engine run typecheck
bun --cwd packages/cli run typecheck

# Verify what each tarball will contain
cd packages/engine && npm pack --dry-run | tail -20
cd ../preset-mobile && npm pack --dry-run | tail -20
cd ../cli && npm pack --dry-run | tail -20
cd ../figma-plugin && npm pack --dry-run | tail -20
```

For `cli`, ensure `dist/` is up to date:

```bash
bun --cwd packages/cli run build
```

For `figma-plugin`, the `prepublishOnly` hook regenerates the zip automatically — no manual step needed, but you can verify:

```bash
unzip -l packages/figma-plugin/omit-web-to-figma.zip
```

### 7. Publish (in this order)

Order matters. Each downstream package may pull from its upstream tarball at install-time, so upstream must be live first.

1. **`engine`** — its peer is referenced by `preset-mobile`.
2. **`preset-mobile`** — depends on engine (peer).
3. **`eslint-plugin`** — independent; reads consumer project's `patterns/<id>/pattern.json` at lint-time, not preset files.
4. **`cli`** — its template pins all of the above as `^X.Y`.
5. **`figma-plugin`** — independent.

```bash
cd packages/engine && npm publish --access public
cd ../preset-mobile && npm publish --access public
cd ../eslint-plugin && npm publish --access public # only when rules changed
cd ../cli && npm publish --access public           # only when CLI changed
cd ../figma-plugin && npm publish --access public  # only when plugin changed
```

Or use the workspace flag from repo root (npm 7+):

```bash
npm publish --workspace=@omit-design/engine
npm publish --workspace=@omit-design/preset-mobile
npm publish --workspace=@omit-design/eslint-plugin
npm publish --workspace=@omit-design/cli
```

### 8. Verify

npm CDN can take 30–60s to propagate after publish:

```bash
curl -s https://registry.npmjs.org/@omit-design/engine/latest | grep '"version"'
curl -s https://registry.npmjs.org/@omit-design/preset-mobile/latest | grep '"version"'
curl -s https://registry.npmjs.org/@omit-design/cli/latest | grep '"version"'
```

For figma-plugin, also verify the zip is fetchable from unpkg/jsdelivr (the engine's `ExportFigmaDialog` uses these CDNs):

```bash
curl -sI 'https://unpkg.com/@omit-design/figma-plugin@latest/omit-web-to-figma.zip' | head -1
# expect: HTTP/2 200
```

Allow ~5 min for unpkg cache to refresh after publish.

### 9. Smoke test

In a temp directory:

```bash
cd /tmp && rm -rf release-smoke
npx @omit-design/cli@latest init release-smoke
cd release-smoke
npm install
npm run dev    # http://localhost:5173 — visit /workspace/app and /designs/main/welcome
npm run lint   # should pass on the demo design
```

If any of these break, hot-fix forward in a `fix:` commit and republish a patch.

## Rollback policy

- **Don't `npm unpublish`.** It's permitted within 72 hours but leaves traces in caches and breaks installs that pinned `^X.Y.Z`. Always fix forward with a new patch release.
- **Yank a broken version** (`npm deprecate @omit-design/engine@0.2.0 "use 0.2.1 instead"`) only if a patch can't go out within an hour. Deprecate first, ship the patch, document in CHANGELOG.

## Future automation

When the project graduates from one-maintainer mode, automate via GitHub Action triggered by tag push:

```yaml
on:
  push:
    tags: [engine-v*, preset-mobile-v*, cli-v*, eslint-plugin-v*, figma-plugin-v*]
```

The action would publish the tagged package only — keeping per-package independence and human approval (via tag push). Not implemented yet; see the discussion in CONTRIBUTING.md.
