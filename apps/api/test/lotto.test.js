import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPickResponse,
  parseWhereSoldRows,
  buildRecentWinningStoreResponse
} from '../lib/lotto.js';

test('buildPickResponse returns sorted unique numbers within the game range', () => {
  const result = buildPickResponse('lotto649');

  assert.equal(result.gameKey, 'lotto649');
  assert.equal(result.numbers.length, 6);
  assert.deepEqual(
    result.numbers,
    [...result.numbers].sort((a, b) => a - b)
  );
  assert.equal(new Set(result.numbers).size, 6);
  assert.ok(
    result.numbers.every((n) => Number.isInteger(n) && n >= 1 && n <= 49)
  );
});

test('parseWhereSoldRows strips tags and decodes common HTML entities', () => {
  const rows = parseWhereSoldRows(`
    <table>
      <tr>
        <td>Lucky &amp; Sons</td>
        <td>123 King&nbsp;St &amp; Queen</td>
        <td>Lotto Max</td>
        <td>17-Apr-2026</td>
        <td>$50,000</td>
      </tr>
    </table>
  `);

  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    name: 'Lucky & Sons',
    address: '123 King St & Queen',
    product: 'Lotto Max',
    drawRaw: '17-Apr-2026',
    drawDate: new Date(Date.UTC(2026, 3, 17)),
    value: '$50,000'
  });
});

test('buildRecentWinningStoreResponse falls back gracefully when live fetch returns no rows', async (t) => {
  const originalFetch = global.fetch;

  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => ({
    ok: true,
    text: async () => '<table><tr><td>bad row</td></tr></table>'
  });

  const result = await buildRecentWinningStoreResponse('lottomax', true);

  assert.equal(result.gameKey, 'lottomax');
  assert.equal(result.storeName, null);
  assert.equal(result.location, null);
  assert.match(result.note, /temporarily unavailable/i);
  assert.match(result.fetchError, /No valid rows found/i);
});
