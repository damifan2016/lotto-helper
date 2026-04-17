export function randomUniqueFromRange(count, maxNumber, excluded = []) {
  const blocked = new Set(excluded);
  const out = [];

  while (out.length < count) {
    const n = Math.floor(Math.random() * maxNumber) + 1;
    if (blocked.has(n) || out.includes(n)) continue;
    out.push(n);
  }

  return out;
}

export function buildFavoriteMix({
  baseNumbers = [],
  favorites = [],
  mainCount,
  maxNumber,
  randomNumbers = []
}) {
  const uniqueFavorites = [...new Set(favorites)]
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= maxNumber)
    .slice(0, mainCount);

  const result = [...uniqueFavorites];

  for (const n of baseNumbers) {
    if (!Number.isInteger(n) || n < 1 || n > maxNumber || result.includes(n))
      continue;
    if (result.length >= mainCount) break;
    result.push(n);
  }

  for (const n of randomNumbers) {
    if (!Number.isInteger(n) || n < 1 || n > maxNumber || result.includes(n))
      continue;
    if (result.length >= mainCount) break;
    result.push(n);
  }

  if (result.length < mainCount) {
    result.push(
      ...randomUniqueFromRange(mainCount - result.length, maxNumber, result)
    );
  }

  return result.slice(0, mainCount).sort((a, b) => a - b);
}

export function buildCopyText(pick) {
  if (!pick?.game || !Array.isArray(pick?.numbers) || !pick.numbers.length)
    return '';

  const headline = `${pick.game}: ${pick.numbers.join(', ')}`;
  return pick.note ? `${headline} — ${pick.note}` : headline;
}

export function buildStoreSummary(store) {
  const title = `${store?.storeName || 'Winning retailer unavailable'} • ${store?.location || 'Location unavailable'}`;
  const meta = `Draw: ${store?.drawDate || 'N/A'} · Prize: ${store?.prizeValue || 'N/A'}`;
  return { title, meta };
}

export function getRefreshLabel(store) {
  if (!store?.cacheUpdatedAt) return 'Waiting for live store refresh';

  const refreshedAt = new Date(store.cacheUpdatedAt);
  if (Number.isNaN(refreshedAt.getTime()))
    return 'Waiting for live store refresh';

  return `Store data refreshed ${refreshedAt.toLocaleString()}`;
}
