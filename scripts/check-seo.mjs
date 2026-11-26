import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { loadSeoData, siteUrl, wordUrl, emotionUrl } from './seo-data.mjs';
import { slugify } from '../src/lib/routes.js';
const { entries, emotions } = await loadSeoData();
const expected = [siteUrl, ...entries.map((entry) => wordUrl(entry.term)), ...emotions.map(emotionUrl)];
const sitemap = await readFile('sitemap.xml', 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].replaceAll('&amp;', '&'));
assert.deepEqual(urls, expected, 'Sitemap must match generated canonical routes');
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
for (const url of urls) {
  const relative = decodeURIComponent(new URL(url).pathname.replace(/^\/chinese\//, ''));
  const file = path.join(relative, 'index.html');
  const html = await readFile(file, 'utf8');
  assert(html.includes(`<link rel="canonical" href="${url}"`), `${file}: wrong canonical`);
  assert(html.includes('<h1>'), `${file}: missing static heading`);
  assert(!html.includes('content="noindex'), `${file}: unexpectedly noindex`);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema.url, url, `${file}: structured data URL mismatch`);
  for (const match of html.matchAll(/(?:src|href)="(\/chinese\/assets\/[^"?#]+)"/g)) {
    await access(decodeURIComponent(match[1].replace(/^\/chinese\//, '')));
  }
}
const firstWordHtml = await readFile(path.join('word', decodeURIComponent(slugify(entries[0].term)), 'index.html'), 'utf8');
assert(firstWordHtml.includes('<h2>中文解釋</h2>'));
assert(firstWordHtml.includes('<h2>相關詞語</h2>'));
const notFound = await readFile('404.html', 'utf8');
assert(notFound.includes('content="noindex,follow"'));
assert(!notFound.includes('rel="canonical"'));
assert.equal(slugify('甲/乙'), encodeURIComponent('甲／乙'));
console.log(`SEO checks passed for ${urls.length} canonical pages, static content, JSON-LD, assets and 404`);
