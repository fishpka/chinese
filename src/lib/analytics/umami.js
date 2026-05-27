const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim() || '955da1bd-cc90-4cee-88ee-1ac182d6cb42';

function getUmami() {
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
