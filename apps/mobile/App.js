import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import {
  API_BASE_URL,
  buildApiUrl,
  GAME_OPTIONS,
  getDefaultGameKey
} from '@lotto/shared/mobile-config';

const FAVORITES_KEY_PREFIX = 'lotto-mobile-favorites-v1';

function buildFavoriteMix({ baseNumbers, favorites, mainCount }) {
  const merged = [...favorites];

  for (const n of baseNumbers || []) {
    if (merged.length >= mainCount) break;
    if (!merged.includes(n)) merged.push(n);
  }

  return merged.slice(0, mainCount).sort((a, b) => a - b);
}

function getQuickPickLabel(game) {
  return `${getGameDisplayName(game)} Lucky Numbers`;
}

function getGameDisplayName(game) {
  return game.key === 'lotto649' ? 'Lotto 6/49 helper' : 'Lotto Max helper';
}

export default function App() {
  const [gameKey, setGameKey] = useState(getDefaultGameKey());
  const game = GAME_OPTIONS[gameKey] || GAME_OPTIONS.lottomax;
  const favoritesStorageKey = `${FAVORITES_KEY_PREFIX}-${gameKey}`;

  const [pick, setPick] = useState(null);
  const [store, setStore] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [loadingPick, setLoadingPick] = useState(false);
  const [loadingStore, setLoadingStore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadFavorites() {
      try {
        const raw = await AsyncStorage.getItem(favoritesStorageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        const cleaned = Array.isArray(parsed)
          ? parsed
              .filter(
                (n) => Number.isInteger(n) && n >= 1 && n <= game.maxNumber
              )
              .slice(0, game.mainCount)
              .sort((a, b) => a - b)
          : [];
        setFavorites(cleaned);
      } catch {
        setFavorites([]);
      }
    }

    setPick(null);
    setStore(null);
    setError('');
    loadFavorites();
  }, [favoritesStorageKey, game.mainCount, game.maxNumber]);

  useEffect(() => {
    AsyncStorage.setItem(favoritesStorageKey, JSON.stringify(favorites)).catch(
      () => {}
    );
  }, [favorites, favoritesStorageKey]);

  useEffect(() => {
    loadStore(false);
  }, [gameKey]);

  async function fetchJson(path) {
    const response = await fetch(buildApiUrl(API_BASE_URL, path));
    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }
    return response.json();
  }

  async function generateQuickPick() {
    setLoadingPick(true);
    setError('');
    try {
      const data = await fetchJson(game.pickPath);
      setPick(data);
    } catch {
      setError(`Could not generate ${getGameDisplayName(game)} numbers.`);
    } finally {
      setLoadingPick(false);
    }
  }

  async function generateFavoritePick() {
    if (!favorites.length) {
      setError('Pick at least 1 favorite number first.');
      return;
    }

    setLoadingPick(true);
    setError('');
    try {
      const data = await fetchJson(game.pickPath);
      setPick({
        ...data,
        numbers: buildFavoriteMix({
          baseNumbers: data.numbers || [],
          favorites,
          mainCount: game.mainCount
        }),
        note: `Favorites mix applied (${favorites.length} pinned). For entertainment only.`
      });
    } catch {
      setError(`Could not generate ${getGameDisplayName(game)} favorite mix.`);
    } finally {
      setLoadingPick(false);
    }
  }

  async function loadStore(force) {
    setLoadingStore(true);
    setError('');
    try {
      const data = await fetchJson(
        `${game.storePath}${force ? '?force=1' : ''}`
      );
      setStore(data);
    } catch {
      setStore(null);
      setError(`Could not load ${getGameDisplayName(game)} reference location.`);
    } finally {
      setLoadingStore(false);
    }
  }

  function toggleFavorite(number) {
    setFavorites((current) => {
      if (current.includes(number)) {
        return current.filter((value) => value !== number);
      }
      if (current.length >= game.mainCount) {
        return current;
      }
      return [...current, number].sort((a, b) => a - b);
    });
  }

  function clearFavorites() {
    setFavorites([]);
    setError('');
  }

  const storeSummary = useMemo(() => {
    return {
      title: `${store?.storeName || 'Reference location unavailable'} • ${store?.location || 'Location unavailable'}`,
      meta: `Reference date: ${store?.drawDate || 'N/A'} · Public value: ${store?.prizeValue || 'N/A'}`
    };
  }, [store]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.kicker}>Android preview build</Text>
        <Text style={styles.title}>Lotto Lucky Number Helper</Text>
        <Text style={styles.subtitle}>
          Random number sets for entertainment and personal organization.
        </Text>

        <View style={styles.row}>
          {Object.values(GAME_OPTIONS).map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setGameKey(option.key)}
              style={[
                styles.button,
                { flex: 1 },
                gameKey === option.key
                  ? styles.buttonPrimary
                  : styles.buttonSecondary
              ]}
            >
              <Text
                style={styles.buttonText}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {getGameDisplayName(option)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardMeta}>
            I’ll pick {game.mainCount} lucky numbers from 1-{game.maxNumber} for
            you
          </Text>
          <View style={styles.row}>
            <Pressable
              onPress={generateQuickPick}
              style={[styles.button, styles.buttonPrimary]}
            >
              <Text style={styles.buttonText}>
                {loadingPick ? 'Generating...' : getQuickPickLabel(game)}
              </Text>
            </Pressable>
            <Pressable
              onPress={generateFavoritePick}
              style={[
                styles.button,
                favorites.length ? styles.buttonAccent : styles.buttonDisabled
              ]}
            >
              <Text style={styles.buttonText}>Use My Favorites Mix</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Favorite Numbers</Text>
              <Text style={styles.cardMeta}>
                Pinned: {favorites.length ? favorites.join(', ') : 'None yet'}
              </Text>
            </View>
          </View>
          <View style={styles.rowWrap}>
            <Pressable
              onPress={() => setShowFavorites((visible) => !visible)}
              style={[
                styles.smallButton,
                showFavorites ? styles.buttonSecondary : styles.buttonAccent
              ]}
            >
              <Text style={styles.smallButtonText}>
                {showFavorites ? 'Hide number picker' : 'Set favorite numbers'}
              </Text>
            </Pressable>
            <Pressable
              onPress={clearFavorites}
              disabled={!favorites.length}
              style={[
                styles.smallButton,
                favorites.length ? styles.buttonSecondary : styles.buttonDisabled
              ]}
            >
              <Text style={styles.smallButtonText}>Clear favorites</Text>
            </Pressable>
          </View>
          <Text style={styles.cardMeta}>
            Tap a number to pin or unpin your personal set. You can save up to{' '}
            {game.mainCount} numbers.
          </Text>
          {showFavorites ? (
            <View style={styles.numberGrid}>
              {Array.from({ length: game.maxNumber }, (_, i) => i + 1).map(
                (n) => {
                  const active = favorites.includes(n);
                  return (
                    <Pressable
                      key={`${game.key}-${n}`}
                      onPress={() => toggleFavorite(n)}
                      style={[
                        styles.numberPill,
                        active ? styles.numberPillActive : null
                      ]}
                    >
                      <Text
                        style={styles.numberPillText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {n}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          ) : null}
        </View>

        {pick ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {getGameDisplayName(game)} Lucky Numbers
            </Text>
            <View style={styles.rowWrap}>
              {pick.numbers.map((n) => (
                <View key={`${pick.gameKey}-${n}`} style={styles.ball}>
                  <Text
                    style={styles.ballText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {n}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.cardMeta}>{pick.note}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Public Draw Reference</Text>
          {loadingStore ? <ActivityIndicator color="#34d399" /> : null}
          <Text style={styles.storeTitle}>{storeSummary.title}</Text>
          <Text style={styles.cardMeta}>{storeSummary.meta}</Text>
          <Pressable
            onPress={() => loadStore(true)}
            style={[styles.button, styles.buttonSecondary]}
          >
            <Text style={styles.buttonText}>
              {loadingStore ? 'Loading...' : 'Refresh Reference'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.disclaimer}>
          Entertainment only. This app does not sell tickets, process wagers,
          predict outcomes, guarantee results, or represent a lottery operator.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#08111f'
  },
  container: {
    padding: 20,
    gap: 16
  },
  kicker: {
    color: '#34d399',
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 1.2
  },
  title: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '800'
  },
  subtitle: {
    color: '#b6c6d8',
    lineHeight: 20
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap'
  },
  rowWrap: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginVertical: 10
  },
  card: {
    backgroundColor: '#101c2f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243550'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12
  },
  cardHeaderText: {
    flex: 1
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6
  },
  cardMeta: {
    color: '#b6c6d8',
    marginBottom: 12
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 132,
    alignItems: 'center'
  },
  buttonPrimary: {
    backgroundColor: '#0f766e'
  },
  buttonSecondary: {
    backgroundColor: '#1f2d44'
  },
  buttonAccent: {
    backgroundColor: '#b7791f'
  },
  buttonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5
  },
  buttonText: {
    color: '#f8fafc',
    fontWeight: '700',
    textAlign: 'center'
  },
  smallButton: {
    minWidth: 128,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  smallButtonText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center'
  },
  numberGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  numberPill: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#142238',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2e4567'
  },
  numberPillActive: {
    backgroundColor: '#0f766e',
    borderColor: '#34d399'
  },
  numberPillText: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 16
  },
  ball: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center'
  },
  ballText: {
    color: '#06251b',
    fontWeight: '800',
    fontSize: 18
  },
  storeTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    marginBottom: 8
  },
  error: {
    color: '#fecaca',
    fontWeight: '700'
  },
  disclaimer: {
    color: '#8da2bc',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10
  }
});
