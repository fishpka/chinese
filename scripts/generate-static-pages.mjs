import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cleanLines, containsHan, findTerm, getCategory, inferEmotions } from '../src/data/termExtraction.js';

const siteBase = '/chinese';
const siteOrigin = 'https://fishpka.github.io';
const siteUrl = `${siteOrigin}${siteBase}`;
const siteImageUrl = `${siteUrl}/ogimage.jpg`;
const rootDir = process.cwd();
const sourcePath = path.join(rootDir, 'src/data/Chinese-teaching.txt');
const distDir = path.join(rootDir, 'dist');

function slugify(value) {
  return encodeURIComponent(String(value).trim());
}

function routeUrl(routePath) {
  return `${siteUrl}/${routePath.split('/').map(slugify).join('/')}/`;
}

function routeSegment(value) {
  return String(value).trim().replaceAll('/', '／');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function withLocale(url, locale) {
  const localizedUrl = new URL(url);
  localizedUrl.searchParams.set('lang', locale);
  return localizedUrl.toString();
}

function injectMeta(html, { title, description, url }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeUrl = url ? escapeHtml(url) : '';
  const safeZhUrl = url ? escapeHtml(withLocale(url, 'zh-Hant')) : '';
  const safeEnUrl = url ? escapeHtml(withLocale(url, 'en')) : '';
  const safeFrUrl = url ? escapeHtml(withLocale(url, 'fr')) : '';
  const safeImageUrl = escapeHtml(siteImageUrl);

  let nextHtml = html
    .replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${safeDescription}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${safeTitle}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${safeDescription}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${safeTitle}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${safeDescription}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${safeImageUrl}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${safeImageUrl}$2`)
    .replace(/("name": ")[^"]*(")/, `$1${safeTitle}$2`)
    .replace(/("description": ")[^"]*(")/, `$1${safeDescription}$2`)
    .replace(/("image": ")[^"]*(")/, `$1${safeImageUrl}$2`);

  if (safeUrl) {
    nextHtml = nextHtml
      .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${safeUrl}$2`)
      .replace(/(<link rel="alternate" href=")[^"]*(" hreflang="zh-Hant" \/>)/, `$1${safeZhUrl}$2`)
      .replace(/(<link rel="alternate" href=")[^"]*(" hreflang="en" \/>)/, `$1${safeEnUrl}$2`)
      .replace(/(<link rel="alternate" href=")[^"]*(" hreflang="fr" \/>)/, `$1${safeFrUrl}$2`)
      .replace(/(<link rel="alternate" href=")[^"]*(" hreflang="x-default" \/>)/, `$1${safeZhUrl}$2`)
      .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${safeUrl}$2`)
      .replace(/("url": ")[^"]*(")/, `$1${safeUrl}$2`);
  }

  return nextHtml;
}

function parseEntries(sourceText) {
  const seenTerms = new Set();
  return sourceText
    .split(/\r?\n\s*_{8,}\s*\r?\n/g)
    .map((block) => {
      const lines = cleanLines(block);
      if (!lines.some(containsHan)) return null;
      const term = findTerm(lines);
      if (!term || seenTerms.has(term)) return null;
      seenTerms.add(term);
      const searchableText = lines.join(' ');
      const category = getCategory(term, searchableText);
      return {
        term,
        category,
        emotions: inferEmotions(searchableText, category),
      };
    })
    .filter(Boolean);
}

async function writeRoute(routePath, html) {
  const directory = path.join(distDir, routePath);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html);
}

const [sourceText, indexHtml] = await Promise.all([
  readFile(sourcePath, 'utf8'),
  readFile(path.join(distDir, 'index.html'), 'utf8'),
]);

const entries = parseEntries(sourceText);
const emotions = [...new Set(entries.flatMap((entry) => [entry.category, ...entry.emotions]))];

await Promise.all([
  ...entries.map((entry) => {
    const routePath = `word/${routeSegment(entry.term)}`;
    const html = injectMeta(indexHtml, {
      title: `${entry.term}｜${entry.category} - 中文語境`,
      description: `「${entry.term}」是什麼意思？了解這個${entry.category}的文化脈絡與情感意涵。`,
      url: routeUrl(routePath),
    });

    return writeRoute(routePath, html);
  }),
  ...emotions.map((emotion) => {
    const routePath = `emotion/${routeSegment(emotion)}`;
    const html = injectMeta(indexHtml, {
      title: `${emotion}｜中文語境`,
      description: `探索「${emotion}」相關的中文詞語、成語與文化語境。`,
      url: routeUrl(routePath),
    });

    return writeRoute(routePath, html);
  }),
  writeFile(path.join(distDir, '404.html'), indexHtml),
]);

console.log(`Generated ${entries.length} word pages and ${emotions.length} emotion pages`);
