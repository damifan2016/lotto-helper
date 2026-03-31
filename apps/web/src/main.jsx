import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

const API =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? `${window.location.protocol}//${window.location.hostname}:3002/api`
    : '/api');

const GAME_OPTIONS = {
  lottomax: {
    key: 'lottomax',
    label: 'Lotto Max',
    mainCount: 7,
    maxNumber: 50,
    hasBonus: false,
    bonusLabel: null,
    pickPath: '/lottomax/pick',
    supportsStore: true,
    heroTitle: 'Lotto Lucky Helper',
    quickPickLabel: '🎲 Lotto Max Quick Pick'
  },
  lotto649: {
    key: 'lotto649',
    label: 'Lotto 6/49',
    mainCount: 6,
    maxNumber: 49,
    hasBonus: true,
    bonusLabel: 'Bonus Number',
    pickPath: '/lotto649/pick',
    supportsStore: false,
    heroTitle: 'Lotto Lucky Helper',
    quickPickLabel: '🎲 Lotto 6/49 Quick Pick'
  }
};

const FAV_KEY_PREFIX = 'lotto-favorite-numbers-v2';

function App() {
  const [gameKey, setGameKey] = useState('lottomax');
  const game = GAME_OPTIONS[gameKey] || GAME_OPTIONS.lottomax;
  const favKey = `${FAV_KEY_PREFIX}-${gameKey}`;

  const [pick, setPick] = useState(null);
  const [store, setStore] = useState(null);
  const [loadingPick, setLoadingPick] = useState(false);
  const [loadingStore, setLoadingStore] = useState(false);
  const [showStoreDetails, setShowStoreDetails] = useState(false);
  const [revealTick, setRevealTick] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [showFavoritePanel, setShowFavoritePanel] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(favKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const cleaned = Array.isArray(parsed)
        ? parsed
            .filter((n) => Number.isInteger(n) && n >= 1 && n <= game.maxNumber)
            .slice(0, game.mainCount)
            .sort((a, b) => a - b)
        : [];
      setFavorites(cleaned);
    } catch {
      setFavorites([]);
    }
  }, [favKey, game.maxNumber, game.mainCount]);

  useEffect(() => {
    localStorage.setItem(favKey, JSON.stringify(favorites));
  }, [favKey, favorites]);

  const randomUniqueFromRange = (count, maxNumber, excluded = []) => {
    const out = [];
    const blocked = new Set(excluded);
    while (out.length < count) {
      const n = Math.floor(Math.random() * maxNumber) + 1;
      if (blocked.has(n) || out.includes(n)) continue;
      out.push(n);
    }
    return out;
  };

  const fetchPick = async () => {
    const r = await fetch(`${API}${game.pickPath}`);
    if (!r.ok) throw new Error('pick-request-failed');
    return r.json();
  };

  const generatePick = async () => {
    setError('');
    setLoadingPick(true);
    try {
      const data = await fetchPick();
      setPick(data);
      setRevealTick((t) => t + 1);
    } catch {
      setError(`Could not generate ${game.label} numbers.`);
    } finally {
      setLoadingPick(false);
    }
  };

  const generateFavoriteMix = async () => {
    if (!favorites.length) {
      setError('Pick at least 1 favorite number first.');
      return;
    }

    setError('');
    setLoadingPick(true);

    try {
      const base = await fetchPick();

      const favPool = [...favorites].sort(() => Math.random() - 0.5);
      const guaranteedFavorites = favPool.slice(0, Math.min(game.mainCount, favPool.length));
      const merged = [...guaranteedFavorites];

      for (const n of (base.numbers || [])) {
        if (merged.length >= game.mainCount) break;
        if (!merged.includes(n)) merged.push(n);
      }

      if (merged.length < game.mainCount) {
        merged.push(...randomUniqueFromRange(game.mainCount - merged.length, game.maxNumber, merged));
      }

      const finalNumbers = merged.slice(0, game.mainCount).sort((a, b) => a - b);
      const finalBonus = game.hasBonus
        ? (!base.bonus || finalNumbers.includes(base.bonus)
            ? randomUniqueFromRange(1, game.maxNumber, finalNumbers)[0]
            : base.bonus)
        : null;

      setPick({
        ...base,
        numbers: finalNumbers,
        bonus: finalBonus,
        note: `Favorites mix applied (${guaranteedFavorites.length} guaranteed favorite${guaranteedFavorites.length > 1 ? 's' : ''}). ${base.note || ''}`.trim(),
      });

      setRevealTick((t) => t + 1);
    } catch {
      setError(`Could not generate a ${game.label} favorites mix.`);
    } finally {
      setLoadingPick(false);
    }
  };

  const loadStore = async (force = false) => {
    if (!game.supportsStore) {
      setStore(null);
      return;
    }

    setError('');
    setLoadingStore(true);
    try {
      const r = await fetch(`${API}/lottomax/recent-winning-store${force ? '?force=1' : ''}`);
      if (!r.ok) throw new Error('store-request-failed');
      setStore(await r.json());
    } catch {
      setError('Could not fetch recent winning store.');
    } finally {
      setLoadingStore(false);
    }
  };

  useEffect(() => {
    setPick(null);
    setError('');
    setShowStoreDetails(false);
    if (game.supportsStore) {
      loadStore(false);
      const timer = setInterval(() => loadStore(false), 5 * 60 * 1000);
      return () => clearInterval(timer);
    }
    setStore(null);
    return undefined;
  }, [gameKey]);

  const toggleFavorite = (n) => {
    setFavorites((curr) => {
      if (curr.includes(n)) return curr.filter((x) => x !== n);
      if (curr.length >= game.mainCount) return curr;
      return [...curr, n].sort((a, b) => a - b);
    });
  };

  const quickStoreLine = useMemo(() => {
    if (!store) return '';
    const s = store.storeName || 'Winning retailer unavailable';
    const l = store.location || 'Location unavailable';
    return `${s} • ${l}`;
  }, [store]);

  return (
    <main className="app-shell">
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />
      <div className="bg-orb orb-c" />

      <section className="jackpot-ticker glass" aria-label="jackpot ticker">
        <div className="ticker-track">
          <span>💰 Dream big • Pick smart • Stay lucky • Lotto night • Fortune favors the brave • </span>
          <span>💰 Dream big • Pick smart • Stay lucky • Lotto night • Fortune favors the brave • </span>
        </div>
      </section>

      <section className="hero glass">
        <p className="kicker">🍀 tonight could be your night</p>
        <h1>{game.heroTitle}</h1>
        <p className="muted">
          Switch between Lotto Max and Lotto 6/49, generate a quick line, and follow each game's actual pick format.
        </p>

        <div className="actions">
          <button
            className={`btn ${gameKey === 'lottomax' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setGameKey('lottomax')}
            disabled={loadingPick || loadingStore}
          >
            Lotto Max
          </button>
          <button
            className={`btn ${gameKey === 'lotto649' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setGameKey('lotto649')}
            disabled={loadingPick || loadingStore}
          >
            Lotto 6/49
          </button>
        </div>

        <p className="muted">
          <strong>{game.label}</strong>: pick {game.mainCount} main number{game.mainCount > 1 ? 's' : ''} from 1 to {game.maxNumber}
          {game.hasBonus ? '. A bonus number is shown separately.' : '. No bonus number for this quick pick.'}
        </p>

        <div className="actions">
          <button className="btn btn-primary" onClick={generatePick} disabled={loadingPick}>
            {loadingPick ? 'Generating...' : game.quickPickLabel}
          </button>
          <button className="btn btn-favorite" onClick={generateFavoriteMix} disabled={loadingPick || !favorites.length}>
            {loadingPick ? 'Generating...' : '⭐ Use My Favorites Mix'}
          </button>
          {game.supportsStore && (
            <button className="btn btn-secondary" onClick={() => loadStore(true)} disabled={loadingStore}>
              {loadingStore ? 'Loading...' : '📍 Refresh Winner Spot'}
            </button>
          )}
        </div>
      </section>

      <section className="card glass fav-card">
        <div className="card-header">
          <h3>⭐ Favorite Numbers</h3>
          <span className="chip gold">{favorites.length}/{game.mainCount} pinned</span>
        </div>

        <div className="fav-summary-row">
          <p className="muted fav-summary">Pinned: {favorites.length ? favorites.join(', ') : 'None yet'}</p>
          <button className="text-btn" onClick={() => setShowFavoritePanel((v) => !v)}>
            {showFavoritePanel ? 'Hide number picker' : 'Set favorite numbers'}
          </button>
        </div>

        {showFavoritePanel && (
          <>
            <p className="muted fav-help">
              Tap a number to pin or unpin your lucky set for {game.label}. You can save up to {game.mainCount} numbers.
            </p>
            <div className="favorites-grid">
              {Array.from({ length: game.maxNumber }, (_, i) => i + 1).map((n) => (
                <button
                  key={`${game.key}-${n}`}
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
              <span className="chip">{pick.rules?.mainCount || game.mainCount} main numbers</span>
            </div>

            <p className="muted">
              Your numbers: <strong>{pick.rules?.mainCount || game.mainCount}</strong> main picks from 1 to <strong>{pick.rules?.maxNumber || game.maxNumber}</strong>.
            </p>

            <div className="numbers">
              {pick.numbers.map((n, i) => (
                <div
                  key={`${revealTick}-${pick.gameKey || game.key}-${n}-${i}`}
                  className="ball reveal"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  {n}
                </div>
              ))}
            </div>

            {pick.rules?.hasBonus && pick.bonus != null && (
              <>
                <div className="numbers" style={{ marginTop: '0.9rem' }}>
                  <div className="ball bonus reveal" style={{ animationDelay: `${pick.numbers.length * 90}ms` }}>
                    B {pick.bonus}
                  </div>
                </div>

                <p className="muted">
                  <strong>{pick.rules?.bonusLabel || 'Bonus Number'}:</strong> {pick.bonus}. This is shown separately so it does not look like an extra number in your main line.
                </p>
              </>
            )}

            <p className="muted">{pick.note}</p>
          </section>
        )}

        {store && game.supportsStore && (
          <section className="card glass card-store">
            <div className="card-header">
              <h3>Recent Winning Ticket Sold</h3>
              <span className="chip gold">Lotto Max reference</span>
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
