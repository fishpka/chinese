import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { loadSeoData, siteUrl, wordUrl, emotionUrl } from './seo-data.mjs';
import { slugify } from '../src/lib/routes.js';
const { entries, emotions } = await loadSeoData();
const expected = [siteUrl, ...entries.map((entry) => wordUrl(entry.term)), ...emotions.map(emotionUrl)];
const sitemap = await readFile('sitemap.xml', 'utf8');
const titles = new Set();
const descriptions = new Set();
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].replaceAll('&amp;', '&'));
assert.deepEqual(urls, expected, 'Sitemap must match generated canonical routes');
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
for (const url of urls) {
  const relative = decodeURIComponent(new URL(url).pathname.replace(/^\/chinese\//, ''));
  const file = path.join(relative, 'index.html');
  const html = await readFile(file, 'utf8');
  assert(html.includes(`<link rel="canonical" href="${url}"`), `${file}: wrong canonical`);
  assert.equal((html.match(/<h1>/g) || []).length, 1, `${file}: expected one H1`);
  assert(html.includes('<h2>'), `${file}: missing H2`);
  const title = html.match(/<title>(.*?)<\/title>/)[1];
  const description = html.match(/<meta name="description" content="([^"]*)"/)[1];
  assert(title && !titles.has(title), `${file}: missing or duplicate title`);
  assert(description && !descriptions.has(description), `${file}: missing or duplicate description`);
  titles.add(title);
  descriptions.add(description);
  for (const match of html.matchAll(/href="(https:\/\/fishpka\.github\.io\/chinese\/[^"?#]*)"/g)) {
    const target = match[1].replaceAll('&amp;', '&');
    assert(expected.includes(target), `${file}: internal link not in canonical route set: ${target}`);
  }
  assert(!html.includes('content="noindex'), `${file}: unexpectedly noindex`);
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  const connectSources = csp.split(';').find((directive) => directive.trim().startsWith('connect-src ')).trim().split(/\s+/);
  assert(connectSources.includes('https://gateway.umami.is'), `${file}: Umami collection endpoint blocked by CSP`);
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
