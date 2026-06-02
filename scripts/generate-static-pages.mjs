import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const siteBase = '/chinese';
const siteOrigin = 'https://fishpka.github.io';
const siteUrl = `${siteOrigin}${siteBase}`;
const rootDir = process.cwd();
const sourcePath = path.join(rootDir, 'src/data/Chinese-teaching.txt');
const distDir = path.join(rootDir, 'dist');

const containsHan = (value) => /\p{Script=Han}/u.test(value);
const emotionSignals = {
  焦慮: /焦[虑慮]|anxious|anxiety|inqui[eé]t|angoiss/iu,
  孤獨: /孤独|孤獨|寂寞|alone|solitude|seul/iu,
  懷念: /思念|怀念|懷念|nostalgi|longing|yearning|souvenir/iu,
  無奈: /无奈|無奈|helpless|impuissance|rien y faire/iu,
  喜悅: /开心|開心|喜悦|喜悅|joy|joyeux|joie/iu,
};

function slugify(value) {
  return encodeURIComponent(String(value).trim());
}

function routeSegment(value) {
  return String(value).trim().replaceAll('/', '／');
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
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

function getCategory(term, searchableText) {
  if (/[诗詞歌赋]|诗|poem|poète|唐朝|朝代|典故|myth|histoire/iu.test(searchableText)) return '典故';
  if (term.length === 4) return '成語';
  return '文化詞彙';
}

function inferEmotions(searchableText, category) {
  const detected = Object.entries(emotionSignals)
    .filter(([, pattern]) => pattern.test(searchableText))
    .map(([emotion]) => emotion);

  return detected.length ? detected : [category];
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

function buildSitemap(entries, emotions) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = [
    `${siteUrl}/`,
    ...entries.map((entry) => `${siteUrl}/word/${slugify(entry.term)}/`),
    ...emotions.map((emotion) => `${siteUrl}/emotion/${slugify(emotion)}/`),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url, index) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${index === 0 ? 'weekly' : 'monthly'}</changefreq>\n    <priority>${index === 0 ? '1.0' : '0.7'}</priority>\n  </url>`).join('\n')}\n</urlset>\n`;
}

const [sourceText, indexHtml] = await Promise.all([
  readFile(sourcePath, 'utf8'),
  readFile(path.join(distDir, 'index.html'), 'utf8'),
]);

const entries = parseEntries(sourceText);
const emotions = [...new Set(entries.flatMap((entry) => [entry.category, ...entry.emotions]))];

await Promise.all([
  ...entries.map((entry) => writeRoute(`word/${routeSegment(entry.term)}`, indexHtml)),
  ...emotions.map((emotion) => writeRoute(`emotion/${routeSegment(emotion)}`, indexHtml)),
  writeFile(path.join(distDir, '404.html'), indexHtml),
  writeFile(path.join(distDir, 'sitemap.xml'), buildSitemap(entries, emotions)),
]);

console.log(`Generated ${entries.length} word pages, ${emotions.length} emotion pages, and sitemap.xml`);
