function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(data));
}

function pickNumbers(count, maxNumber) {
  const nums = new Set();
  while (nums.size < count) nums.add(Math.floor(Math.random() * maxNumber) + 1);
  return [...nums].sort((a, b) => a - b);
}

export default async function handler(_req, res) {
  try {
    const numbers = pickNumbers(7, 50);
    sendJson(res, 200, {
      game: 'Lotto Max',
      gameKey: 'lottomax',
      rules: {
        mainCount: 7,
        maxNumber: 50,
        hasBonus: false,
        bonusLabel: null
      },
      numbers,
      bonus: null,
      note: 'Random quick pick for fun. Not a prediction.'
    });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err?.message || String(err) });
  }
}
