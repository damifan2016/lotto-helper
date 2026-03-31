# @lotto/api

Lotto Helper API logic.

## Local development

```bash
npm run dev -w @lotto/api
```

This starts the local Express server for development.

## Production / Vercel

Production requests are handled by root-level Vercel functions in:

- `api/health.js`
- `api/lottomax/pick.js`
- `api/lottomax/recent-winning-store.js`

Shared logic lives in:

- `apps/api/lib/lotto.js`

## Endpoints

- `GET /api/health`
- `GET /api/lottomax/pick`
- `GET /api/lottomax/recent-winning-store`

## Notes

The serverless version uses request-driven refresh with in-memory cache when warm. It does not rely on a long-running timer.
