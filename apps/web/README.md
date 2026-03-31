# @lotto/web

Vite + React frontend for Lotto Helper.

## Local development

```bash
npm run dev -w @lotto/web
```

## Environment variables

Create an `.env` file if needed:

```bash
VITE_API_BASE_URL=http://localhost:3002/api
```

Behavior:

- in local dev, if `VITE_API_BASE_URL` is not set, the app falls back to `http(s)://<current-host>:3002/api`
- in production, if `VITE_API_BASE_URL` is not set, the app falls back to same-origin `/api`

## Deployment

This app is now intended to work with Vercel-only deployment using root-level Vercel API routes.
