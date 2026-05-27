import { useEffect } from 'react';
import { loadUmami, startPageTracking } from '../lib/analytics/umami.js';

export default function useUmamiAnalytics() {
  useEffect(() => {
    if (!import.meta.env.PROD) return undefined;

    let cancelled = false;
    let stopTracking = () => {};

    void loadUmami()
      .then(() => {
        if (!cancelled) {
          stopTracking = startPageTracking();
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      stopTracking();
    };
  }, []);
}
