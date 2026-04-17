import { buildPickResponse, sendJson } from '../../apps/api/lib/lotto.js';

export default async function handler(_req, res) {
  try {
    sendJson(res, 200, buildPickResponse('lotto649'));
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err?.message || String(err) });
  }
}
