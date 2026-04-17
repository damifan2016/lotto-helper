# Lotto Helper Improvement Report

Date: 2026-04-17
Project: `/Users/andymm4/Workspace/Projects/lotto-helper`

## What I improved

### 1. Reduced backend duplication

I replaced the duplicated Vercel API route logic with thin handlers that reuse the shared implementation in `apps/api/lib/lotto.js`.

Updated files:

- `api/health.js`
- `api/lottomax/pick.js`
- `api/lotto649/pick.js`
- `api/lottomax/recent-winning-store.js`
- `api/lotto649/recent-winning-store.js`

Benefits:

- Less code to maintain
- Lower risk of behavior drift between local Express routes and deployed serverless routes
- Shared fixes now apply to both environments

### 2. Hardened the shared lotto data library

Updated `apps/api/lib/lotto.js` to improve correctness and resilience.

Changes:

- Added guardrails to `pickNumbers()` so invalid count/range combinations fail fast
- Added HTML entity decoding (`&amp;`, `&nbsp;`, etc.) when parsing OLG store table rows
- Added a 10-second timeout to the OLG fetch to avoid hanging requests
- Exported core helpers for direct test coverage

Benefits:

- Cleaner store names/addresses from scraped data
- More predictable API behavior under bad inputs or slow upstream responses
- Better testability

### 3. Improved Express API error handling

Updated `apps/api/server.js` to wrap async routes consistently and return structured JSON on unexpected failures.

Benefits:

- Avoids uncaught async route failures
- Keeps API responses consistent
- Easier to debug operational issues

### 4. Added automated tests

Added a lightweight Node test suite in:

- `apps/api/test/lotto.test.js`

Coverage added for:

- Quick-pick generation shape/range/uniqueness
- OLG row parsing with HTML entity decoding
- Graceful fallback when live winning-store fetch returns unusable HTML

Also added script:

- `apps/api/package.json` → `npm run test`

## Validation performed

### API tests

Command:

```bash
npm run test -w @lotto/api
```

Result:

- 3 tests passed

### Web build

Command:

```bash
npm run build -w @lotto/web
```

Result:

- Production build succeeded

## Change summary

Git diff summary:

- 8 files changed
- 60 insertions
- 320 deletions

Net effect:

- Smaller codebase
- Better reuse
- Better backend reliability
- New regression coverage

## Notes / next good improvements

If you want a second pass, the highest-value next steps would be:

1. Add frontend tests for `apps/web/src/main.jsx`
2. Split inline CSS from `apps/web/index.html` into dedicated stylesheet/module files
3. Add linting/formatting scripts at repo level
4. Add a shared workspace-level test/build pipeline in the root `package.json`
