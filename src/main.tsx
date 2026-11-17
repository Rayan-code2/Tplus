import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Register SportX PWA Service Worker
try {
  registerSW({ immediate: true });
} catch {
  // Ignore SW registration errors in unsupported contexts
}

// Cross-subdomain SSO bootstrap: extract ?uid= and ?api= params if redirected from another subdomain
try {
  const params = new URLSearchParams(window.location.search);
  const ssoUid = params.get('uid') || params.get('sso_uid');
  const ssoApi = params.get('api');
  let urlChanged = false;

  if (ssoUid && ssoUid.trim()) {
    localStorage.setItem('tp_user_id', ssoUid.trim());
    localStorage.removeItem('tp_logged_out');
    params.delete('uid');
    params.delete('sso_uid');
    urlChanged = true;
  }
  if (ssoApi && ssoApi.trim()) {
    localStorage.setItem('tp_api_base_url', ssoApi.trim().replace(/\/+$/, ''));
    params.delete('api');
    urlChanged = true;
  }
  if (urlChanged) {
    const remainingQuery = params.toString();
    const cleanUrl = `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ''}${window.location.hash || ''}`;
    window.history.replaceState({}, '', cleanUrl);
  }
} catch {
  // Ignore URL parsing errors in constrained environments
}

// Global fetch interceptor to isolate sessions & support cross-subdomain Main Wallet sync
const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  let finalInput: RequestInfo | URL = input;
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

  if (url.startsWith('/api') || url.includes('/api/')) {
    const apiBase =
      ((import.meta as any).env?.VITE_API_BASE_URL || localStorage.getItem('tp_api_base_url') || '')
        .trim()
        .replace(/\/+$/, '');

    if (apiBase && url.startsWith('/api') && !url.startsWith(apiBase)) {
      finalInput = `${apiBase}${url}`;
    }

    const userId = localStorage.getItem('tp_user_id') || '';
    const isLoggedOut = localStorage.getItem('tp_logged_out') === 'true' || !userId;
    init = { ...(init || {}), credentials: 'include' };
    const headers = new Headers(init.headers || {});
    if (!headers.has('x-user-id')) {
      headers.set('x-user-id', userId || 'NONE');
    }
    if (isLoggedOut && !url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
      headers.set('x-logged-out', 'true');
    }
    init.headers = headers;
  }
  return originalFetch.call(this, finalInput, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);


