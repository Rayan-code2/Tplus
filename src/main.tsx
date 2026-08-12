import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Global fetch interceptor to isolate sessions per browser/device
const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith('/api') || url.includes('/api/')) {
    const userId = localStorage.getItem('tp_user_id') || '';
    init = init || {};
    const headers = new Headers(init.headers || {});
    if (!headers.has('x-user-id')) {
      headers.set('x-user-id', userId);
    }
    init.headers = headers;
  }
  return originalFetch.call(this, input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);


