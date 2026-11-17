import { GameSubdomainUrls, SystemSettings, User } from '../types';

export type GameRouteKey = keyof GameSubdomainUrls;

export interface GameSubdomainMeta {
  tab: GameRouteKey;
  prefix: string;
  label: string;
  icon: string;
  badge: string;
}

export const GAME_SUBDOMAIN_LIST: GameSubdomainMeta[] = [
  { tab: 'aviator', prefix: 'aviator', label: 'Aviator Crash', icon: '✈️', badge: '100X' },
  { tab: 'colorprediction', prefix: 'wingo', label: 'Color Win Go', icon: '🎱', badge: '9X WIN' },
  { tab: 'cricket', prefix: 'cricket', label: 'Cricket Fantasy 11', icon: '🏏', badge: 'DREAM 11' },
  { tab: 'dragontiger', prefix: 'dragontiger', label: 'Dragon vs Tiger', icon: '🐉', badge: '2X / 8X' },
  { tab: 'luckydraw', prefix: 'luckydraw', label: 'Lucky Draw', icon: '🎟️', badge: 'JACKPOT' },
  { tab: 'chickenroad', prefix: 'chickenroad', label: 'Chicken Road', icon: '🐔', badge: '55X' },
  { tab: 'rummy', prefix: 'rummy', label: 'Indian Rummy', icon: '🃏', badge: '13-CARD' },
  { tab: 'slot777', prefix: 'slots', label: '777 Vegas Slots', icon: '🎰', badge: '50X' },
  { tab: 'spinwheel', prefix: 'spin', label: 'Spin & Win Wheel', icon: '🎡', badge: 'LUCKY' },
];

export const GAME_TAB_TO_PREFIX: Record<string, string> = {
  aviator: 'aviator',
  colorprediction: 'wingo',
  cricket: 'cricket',
  dragontiger: 'dragontiger',
  luckydraw: 'luckydraw',
  chickenroad: 'chickenroad',
  rummy: 'rummy',
  slot777: 'slots',
  spinwheel: 'spin',
  payment_gateway: 'pay',
};

const ALIAS_TO_TAB: Record<string, string> = {
  aviator: 'aviator',
  wingo: 'colorprediction',
  colorprediction: 'colorprediction',
  color: 'colorprediction',
  cricket: 'cricket',
  fantasy: 'cricket',
  sports: 'cricket',
  dragontiger: 'dragontiger',
  dragon: 'dragontiger',
  casino: 'dragontiger',
  luckydraw: 'luckydraw',
  lottery: 'luckydraw',
  chickenroad: 'chickenroad',
  chicken: 'chickenroad',
  rummy: 'rummy',
  pvc: 'rummy',
  slots: 'slot777',
  slot777: 'slot777',
  spin: 'spinwheel',
  spinwheel: 'spinwheel',
  wheel: 'spinwheel',
  rewards: 'spinwheel',
  pay: 'payment_gateway',
  gateway: 'payment_gateway',
  finance: 'finance',
  wallet: 'finance',
  vip: 'vip',
  privileges: 'vip',
  agency: 'agency',
};

export const ALL_KNOWN_SUBDOMAIN_PREFIXES = new Set([
  'admin',
  'aviator',
  'wingo',
  'colorprediction',
  'color',
  'cricket',
  'fantasy',
  'sports',
  'dragontiger',
  'dragon',
  'casino',
  'luckydraw',
  'lottery',
  'chickenroad',
  'chicken',
  'rummy',
  'pvc',
  'slots',
  'slot777',
  'spin',
  'spinwheel',
  'wheel',
  'pay',
  'gateway',
  'www',
  'app',
  'lobby',
]);

/**
 * Default game visibility map (all 9 games ON by default)
 */
export const DEFAULT_ENABLED_GAMES: Record<GameRouteKey, boolean> = {
  aviator: true,
  colorprediction: true,
  cricket: true,
  dragontiger: true,
  luckydraw: true,
  chickenroad: true,
  rummy: true,
  slot777: true,
  spinwheel: true,
};

export const GAME_ROUTE_KEY_SET = new Set<string>(Object.keys(DEFAULT_ENABLED_GAMES));

export function isGameRouteTab(tab: string): boolean {
  return GAME_ROUTE_KEY_SET.has(tab);
}

export function isGameEnabled(
  gameKey: string,
  settings?: SystemSettings | null
): boolean {
  if (!GAME_ROUTE_KEY_SET.has(gameKey)) return true;
  const map = settings?.enabledGames;
  if (!map) return true;
  return map[gameKey as GameRouteKey] !== false;
}

/**
 * Unified Main Wallet Balance in ₹ INR across all subdomains and games.
 * Matches backend deductBetBalance() priority order:
 * depositBalance + winningBalance + balance
 */
export function getMainWalletUsdt(user?: Partial<User> | null): number {
  if (!user) return 0;
  return (
    (Number(user.depositBalance) || 0) +
    (Number(user.winningBalance) || 0) +
    (Number(user.balance) || 0)
  );
}

export function isPreviewOrLocalHost(hostname: string): boolean {
  const h = (hostname || '').toLowerCase().trim();
  if (!h) return true;
  if (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '::1' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(h) ||
    h.endsWith('.run.app') ||
    h.endsWith('.web.app') ||
    h.endsWith('.firebaseapp.com') ||
    h.endsWith('.aistudio.google.com') ||
    h.endsWith('.usercontent.goog')
  ) {
    return true;
  }
  return false;
}

export function extractRootDomain(hostname: string): string {
  const clean = (hostname || '').toLowerCase().trim().split(':')[0];
  if (!clean || isPreviewOrLocalHost(clean)) return clean;
  const parts = clean.split('.');
  if (parts.length >= 3 && ALL_KNOWN_SUBDOMAIN_PREFIXES.has(parts[0])) {
    return parts.slice(1).join('.');
  }
  return clean;
}

export interface DetectedLocationRoute {
  activeTab: string;
  isGatewaySubdomain: boolean;
  isGameSubdomain: boolean;
  isAdminSubdomain: boolean;
  subdomainPrefix: string | null;
}

export function detectRouteFromLocation(): DetectedLocationRoute {
  if (typeof window === 'undefined') {
    return {
      activeTab: 'dashboard',
      isGatewaySubdomain: false,
      isGameSubdomain: false,
      isAdminSubdomain: false,
      subdomainPrefix: null,
    };
  }

  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  const firstLabel = hostname.split('.')[0];

  // 0. Dedicated Admin Subdomain (e.g., admin.sportx.tech) or explicit preview ?portal=admin
  if (!isPreviewOrLocalHost(hostname) && firstLabel === 'admin') {
    return {
      activeTab: 'admin',
      isGatewaySubdomain: false,
      isGameSubdomain: false,
      isAdminSubdomain: true,
      subdomainPrefix: 'admin',
    };
  }

  if (
    isPreviewOrLocalHost(hostname) &&
    (searchParams.get('portal') === 'admin' || pathname.replace(/^\/+|\/+$/g, '') === 'admin-portal')
  ) {
    return {
      activeTab: 'admin',
      isGatewaySubdomain: false,
      isGameSubdomain: false,
      isAdminSubdomain: true,
      subdomainPrefix: 'admin',
    };
  }

  // 1. Check host subdomain prefix (e.g., aviator.sportx.tech, wingo.sportx.tech, pay.sportx.tech)
  if (!isPreviewOrLocalHost(hostname) && firstLabel && ALIAS_TO_TAB[firstLabel]) {
    const mappedTab = ALIAS_TO_TAB[firstLabel];
    return {
      activeTab: mappedTab,
      isGatewaySubdomain: mappedTab === 'payment_gateway',
      isGameSubdomain: mappedTab !== 'payment_gateway' && Boolean(GAME_TAB_TO_PREFIX[mappedTab]),
      isAdminSubdomain: false,
      subdomainPrefix: firstLabel,
    };
  }

  // 2. Check query parameter (?game=aviator or ?view=gateway)
  const qTarget = (searchParams.get('game') || searchParams.get('view') || '').toLowerCase().trim();
  if (qTarget && ALIAS_TO_TAB[qTarget]) {
    const mappedTab = ALIAS_TO_TAB[qTarget];
    return {
      activeTab: mappedTab,
      isGatewaySubdomain: mappedTab === 'payment_gateway',
      isGameSubdomain: false,
      isAdminSubdomain: false,
      subdomainPrefix: GAME_TAB_TO_PREFIX[mappedTab] || null,
    };
  }

  // 3. Check URL pathname (/aviator, /game/aviator, /wingo, /pay, /gateway, etc.)
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  if (cleanPath) {
    const segments = cleanPath.split('/').filter(Boolean);
    const candidate = segments[0] === 'game' && segments[1] ? segments[1] : segments[0];
    if (candidate && ALIAS_TO_TAB[candidate]) {
      const mappedTab = ALIAS_TO_TAB[candidate];
      return {
        activeTab: mappedTab,
        isGatewaySubdomain: mappedTab === 'payment_gateway',
        isGameSubdomain: false,
        isAdminSubdomain: false,
        subdomainPrefix: GAME_TAB_TO_PREFIX[mappedTab] || null,
      };
    }
  }

  return {
    activeTab: 'dashboard',
    isGatewaySubdomain: false,
    isGameSubdomain: false,
    isAdminSubdomain: false,
    subdomainPrefix: null,
  };
}

function normalizeHttpUrl(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const proto = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  return `${proto}//${trimmed}`;
}

export function attachSsoParams(
  baseUrl: string,
  user?: User | null,
  settings?: SystemSettings | null
): string {
  try {
    const parsed = new URL(baseUrl);
    const uid = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('tp_user_id') : '') || '';
    if (uid) {
      parsed.searchParams.set('uid', uid);
    }
    const apiBase =
      settings?.gameSubdomains?.apiBaseUrl?.trim() ||
      (typeof window !== 'undefined' ? localStorage.getItem('tp_api_base_url') : '') ||
      '';
    if (apiBase) {
      parsed.searchParams.set('api', apiBase);
    }
    return parsed.toString();
  } catch {
    return baseUrl;
  }
}

export function resolveSubdomainUrlForTab(
  tab: string,
  settings: SystemSettings | null,
  user?: User | null
): string | null {
  if (typeof window === 'undefined') return null;
  if (isPreviewOrLocalHost(window.location.hostname)) return null;

  const prefix = GAME_TAB_TO_PREFIX[tab];
  if (!prefix) return null;

  const subCfg = settings?.gameSubdomains;
  if (subCfg && subCfg.enabled === false) {
    return null;
  }

  // 1. Explicit per-game or gateway URL configured in Admin Settings
  let rawTarget = '';
  if (tab === 'payment_gateway') {
    rawTarget = settings?.paymentGateway?.subdomainUrl || '';
  } else {
    rawTarget = subCfg?.urls?.[tab as GameRouteKey] || '';
  }

  // 2. Fallback to rootDomain auto-subdomain mapping
  if (!rawTarget.trim()) {
    const configuredRoot = (subCfg?.rootDomain || '').trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    const hostRoot =
      !isPreviewOrLocalHost(window.location.hostname) &&
      subCfg?.autoSubdomainOnCustomDomain !== false
        ? extractRootDomain(window.location.hostname)
        : '';

    const effectiveRoot = configuredRoot || hostRoot;
    if (effectiveRoot && !isPreviewOrLocalHost(effectiveRoot)) {
      const portPart = window.location.port ? `:${window.location.port}` : '';
      rawTarget = `${window.location.protocol}//${prefix}.${effectiveRoot}${portPart}`;
    }
  }

  const normalized = normalizeHttpUrl(rawTarget);
  if (!normalized) return null;

  try {
    const targetUrlObj = new URL(normalized);
    // Avoid redirecting if already on this exact subdomain hostname
    if (targetUrlObj.hostname.toLowerCase() === window.location.hostname.toLowerCase()) {
      return null;
    }
    return attachSsoParams(targetUrlObj.toString(), user, settings);
  } catch {
    return null;
  }
}

export function resolveMainLobbyUrl(
  settings: SystemSettings | null,
  user?: User | null
): string | null {
  if (typeof window === 'undefined') return null;
  if (isPreviewOrLocalHost(window.location.hostname)) return null;

  const explicitLobby = normalizeHttpUrl(settings?.gameSubdomains?.mainAppUrl || '');
  if (explicitLobby) {
    try {
      const lobbyUrl = new URL(explicitLobby);
      if (lobbyUrl.hostname.toLowerCase() !== window.location.hostname.toLowerCase()) {
        return attachSsoParams(lobbyUrl.toString(), user, settings);
      }
      return null;
    } catch {
      // ignore invalid URL
    }
  }

  const configuredRoot = (settings?.gameSubdomains?.rootDomain || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '');
  const detectedRoot = extractRootDomain(window.location.hostname);
  const rootDom = configuredRoot || detectedRoot;

  if (rootDom && !isPreviewOrLocalHost(rootDom) && rootDom.toLowerCase() !== window.location.hostname.toLowerCase()) {
    const portPart = window.location.port ? `:${window.location.port}` : '';
    return attachSsoParams(`${window.location.protocol}//${rootDom}${portPart}/`, user, settings);
  }

  return null;
}

export function navigateToAppTab(
  targetTab: string,
  settings: SystemSettings | null,
  currentUser: User | null,
  setActiveTab: (tab: string) => void,
  setIsAdminView: (isAdmin: boolean) => void
) {
  const routeInfo = detectRouteFromLocation();

  // Navigating to a specific game or payment gateway -> redirect to its subdomain if configured
  if (GAME_TAB_TO_PREFIX[targetTab]) {
    const externalSubdomainUrl = resolveSubdomainUrlForTab(targetTab, settings, currentUser);
    if (externalSubdomainUrl) {
      window.location.href = externalSubdomainUrl;
      return;
    }
    if (typeof window !== 'undefined') {
      const nextPath = `/${GAME_TAB_TO_PREFIX[targetTab]}`;
      if (window.location.pathname !== nextPath) {
        window.history.pushState({ tab: targetTab }, '', nextPath);
      }
    }
    setActiveTab(targetTab);
    setIsAdminView(false);
    return;
  }

  // Navigating back to Front Page / Lobby
  if (targetTab === 'dashboard' || targetTab === 'home') {
    if (routeInfo.isGameSubdomain || routeInfo.isGatewaySubdomain) {
      const lobbyUrl = resolveMainLobbyUrl(settings, currentUser);
      if (lobbyUrl) {
        window.location.href = lobbyUrl;
        return;
      }
    }
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.pushState({ tab: 'dashboard' }, '', '/');
    }
    setActiveTab('dashboard');
    setIsAdminView(false);
    return;
  }

  // Prevent accessing admin view from user domains
  if (targetTab === 'admin' && !routeInfo.isAdminSubdomain) {
    setActiveTab('dashboard');
    setIsAdminView(false);
    return;
  }

  // Other shared shell routes (finance, agency, store)
  if (typeof window !== 'undefined') {
    const pathMap: Record<string, string> = {
      finance: '/finance',
      agency: '/agency',
      store: '/store',
    };
    const nextPath = pathMap[targetTab];
    if (nextPath && window.location.pathname !== nextPath) {
      window.history.pushState({ tab: targetTab }, '', nextPath);
    }
  }

  setActiveTab(targetTab);
  setIsAdminView(routeInfo.isAdminSubdomain && targetTab === 'admin');
}
