import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const siteBase = '/chinese';
const siteOrigin = 'https://fishpka.github.io';
const siteUrl = `${siteOrigin}${siteBase}`;
const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');
const wordsJsonCandidates = [
  path.join(rootDir, 'src/data/words.json'),
  path.join(rootDir, 'public/words.json'),
  path.join(rootDir, 'words.json'),
];
const fallbackSourcePath = path.join(rootDir, 'src/data/Chinese-teaching.txt');

const containsHan = (value) => /\p{Script=Han}/u.test(value);

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function encodeSlug(value) {
  const raw = String(value || '').trim().replace(/^\/+|\/+$/g, '');
  if (!raw) return '';

  const wordSegment = raw.match(/(?:^|\/)word\/([^/]+)/)?.[1] || raw;
  try {
    return encodeURIComponent(decodeURIComponent(wordSegment));
  } catch {
    return encodeURIComponent(wordSegment);
  }
}

function collectWords(value, words = []) {
  if (!value) return words;

  if (typeof value === 'string') {
    words.push(value);
    return words;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectWords(item, words));
    return words;
  }

  if (typeof value !== 'object') return words;

  const directValue = value.slug || value.term || value.word || value.title || value.name || value.id;
  if (directValue) words.push(directValue);

  for (const key of ['words', 'items', 'entries', 'data']) {
    if (value[key]) collectWords(value[key], words);
  }

  return words;
}

function cleanLines(block) {
  return block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !/^https?:\/\//i.test(line));
}

function findTerm(lines) {
  for (const line of lines) {
    const heading = line.match(/^[《「]?([\p{Script=Han}]{1,12})[》」]?(?=\s|[A-Za-z（(“"])/u);
    if (heading) return heading[1];
  }

  for (const line of lines.filter(containsHan)) {
    const definition = line.match(/^[《「]?([\p{Script=Han}]{1,10})[》」]?(?=形容|指|是|原|意指|（|\(|「|，|为)/u);
    if (definition) return definition[1];
  }

  const fallback = lines.find(containsHan)?.match(/[\p{Script=Han}]{1,12}/u);
  return fallback?.[0] || '';
}

async function loadWords() {
  const wordsJsonPath = wordsJsonCandidates.find((candidate) => existsSync(candidate));

  if (wordsJsonPath) {
    const source = JSON.parse(await readFile(wordsJsonPath, 'utf8'));
    return {
      source: path.relative(rootDir, wordsJsonPath),
      words: collectWords(source),
    };
  }

  const sourceText = await readFile(fallbackSourcePath, 'utf8');
  const seenTerms = new Set();
  const words = sourceText
    .split(/\r?\n\s*_{8,}\s*\r?\n/g)
    .map((block) => findTerm(cleanLines(block)))
    .filter((term) => {
      if (!term || seenTerms.has(term)) return false;
      seenTerms.add(term);
      return true;
    });

  return {
    source: path.relative(rootDir, fallbackSourcePath),
    words,
  };
}

function buildSitemap(words) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = [
    `${siteUrl}/`,
    ...[...new Set(words.map(encodeSlug).filter(Boolean))]
      .map((slug) => `${siteUrl}/word/${slug}/`),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url, index) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${index === 0 ? 'weekly' : 'monthly'}</changefreq>\n    <priority>${index === 0 ? '1.0' : '0.7'}</priority>\n  </url>`).join('\n')}\n</urlset>\n`;
}

const { source, words } = await loadWords();

await mkdir(publicDir, { recursive: true });
await writeFile(sitemapPath, buildSitemap(words));

console.log(`Generated public/sitemap.xml from ${source} with ${words.length} word entries`);
