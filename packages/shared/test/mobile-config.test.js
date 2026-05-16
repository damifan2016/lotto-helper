import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GAME_OPTIONS,
  buildApiUrl,
  getDefaultGameKey
} from '../src/mobile-config.js';

test('buildApiUrl joins base URL and game path without duplicate slashes', () => {
  assert.equal(
    buildApiUrl('https://lotto-lucky888.vercel.app/api/', '/lottomax/pick'),
    'https://lotto-lucky888.vercel.app/api/lottomax/pick'
  );
});

test('GAME_OPTIONS exposes both supported lottery games', () => {
  assert.deepEqual(Object.keys(GAME_OPTIONS).sort(), ['lotto649', 'lottomax']);
  assert.equal(GAME_OPTIONS.lottomax.mainCount, 7);
  assert.equal(GAME_OPTIONS.lotto649.maxNumber, 49);
});

test('getDefaultGameKey returns Lotto Max as the mobile default', () => {
  assert.equal(getDefaultGameKey(), 'lottomax');
});
