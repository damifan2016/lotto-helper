import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

const API =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? `${window.location.protocol}//${window.location.hostname}:3002/api`
    : '/api');
const FAV_KEY = 'lotto-favorite-numbers-v1';

function App() {
  const [pick, setPick] = useState(null);
  const [store, setStore] = useState(null);
  const [loadingPick, setLoadingPick] = useState(false);
  const [loadingStore, setLoadingStore] = useState(false);
  const [showStoreDetails, setShowStoreDetails] = useState(false);
  const [revealTick, setRevealTick] = useState(0);
  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(0, 7) : [];
    } catch {
      return [];
    }
  });
  const [showFavoritePanel, setShowFavoritePanel] = useState(false);
  const [error, setError] = useState('');

  const generatePick = async () => {
    setError('');
    setLoadingPick(true);
    try {
      const r = await fetch(`${API}/lottomax/pick`);
      setPick(await r.json());
      setRevealTick((t) => t + 1);
    } catch {
      setError('Could not generate numbers.');
    } finally {
      setLoadingPick(false);
    }
  };

  const randomUniqueFromRange = (count, excluded = []) => {
    const out = [];
    const blocked = new Set(excluded);
    while (out.length < count) {
      const n = Math.floor(Math.random() * 50) + 1;
      if (blocked.has(n) || out.includes(n)) continue;
      out.push(n);
    }
    return out;
  };

  const generateFavoriteMix = async () => {
    if (!favorites.length) {
      setError('Pick at least 1 favorite number first.');
      return;
    }

    setError('');
    setLoadingPick(true);

    try {
      const r = await fetch(`${API}/lottomax/pick`);
      const base = await r.json();

      const favPool = [...favorites].sort(() => Math.random() - 0.5);
      const guaranteedFavorites = favPool.slice(0, Math.min(7, favPool.length));

      const merged = [...guaranteedFavorites];

      for (const n of (base.numbers || [])) {
        if (merged.length >= 7) break;
        if (!merged.includes(n)) merged.push(n);
      }

      if (merged.length < 7) {
        merged.push(...randomUniqueFromRange(7 - merged.length, merged));
      }

      const finalNumbers = merged.slice(0, 7).sort((a, b) => a - b);

      let finalBonus = base.bonus;
      if (!finalBonus || finalNumbers.includes(finalBonus)) {
        finalBonus = randomUniqueFromRange(1, finalNumbers)[0];
      }

      setPick({
        ...base,
        numbers: finalNumbers,
        bonus: finalBonus,
        note: `Favorites mix applied (${guaranteedFavorites.length} guaranteed favorite${guaranteedFavorites.length > 1 ? 's' : ''}). ${base.note || ''}`.trim(),
      });

      setRevealTick((t) => t + 1);
    } catch {
      setError('Could not generate favorite mix.');
    } finally {
      setLoadingPick(false);
    }
  };

  const loadStore = async (force = false) => {
    setError('');
    setLoadingStore(true);
    try {
      const r = await fetch(`${API}/lottomax/recent-winning-store${force ? '?force=1' : ''}`);
      setStore(await r.json());
    } catch {
      setError('Could not fetch recent winning store.');
    } finally {
      setLoadingStore(false);
    }
  };

  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    loadStore(false);
    const timer = setInterval(() => loadStore(false), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFavorite = (n) => {
    setFavorites((curr) => {
      if (curr.includes(n)) return curr.filter((x) => x !== n);
      if (curr.length >= 7) return curr;
      return [...curr, n].sort((a, b) => a - b);
    });
  };

  const quickStoreLine = useMemo(() => {
    if (!store) return '';
    const s = store.storeName || 'Winning retailer unavailable';
    const l = store.location || 'Location unavailable';
    return `${s} • ${l}`;
  }, [store]);

  const displayedFavorites = favorites;

  return (
    <main className="app-shell">
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />
      <div className="bg-orb orb-c" />

      <section className="jackpot-ticker glass" aria-label="jackpot ticker">
        <div className="ticker-track">
          <span>💰 Dream big • Pick smart • Stay lucky • Lotto Max Night • Fortune favors the brave • </span>
          <span>💰 Dream big • Pick smart • Stay lucky • Lotto Max Night • Fortune favors the brave • </span>
        </div>
      </section>

      <section className="hero glass">
        <p className="kicker">🍀 tonight could be your night</p>
        <h1>Lotto Max Lucky Helper</h1>
        <p className="muted">
          Quick picks, quick insights — no clutter. Tap, check, and get back to dreaming big.
        </p>

        <div className="actions">
          <button className="btn btn-primary" onClick={generatePick} disabled={loadingPick}>
            {loadingPick ? 'Generating...' : '🎲 Lucky 7 Quick Pick'}
          </button>
          <button className="btn btn-favorite" onClick={generateFavoriteMix} disabled={loadingPick || !favorites.length}>
            {loadingPick ? 'Generating...' : '⭐ Use My Favorites Mix'}
          </button>
          <button className="btn btn-secondary" onClick={() => loadStore(true)} disabled={loadingStore}>
            {loadingStore ? 'Loading...' : '📍 Refresh Winner Spot'}
          </button>
        </div>
      </section>

      <section className="card glass fav-card">
        <div className="card-header">
          <h3>⭐ Favorite Numbers</h3>
          <span className="chip gold">{favorites.length}/7 pinned</span>
        </div>

        <div className="fav-summary-row">
          <p className="muted fav-summary">Pinned: {displayedFavorites.length ? displayedFavorites.join(', ') : 'None yet'}</p>
          <button className="text-btn" onClick={() => setShowFavoritePanel((v) => !v)}>
            {showFavoritePanel ? 'Hide number picker' : 'Set favorite numbers'}
          </button>
        </div>

        {showFavoritePanel && (
          <>
            <p className="muted fav-help">Tap a number to pin/unpin your lucky set.</p>
            <div className="favorites-grid">
              {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`fav-pill ${favorites.includes(n) ? 'active' : ''}`}
                  onClick={() => toggleFavorite(n)}
                  title={favorites.includes(n) ? 'Remove favorite' : 'Add favorite'}
                >
                  {n}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="grid">
        {pick && (
          <section className="card glass card-pick">
            <div className="card-header">
              <h3>{pick.game} Quick Pick</h3>
              <span className="chip">Try this line</span>
            </div>

            <div className="numbers">
              {pick.numbers.map((n, i) => (
                <div
                  key={`${revealTick}-${n}-${i}`}
                  className="ball reveal"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  {n}
                </div>
              ))}
              <div className="ball bonus reveal" style={{ animationDelay: `${pick.numbers.length * 90}ms` }}>B {pick.bonus}</div>
            </div>

            <p className="muted">{pick.note}</p>
          </section>
        )}

        {store && (
          <section className="card glass card-store">
            <div className="card-header">
              <h3>Recent Winning Ticket Sold</h3>
              <span className="chip gold">Quick reference</span>
            </div>

            <div className="quick-store">
              <p className="quick-title">🏪 {quickStoreLine}</p>
              <p className="quick-sub">Draw: <strong>{store.drawDate || 'N/A'}</strong> · Prize: <strong>{store.prizeValue || 'N/A'}</strong></p>
            </div>

            <div className="actions-inline">
              <button className="text-btn" onClick={() => setShowStoreDetails((v) => !v)}>
                {showStoreDetails ? 'Hide details' : 'Show more details'}
              </button>
            </div>

            {showStoreDetails && (
              <div className="details">
                <p><span>Game</span><strong>{store.game}</strong></p>
                <p><span>Store</span><strong>{store.storeName || 'N/A'}</strong></p>
                <p><span>Location</span><strong>{store.location || 'N/A'}</strong></p>
                <p className="muted">
                  Source:{' '}
                  <a href={store.source} target="_blank" rel="noreferrer">
                    {store.sourceLabel || store.source}
                  </a>
                </p>
                <p className="muted">
                  Last server refresh:{' '}
                  {store.cacheUpdatedAt ? new Date(store.cacheUpdatedAt).toLocaleString() : 'N/A'}
                  {' '}• TTL: {store.cacheTtlMinutes || '?'} min
                </p>
                {store.fetchError ? <p className="warn">Live fetch note: {store.fetchError}</p> : null}
              </div>
            )}
          </section>
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
