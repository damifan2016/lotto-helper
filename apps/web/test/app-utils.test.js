import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildFavoriteMix,
  buildCopyText,
  buildStoreSummary
} from '../src/app-utils.js';

test('buildFavoriteMix keeps favorites, removes duplicates, and returns a sorted pick', () => {
  const result = buildFavoriteMix({
    baseNumbers: [10, 12, 12, 15, 18, 19],
    favorites: [7, 7, 12, 4],
    mainCount: 6,
    maxNumber: 49,
    randomNumbers: [22, 9, 4, 21]
  });

  assert.deepEqual(result, [4, 7, 10, 12, 15, 18]);
});

test('buildCopyText creates a shareable quick-pick line', () => {
  const text = buildCopyText({
    game: 'Lotto Max',
    numbers: [3, 8, 11, 17, 22, 31, 45],
    note: 'Random quick pick for fun. Not a prediction.'
  });

  assert.match(text, /^Lotto Max: 3, 8, 11, 17, 22, 31, 45/);
  assert.match(text, /Random quick pick for fun/);
});

test('buildStoreSummary returns a friendly fallback when data is missing', () => {
  const summary = buildStoreSummary({
    storeName: null,
    location: null,
    drawDate: null,
    prizeValue: null
  });

  assert.equal(
    summary.title,
    'Winning retailer unavailable • Location unavailable'
  );
  assert.equal(summary.meta, 'Draw: N/A · Prize: N/A');
});
