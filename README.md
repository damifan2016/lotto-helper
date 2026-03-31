# lotto-helper

A small Lotto Max helper app with:

- `apps/web` — Vite + React frontend
- `apps/api` — Express API

## Development

Install dependencies from the repo root:

```bash
npm install
```

Run the API:

```bash
npm run dev:api
```

Run the web app:

```bash
npm run dev:web
```

By default, the web app expects the API at `http://localhost:3002/api`.

## Structure

- `apps/web` — frontend
- `apps/api` — backend

## Notes

This repo is being prepared for GitHub first, then likely deployment via Vercel (web) + Railway or similar (API).
