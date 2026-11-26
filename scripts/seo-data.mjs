import { readFile, stat } from 'node:fs/promises';
import { parseTeachingSource } from '../src/data/teachingParser.js';
import { wordPath, emotionPath } from '../src/lib/routes.js';
export const siteOrigin = 'https://fishpka.github.io';
export const siteUrl = `${siteOrigin}/chinese/`;
export async function loadSeoData() {
  const file = new URL('../src/data/Chinese-teaching.txt', import.meta.url);
  const [source, info] = await Promise.all([readFile(file, 'utf8'), stat(file)]);
  const seen = new Set();
  const entries = parseTeachingSource(source).filter((entry) => {
    if (seen.has(entry.term)) return false;
    seen.add(entry.term);
    return true;
  });
  const emotions = [...new Set(entries.flatMap((entry) => [entry.category, ...entry.editable.emotions]))];
  return { entries, emotions, lastmod: info.mtime.toISOString().slice(0, 10) };
}
export function wordUrl(term) { return siteOrigin + wordPath(term); }
export function emotionUrl(emotion) { return siteOrigin + emotionPath(emotion); }
export function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
