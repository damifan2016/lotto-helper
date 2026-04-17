import express from 'express';
import cors from 'cors';
import {
  buildPickResponse,
  buildRecentWinningStoreResponse,
  sendJson,
  refreshWhereSoldCache
} from './lib/lotto.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || process.env.API_PORT || 3002;

function asyncRoute(handler) {
  return (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);
}

// best-effort warmup for local dev
refreshWhereSoldCache().catch(() => {});

app.get('/api/health', (_req, res) => {
  sendJson(res, 200, { ok: true });
});

app.get('/api/lottomax/pick', (_req, res) => {
  sendJson(res, 200, buildPickResponse('lottomax'));
});

app.get('/api/lotto649/pick', (_req, res) => {
  sendJson(res, 200, buildPickResponse('lotto649'));
});

app.get(
  '/api/lottomax/recent-winning-store',
  asyncRoute(async (req, res) => {
    const force = req.query.force === '1';
    const data = await buildRecentWinningStoreResponse('lottomax', force);
    sendJson(res, 200, data);
  })
);

app.get(
  '/api/lotto649/recent-winning-store',
  asyncRoute(async (req, res) => {
    const force = req.query.force === '1';
    const data = await buildRecentWinningStoreResponse('lotto649', force);
    sendJson(res, 200, data);
  })
);

app.use((err, _req, res, _next) => {
  const message = err?.message || 'Unexpected server error';
  sendJson(res, 500, { ok: false, error: message });
});

app.listen(PORT, () => {
  console.log(`Lotto API running at http://localhost:${PORT}`);
});
