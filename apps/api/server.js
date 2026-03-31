import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || process.env.API_PORT || 3002;
const OLG_WHERE_SOLD_URL = 'https://about.olg.ca/winners-and-players/ticket-information/where-winning-tickets-were-sold/';

function pickLottoMaxNumbers() {
  const nums = new Set();
  while (nums.size < 7) nums.add(Math.floor(Math.random() * 50) + 1);
  return [...nums].sort((a, b) => a - b);
}

function pickBonus(exclude) {
  let n;
  do n = Math.floor(Math.random() * 50) + 1;
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
    if (!drawDate) continue; // skip non-date rows (instant ticket IDs etc)

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

let cache = {
  updatedAt: 0,
  ttlMs: 30 * 60 * 1000,
  storeData: null,
  error: null
};

async function refreshWhereSoldCache() {
  try {
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

// warm + scheduled refresh (safe frequency: every 30 min)
refreshWhereSoldCache();
setInterval(refreshWhereSoldCache, 30 * 60 * 1000);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/lottomax/pick', (_req, res) => {
  const numbers = pickLottoMaxNumbers();
  const bonus = pickBonus(numbers);
  res.json({ game: 'Lotto Max', numbers, bonus, note: 'Random quick pick for fun. Not a prediction.' });
});

app.get('/api/lottomax/recent-winning-store', async (req, res) => {
  const force = req.query.force === '1';
  const data = await getCachedStoreData(force);
  res.json({
    ...data,
    cacheUpdatedAt: cache.updatedAt ? new Date(cache.updatedAt).toISOString() : null,
    cacheTtlMinutes: Math.round(cache.ttlMs / 60000),
    fetchError: cache.error
  });
});

app.listen(PORT, () => {
  console.log(`Lotto API running at http://localhost:${PORT}`);
});
