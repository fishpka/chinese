import { readFile } from 'node:fs/promises';
import { parseTeachingSource, parseTeachingRecords } from '../src/data/teachingParser.js';
import { wordPath, emotionPath } from '../src/lib/routes.js';
export const siteOrigin = 'https://fishpka.github.io';
export const siteUrl = `${siteOrigin}/chinese/`;
export const homeTitle = '中文成語與詞語解釋｜Learn Chinese Idioms - 中文語境';
export const homeDescription = '查詢中文成語、詞語意思、原始例句及已有的英文與法文解釋，依文化與情緒分類探索使用情境。Learn Chinese idioms and vocabulary in context.';
export function wordMetadata(entry) {
  const aliases = entry.aliases.length ? `（亦見：${entry.aliases.join('、')}）` : '';
  const excerpt = entry.providedContent.zh.description.replace(/\s+/gu, ' ').slice(0, 85);
  return {
    title: `${entry.term}意思與用法｜Chinese ${entry.category === '成語' ? 'Idiom' : 'Vocabulary'} - 中文語境`,
    description: `「${entry.term}」${aliases}：${excerpt} 查看原始教學解說與已提供的語言對照。`,
  };
}
export async function loadSeoData() {
  const source = await readFile(new URL('../src/data/Chinese-teaching.txt', import.meta.url), 'utf8');
  const records = parseTeachingRecords(source);
  const entries = parseTeachingSource(source);
  const legacyTerms = JSON.parse(await readFile(new URL('./legacy-word-routes.json', import.meta.url), 'utf8'));
  const emotions = [...new Set(entries.flatMap((entry) => [entry.category, ...entry.editable.emotions]))];
  const aliases = entries.flatMap((entry) => entry.aliases.map((term) => ({ term, entry })));
  const excluded = [...new Set(records.filter((entry) => !entry.indexable).map((entry) => entry.legacyTerm))]
    .filter((term) => !entries.some((entry) => entry.term === term || entry.aliases.includes(term)))
    .map((term) => ({ term, reason: records.find((entry) => entry.legacyTerm === term).exclusionReason,
      records: records.filter((entry) => entry.legacyTerm === term) }));
  return { entries, emotions, records, aliases, excluded, legacyTerms };
}
export function wordUrl(term) { return siteOrigin + wordPath(term); }
export function emotionUrl(emotion) { return siteOrigin + emotionPath(emotion); }
export function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
