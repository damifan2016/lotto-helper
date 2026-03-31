# @lotto/api

Express API for Lotto Helper.

## Local development

```bash
npm run dev -w @lotto/api
```

## Production

```bash
npm run start -w @lotto/api
```

Environment variables:

- `API_PORT` — optional local override (defaults to `3002`)
- `PORT` — many hosts provide this automatically

## Endpoints

- `GET /api/health`
- `GET /api/lottomax/pick`
- `GET /api/lottomax/recent-winning-store`

## Deployment notes

This API is suitable for Node app hosts like Railway/Render/Fly.

Current implementation uses:
- an in-memory cache
- a 30 minute refresh timer

That is fine for a small always-on Node host, but not ideal for purely serverless environments.
