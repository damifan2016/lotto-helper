import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import './styles.css';
import {
  buildCopyText,
  buildFavoriteMix,
  buildStoreSummary,
  getRefreshLabel
} from './app-utils.js';

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
    pickPath: '/lottomax/pick',
    storePath: '/lottomax/recent-winning-store',
    supportsStore: true,
    heroTitle: 'Lotto Lucky Helper',
    quickPickLabel: '🎲 Lotto Max Quick Pick'
  },
  lotto649: {
    key: 'lotto649',
    label: 'Lotto 6/49',
    mainCount: 6,
    maxNumber: 49,
    pickPath: '/lotto649/pick',
    storePath: '/lotto649/recent-winning-store',
    supportsStore: true,
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
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    if (!copied) return undefined;

    const timer = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(timer);
  }, [copied]);

  const fetchPick = async () => {
    const response = await fetch(`${API}${game.pickPath}`);
    if (!response.ok) throw new Error('pick-request-failed');
    return response.json();
  };

  const generatePick = async () => {
    setError('');
    setCopied(false);
    setLoadingPick(true);
    try {
      const data = await fetchPick();
      setPick(data);
      setRevealTick((tick) => tick + 1);
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
    setCopied(false);
    setLoadingPick(true);

    try {
      const base = await fetchPick();
      const finalNumbers = buildFavoriteMix({
        baseNumbers: base.numbers || [],
        favorites,
        mainCount: game.mainCount,
        maxNumber: game.maxNumber
      });

      setPick({
        ...base,
        numbers: finalNumbers,
        bonus: null,
        note: `Favorites mix applied (${Math.min(favorites.length, game.mainCount)} guaranteed favorite${favorites.length === 1 ? '' : 's'}). ${base.note || ''}`.trim()
      });
      setRevealTick((tick) => tick + 1);
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
      const response = await fetch(
        `${API}${game.storePath}${force ? '?force=1' : ''}`
      );
      if (!response.ok) throw new Error('store-request-failed');
      setStore(await response.json());
    } catch {
      setError(`Could not fetch recent ${game.label} winning store.`);
    } finally {
      setLoadingStore(false);
    }
  };

  useEffect(() => {
    setPick(null);
    setStore(null);
    setError('');
    setCopied(false);
    setShowStoreDetails(false);

    if (game.supportsStore) {
      loadStore(false);
      const timer = setInterval(() => loadStore(false), 5 * 60 * 1000);
      return () => clearInterval(timer);
    }

    return undefined;
  }, [gameKey]);

  const toggleFavorite = (n) => {
    setFavorites((current) => {
      if (current.includes(n)) return current.filter((value) => value !== n);
      if (current.length >= game.mainCount) return current;
      return [...current, n].sort((a, b) => a - b);
    });
  };

  const clearFavorites = () => {
    setFavorites([]);
    setError('');
  };

  const copyPick = async () => {
    const text = buildCopyText(pick);
    if (!text) return;

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error('clipboard-unavailable');
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError('');
    } catch {
      setError('Could not copy this quick pick from your browser.');
      setCopied(false);
    }
  };

  const storeSummary = useMemo(() => buildStoreSummary(store), [store]);
  const refreshLabel = useMemo(() => getRefreshLabel(store), [store]);
  const pinnedSummary = favorites.length ? favorites.join(', ') : 'None yet';
  const canClearFavorites = favorites.length > 0;

  return (
    <main className="app-shell">
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />
      <div className="bg-orb orb-c" />

      <section className="jackpot-ticker glass" aria-label="jackpot ticker">
        <div className="ticker-track">
          <span>
            💰 Dream big • Pick smart • Stay lucky • Lotto night • Fortune
            favors the brave •{' '}
          </span>
          <span>
            💰 Dream big • Pick smart • Stay lucky • Lotto night • Fortune
            favors the brave •{' '}
          </span>
        </div>
      </section>

      <section className="hero glass">
        <p className="kicker">🍀 tonight could be your night</p>
        <h1>{game.heroTitle}</h1>
        <p className="muted hero-copy">
          Switch between Lotto Max and Lotto 6/49, generate a quick line, and
          keep a reusable set of favorite numbers for each game.
        </p>

        <div className="status-row" aria-label="current status">
          <div className="status-pill">Game: {game.label}</div>
          <div className="status-pill">
            Pinned favorites: {favorites.length}/{game.mainCount}
          </div>
          <div className="status-pill status-pill-wide">
            {loadingStore ? 'Refreshing winning store…' : refreshLabel}
          </div>
        </div>

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

        <p className="muted rules-copy">
          <strong>{game.label}</strong>: pick {game.mainCount} main number
          {game.mainCount > 1 ? 's' : ''} from 1 to {game.maxNumber}.
        </p>

        <div className="actions">
          <button
            className="btn btn-primary"
            onClick={generatePick}
            disabled={loadingPick}
          >
            {loadingPick ? 'Generating…' : game.quickPickLabel}
          </button>
          <button
            className="btn btn-favorite"
            onClick={generateFavoriteMix}
            disabled={loadingPick || !favorites.length}
          >
            {loadingPick ? 'Generating…' : '⭐ Use My Favorites Mix'}
          </button>
          {game.supportsStore && (
            <button
              className="btn btn-secondary"
              onClick={() => loadStore(true)}
              disabled={loadingStore}
            >
              {loadingStore ? 'Loading…' : '📍 Refresh Winner Spot'}
            </button>
          )}
        </div>
      </section>

      <section className="card glass fav-card">
        <div className="card-header">
          <h3>⭐ Favorite Numbers</h3>
          <span className="chip gold">
            {favorites.length}/{game.mainCount} pinned
          </span>
        </div>

        <div className="fav-summary-row">
          <p className="muted fav-summary">Pinned: {pinnedSummary}</p>
          <div className="actions-inline actions-inline-wrap">
            <button
              className="text-btn"
              onClick={() => setShowFavoritePanel((value) => !value)}
            >
              {showFavoritePanel
                ? 'Hide number picker'
                : 'Set favorite numbers'}
            </button>
            <button
              className="text-btn"
              onClick={clearFavorites}
              disabled={!canClearFavorites}
            >
              Clear favorites
            </button>
          </div>
        </div>

        {showFavoritePanel && (
          <>
            <p className="muted fav-help">
              Tap a number to pin or unpin your lucky set for {game.label}. You
              can save up to {game.mainCount} numbers.
            </p>
            <div className="favorites-grid">
              {Array.from({ length: game.maxNumber }, (_, i) => i + 1).map(
                (n) => (
                  <button
                    key={`${game.key}-${n}`}
                    className={`fav-pill ${favorites.includes(n) ? 'active' : ''}`}
                    onClick={() => toggleFavorite(n)}
                    title={
                      favorites.includes(n) ? 'Remove favorite' : 'Add favorite'
                    }
                  >
                    {n}
                  </button>
                )
              )}
            </div>
          </>
        )}
      </section>

      <div className="grid">
        {pick && (
          <section className="card glass card-pick">
            <div className="card-header">
              <h3>{pick.game} Quick Pick</h3>
              <span className="chip">
                {pick.rules?.mainCount || game.mainCount} main numbers
              </span>
            </div>

            <p className="muted">
              Your numbers:{' '}
              <strong>{pick.rules?.mainCount || game.mainCount}</strong> main
              picks from 1 to{' '}
              <strong>{pick.rules?.maxNumber || game.maxNumber}</strong>.
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

            <div className="actions-inline actions-inline-wrap">
              <button className="text-btn" onClick={copyPick}>
                {copied ? 'Copied!' : 'Copy quick pick'}
              </button>
            </div>

            <p className="muted">{pick.note}</p>
          </section>
        )}

        {store && game.supportsStore && (
          <section className="card glass card-store">
            <div className="card-header">
              <h3>Recent Winning Ticket Sold</h3>
              <span className="chip gold">{game.label} reference</span>
            </div>

            <div className="quick-store">
              <p className="quick-title">🏪 {storeSummary.title}</p>
              <p className="quick-sub">{storeSummary.meta}</p>
            </div>

            <div className="actions-inline actions-inline-wrap">
              <button
                className="text-btn"
                onClick={() => setShowStoreDetails((value) => !value)}
              >
                {showStoreDetails ? 'Hide details' : 'Show more details'}
              </button>
            </div>

            {showStoreDetails && (
              <div className="details">
                <p>
                  <span>Game</span>
                  <strong>{store.game}</strong>
                </p>
                <p>
                  <span>Store</span>
                  <strong>{store.storeName || 'N/A'}</strong>
                </p>
                <p>
                  <span>Location</span>
                  <strong>{store.location || 'N/A'}</strong>
                </p>
                <p>
                  <span>Refresh status</span>
                  <strong>{refreshLabel}</strong>
                </p>
                <p className="details-stack muted">
                  Source:{' '}
                  <a href={store.source} target="_blank" rel="noreferrer">
                    {store.sourceLabel || store.source}
                  </a>
                </p>
                {store.fetchError ? (
                  <p className="warn">Live fetch note: {store.fetchError}</p>
                ) : null}
              </div>
            )}
          </section>
        )}
      </div>

      {error ? <p className="error">{error}</p> : null}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
