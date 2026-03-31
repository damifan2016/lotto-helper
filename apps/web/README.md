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

If `VITE_API_BASE_URL` is not set, the app falls back to:

- `http(s)://<current-host>:3002/api`

## Deployment

For Vercel, set:

- Root Directory: `apps/web`
- Build Command: `npm run dev -w @lotto/web` is for local dev only; for production you should use Vite build defaults or add a build script.
- Environment Variable: `VITE_API_BASE_URL=https://YOUR-API-DOMAIN/api`

This app is intended to be deployed separately from the API.
