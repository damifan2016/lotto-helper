function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(data));
}

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

export default async function handler(_req, res) {
  try {
    const numbers = pickLottoMaxNumbers();
    const bonus = pickBonus(numbers);
    sendJson(res, 200, {
      game: 'Lotto Max',
      numbers,
      bonus,
      note: 'Random quick pick for fun. Not a prediction.'
    });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err?.message || String(err) });
  }
}
