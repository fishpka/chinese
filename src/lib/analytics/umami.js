const DEFAULT_SCRIPT_SRC = import.meta.env.VITE_UMAMI_SCRIPT_SRC?.trim();
const DEFAULT_WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim();
const DEFAULT_HOST_URL = import.meta.env.VITE_UMAMI_HOST_URL?.trim();
const ENABLED = import.meta.env.PROD && Boolean(DEFAULT_SCRIPT_SRC && DEFAULT_WEBSITE_ID);

const SCRIPT_ID = 'umami-tracker';

let scriptPromise = null;
let pageTrackingStarted = false;
let lastTrackedUrl = '';

function getCurrentUrl() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function buildScript() {
  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.defer = true;
  script.src = DEFAULT_SCRIPT_SRC;
  script.setAttribute('data-website-id', DEFAULT_WEBSITE_ID);
  script.setAttribute('data-auto-track', 'false');

  if (DEFAULT_HOST_URL) {
    script.setAttribute('data-host-url', DEFAULT_HOST_URL);
  }

  return script;
}

export function isUmamiEnabled() {
  return ENABLED;
}

export function loadUmami() {
  if (!ENABLED || typeof document === 'undefined') {
    return Promise.resolve(false);
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  const existingScript = document.getElementById(SCRIPT_ID);
  if (existingScript) {
    scriptPromise = Promise.resolve(true);
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const script = buildScript();

    script.addEventListener('load', () => resolve(true), { once: true });
    script.addEventListener('error', () => reject(new Error('Unable to load Umami analytics script')), { once: true });

    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function trackPageView({ url = getCurrentUrl(), title = document.title } = {}) {
  if (!ENABLED) return Promise.resolve(false);

  return loadUmami().then(() => {
    if (typeof window.umami?.track !== 'function') return false;

    window.umami.track({ url, title });
    return true;
  });
}

export function startPageTracking() {
  if (!ENABLED || pageTrackingStarted || typeof window === 'undefined') {
    return () => {};
  }

  pageTrackingStarted = true;
  lastTrackedUrl = '';

  const emitPageView = () => {
    const currentUrl = getCurrentUrl();
    if (currentUrl === lastTrackedUrl) return;

    lastTrackedUrl = currentUrl;
    void trackPageView({ url: currentUrl });
  };

  const patchHistoryMethod = (methodName) => {
    const original = history[methodName];
    history[methodName] = function patchedHistoryMethod(...args) {
      const result = original.apply(this, args);
      window.dispatchEvent(new Event('umami:navigation'));
      return result;
    };

    return () => {
      history[methodName] = original;
    };
  };

  const restorePushState = patchHistoryMethod('pushState');
  const restoreReplaceState = patchHistoryMethod('replaceState');

  const handleNavigation = () => emitPageView();
  window.addEventListener('popstate', handleNavigation);
  window.addEventListener('umami:navigation', handleNavigation);

  emitPageView();

  return () => {
    window.removeEventListener('popstate', handleNavigation);
    window.removeEventListener('umami:navigation', handleNavigation);
    restorePushState();
    restoreReplaceState();
    pageTrackingStarted = false;
    lastTrackedUrl = '';
  };
}

export function trackEvent(name, data = {}) {
  if (!ENABLED) return Promise.resolve(false);

  return loadUmami().then(() => {
    if (typeof window.umami?.track !== 'function') return false;

    window.umami.track(name, data);
    return true;
  });
}
