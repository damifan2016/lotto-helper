# lotto-helper

A small Lotto helper app with support for:

- **Lotto Max** — 7 main numbers from 1–50, plus a separate bonus number
- **Lotto 6/49** — 6 main numbers from 1–49, plus a separate bonus number

Project layout:

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
