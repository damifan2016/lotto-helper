# Lotto Helper Second-Pass Report

Date: 2026-04-17
Project: `/Users/andymm4/Workspace/Projects/lotto-helper`

## Scope

This second pass focused on three areas:

1. Frontend UX polish
2. Extracting inline CSS into maintainable source files
3. Adding lint + format tooling for the workspace

## Changes made

### 1) Frontend UX polish

Updated `apps/web/src/main.jsx` to improve usability and maintainability.

What changed:

- Added a status row showing:
  - active game
  - count of pinned favorites
  - winning-store refresh status
- Added a `Copy quick pick` action for generated picks
- Added a `Clear favorites` action
- Improved handling of copied state feedback
- Kept store summary text centralized through helpers
- Refactored favorite-mix generation to use reusable helper functions

Why it helps:

- Faster repeated use
- Clearer current-state feedback
- Better experience for users saving and sharing picks

### 2) Extracted frontend helpers

Added:

- `apps/web/src/app-utils.js`

New helpers cover:

- favorite-mix generation
- share/copy text generation
- winning-store summary formatting
- refresh label formatting

Why it helps:

- Keeps UI component code smaller
- Makes key behaviors testable without a browser
- Reduces logic duplication inside the main React component

### 3) Extracted CSS from HTML

Moved the large inline `<style>` block out of `apps/web/index.html` into:

- `apps/web/src/styles.css`

Also simplified `apps/web/index.html` and added a useful meta description.

Why it helps:

- Easier maintenance
- Cleaner HTML shell
- Better separation of concerns
- CSS now flows naturally through Vite build output

### 4) Added frontend tests

Added:

- `apps/web/test/app-utils.test.js`

Coverage includes:

- favorites mix generation behavior
- copy-text generation
- winning-store summary fallback behavior

Also added script:

- `apps/web/package.json` → `npm run test`

### 5) Added repo-level lint and format tooling

Updated root workspace setup:

- `package.json`
- `package-lock.json`
- `eslint.config.mjs`
- `.prettierrc.json`
- `.prettierignore`

Installed dev dependencies:

- `eslint`
- `@eslint/js`
- `globals`
- `prettier`

New root commands:

- `npm test`
- `npm run build`
- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run format:check`

## Validation performed

### Full test run

```bash
npm test
```

Result:

- API tests passed
- Web helper tests passed

### Lint

```bash
npm run lint
```

Result:

- Passed

### Format check

```bash
npm run format:check
```

Result:

- Passed

### Build

```bash
npm run build
```

Result:

- Passed
- CSS now emitted as a separate built asset

## Key files added or updated in this pass

Updated:

- `apps/web/index.html`
- `apps/web/package.json`
- `apps/web/src/main.jsx`
- `package.json`
- `package-lock.json`

Added:

- `apps/web/src/app-utils.js`
- `apps/web/src/styles.css`
- `apps/web/test/app-utils.test.js`
- `eslint.config.mjs`
- `.prettierrc.json`
- `.prettierignore`

## Outcome

This second pass made the app easier to maintain and nicer to use:

- cleaner frontend structure
- reusable/testable UI logic
- extracted stylesheet
- copy/share convenience for picks
- workspace-wide lint/format/test commands

## Recommended next steps

If you want a third pass, best next options are:

1. Add component-level React UI tests
2. Add GitHub Actions CI for test/lint/build
3. Add lightweight loading skeletons and empty states
4. Add a deploy-ready environment/config guide
