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

app.get('/api/lottomax/recent-winning-store', async (req, res) => {
  const force = req.query.force === '1';
  const data = await buildRecentWinningStoreResponse(force);
  sendJson(res, 200, data);
});

app.listen(PORT, () => {
  console.log(`Lotto API running at http://localhost:${PORT}`);
});
