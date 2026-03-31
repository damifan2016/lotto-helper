import { buildRecentWinningStoreResponse, sendJson } from '../../apps/api/lib/lotto.js';

export default async function handler(req, res) {
  const force = req.query?.force === '1';
  const data = await buildRecentWinningStoreResponse(force);
  sendJson(res, 200, data);
}
