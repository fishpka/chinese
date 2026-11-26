import { renderToString } from 'react-dom/server';
import App from './App.jsx';

export function renderArchive(entries, pathname) {
  return renderToString(<App initialDatabase={{ source: 'Chinese-teaching.txt', total: entries.length, entries }} initialPathname={pathname} initialLocale="zh" />);
}
