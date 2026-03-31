import {
  buildRecentWinningStoreResponse,
  sendJson
} from '../../apps/api/lib/lotto.js';

export default async function handler(req, res) {
  try {
    const force = req.query?.force === '1';
    const data = await buildRecentWinningStoreResponse(force);
    sendJson(res, 200, data);
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err?.message || String(err) });
  }
}
