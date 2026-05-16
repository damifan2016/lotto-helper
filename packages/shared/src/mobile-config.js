export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://lotto-lucky888.vercel.app/api';

export const GAME_OPTIONS = {
  lottomax: {
    key: 'lottomax',
    label: 'Lotto Max',
    mainCount: 7,
    maxNumber: 50,
    pickPath: '/lottomax/pick',
    storePath: '/lottomax/recent-winning-store'
  },
  lotto649: {
    key: 'lotto649',
    label: 'Lotto 6/49',
    mainCount: 6,
    maxNumber: 49,
    pickPath: '/lotto649/pick',
    storePath: '/lotto649/recent-winning-store'
  }
};

export function getDefaultGameKey() {
  return 'lottomax';
}

export function buildApiUrl(baseUrl, path) {
  return `${String(baseUrl).replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}`;
}
