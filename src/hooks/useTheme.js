import { useEffect, useState } from 'react';

const storageKey = 'yujing-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  let stored;
  try { stored = window.localStorage.getItem(storageKey); } catch { /* Storage can be disabled. */ }
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    try { window.localStorage.setItem(storageKey, theme); } catch { /* Theme still works without storage. */ }
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme((value) => (value === 'light' ? 'dark' : 'light')),
  };
}
