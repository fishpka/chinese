const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim() || '955da1bd-cc90-4cee-88ee-1ac182d6cb42';
const SCRIPT_SRC = import.meta.env.VITE_UMAMI_SCRIPT_SRC?.trim() || 'https://cloud.umami.is/script.js';
const HOST_URL = import.meta.env.VITE_UMAMI_HOST_URL?.trim() || '';
let scriptLoadStarted = false;

export function ensureUmamiScript() {
  if (typeof document === 'undefined' || !WEBSITE_ID || !SCRIPT_SRC) return false;
  if (scriptLoadStarted || document.querySelector('script[data-website-id][data-umami-managed="true"]')) return true;

  const script = document.createElement('script');
  script.defer = true;
  script.async = true;
  script.src = SCRIPT_SRC;
  script.dataset.websiteId = WEBSITE_ID;
  script.dataset.umamiManaged = 'true';
  if (HOST_URL) script.dataset.hostUrl = HOST_URL;

  document.head.appendChild(script);
  scriptLoadStarted = true;
  return true;
}

function getUmami() {
  ensureUmamiScript();
  return typeof window !== 'undefined' ? window.umami : undefined;
}

export function isUmamiReady() {
  return typeof getUmami()?.track === 'function';
}

export function trackPageView({ url = `${window.location.pathname}${window.location.search}${window.location.hash}`, title = document.title } = {}) {
  const tracker = getUmami();
  if (typeof tracker?.track !== 'function') return false;

  tracker.track({ website: WEBSITE_ID, url, title });
  return true;
}

export function trackEvent(name, data = {}) {
  const tracker = getUmami();
  if (typeof tracker?.track !== 'function') return false;

  tracker.track(name, data);
  return true;
}
