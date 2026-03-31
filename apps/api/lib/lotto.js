const OLG_WHERE_SOLD_URL = 'https://about.olg.ca/winners-and-players/ticket-information/where-winning-tickets-were-sold/';

const GAME_CONFIG = {
  lottomax: {
    key: 'lottomax',
    label: 'Lotto Max',
    mainCount: 7,
    maxNumber: 50,
    hasBonus: false,
    bonusLabel: null,
    note: 'Random quick pick for fun. Not a prediction.'
  },
  lotto649: {
    key: 'lotto649',
    label: 'Lotto 6/49',
    mainCount: 6,
    maxNumber: 49,
    hasBonus: true,
    bonusLabel: 'Bonus Number',
    note: 'Random quick pick for fun. Not a prediction.'
  }
};

function getGameConfig(gameKey = 'lottomax') {
  return GAME_CONFIG[gameKey] || GAME_CONFIG.lottomax;
}

function pickNumbers(count, maxNumber) {
  const nums = new Set();
  while (nums.size < count) nums.add(Math.floor(Math.random() * maxNumber) + 1);
  return [...nums].sort((a, b) => a - b);
}

function pickBonus(exclude, maxNumber) {
  let n;
  do n = Math.floor(Math.random() * maxNumber) + 1;
  while (exclude.includes(n));
  return n;
}

function parseDate(value) {
  const m = String(value || '').trim().match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  if (!m) return null;
  const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  const mm = months[m[2]];
  if (mm == null) return null;
  return new Date(Date.UTC(Number(m[3]), mm, Number(m[1])));
}

function stripTags(s) {
  return String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseWhereSoldRows(html) {
  const rows = [];
  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  for (const tr of trMatches) {
    const tds = tr.match(/<td[\s\S]*?<\/td>/gi) || [];
    if (tds.length < 5) continue;

    const name = stripTags(tds[0]);
    const address = stripTags(tds[1]);
    const product = stripTags(tds[2]);
    const drawRaw = stripTags(tds[3]);
    const value = stripTags(tds[4]);

    if (!name || !address || !product) continue;
    const drawDate = parseDate(drawRaw);
    if (!drawDate) continue;

    rows.push({ name, address, product, drawRaw, drawDate, value });
  }
  return rows;
}

function pickLatestLottoMax(rows) {
  const lottoMaxRows = rows
    .filter(r => /lotto\s*max/i.test(r.product))
    .sort((a, b) => b.drawDate - a.drawDate);
  return lottoMaxRows[0] || null;
}

const cache = {
  updatedAt: 0,
  ttlMs: 30 * 60 * 1000,
  storeData: null,
  error: null
};

async function refreshWhereSoldCache() {
  try {
    if (typeof fetch !== 'function') {
      throw new Error('Global fetch is unavailable in this runtime');
    }

    const res = await fetch(OLG_WHERE_SOLD_URL, {
      headers: { 'user-agent': 'Mozilla/5.0 (LottoHelper/1.0)' }
    });
    if (!res.ok) throw new Error(`OLG fetch failed: ${res.status}`);

    const html = await res.text();
    const rows = parseWhereSoldRows(html);
    const latest = pickLatestLottoMax(rows);
    if (!latest) throw new Error('No Lotto Max row found in OLG where-sold page');

    cache.storeData = {
      game: 'Lotto Max',
      drawDate: latest.drawRaw,
      storeName: latest.name,
      location: latest.address,
      prizeValue: latest.value,
      source: OLG_WHERE_SOLD_URL,
      sourceLabel: 'Official OLG – Where Winning Tickets Were Sold',
      note: 'Derived from OLG table row with Product containing "Lotto Max" and latest draw date.'
    };
    cache.error = null;
    cache.updatedAt = Date.now();
    return cache.storeData;
  } catch (err) {
    cache.error = err.message || 'Unknown refresh error';
    if (!cache.storeData) {
      cache.storeData = {
        game: 'Lotto Max',
        drawDate: null,
        storeName: null,
        location: null,
        prizeValue: null,
        source: OLG_WHERE_SOLD_URL,
        sourceLabel: 'Official OLG – Where Winning Tickets Were Sold',
        note: 'Live data temporarily unavailable.'
      };
    }
    return cache.storeData;
  }
}

async function getCachedStoreData(force = false) {
  const expired = (Date.now() - cache.updatedAt) > cache.ttlMs;
  if (force || !cache.updatedAt || expired) {
    return refreshWhereSoldCache();
  }
  return cache.storeData;
}

function buildPickResponse(gameKey = 'lottomax') {
  const game = getGameConfig(gameKey);
  const numbers = pickNumbers(game.mainCount, game.maxNumber);
  const bonus = game.hasBonus ? pickBonus(numbers, game.maxNumber) : null;
  return {
    game: game.label,
    gameKey: game.key,
    rules: {
      mainCount: game.mainCount,
      maxNumber: game.maxNumber,
      hasBonus: game.hasBonus,
      bonusLabel: game.bonusLabel
    },
    numbers,
    bonus,
    note: game.note
  };
}

async function buildRecentWinningStoreResponse(force = false) {
  const data = await getCachedStoreData(force);
  return {
    ...data,
    cacheUpdatedAt: cache.updatedAt ? new Date(cache.updatedAt).toISOString() : null,
    cacheTtlMinutes: Math.round(cache.ttlMs / 60000),
    fetchError: cache.error
  };
}

function sendJson(res, status, data) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(data));
}

export {
  GAME_CONFIG,
  getGameConfig,
  buildPickResponse,
  buildRecentWinningStoreResponse,
  sendJson,
  refreshWhereSoldCache,
  getCachedStoreData
};
