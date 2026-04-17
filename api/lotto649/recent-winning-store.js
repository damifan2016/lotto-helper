import {
  buildRecentWinningStoreResponse,
  sendJson
} from '../../apps/api/lib/lotto.js';

export default async function handler(req, res) {
  try {
    const force = req.query?.force === '1';
    sendJson(
      res,
      200,
      await buildRecentWinningStoreResponse('lotto649', force)
    );
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err?.message || String(err) });
  }
}
