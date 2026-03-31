import { buildPickResponse, sendJson } from '../../apps/api/lib/lotto.js';

export default async function handler(_req, res) {
  sendJson(res, 200, buildPickResponse());
}
