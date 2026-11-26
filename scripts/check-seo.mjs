import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createServer } from 'vite';
import { loadSeoData, siteUrl, wordUrl, emotionUrl, escapeHtml } from './seo-data.mjs';
import { slugify } from '../src/lib/routes.js';
import { parseTeachingSource, parseTeachingRecords } from '../src/data/teachingParser.js';
import { matchesQuery } from '../src/lib/search.js';
import { variantGroups } from '../src/data/entryPolicy.js';
const { entries, emotions, aliases, excluded, legacyTerms } = await loadSeoData();
const expected = [siteUrl, ...entries.map((entry) => wordUrl(entry.term)), ...emotions.map(emotionUrl)];
const canonicalUrls = new Set(expected);
const aliasTargets = new Map(aliases.map(({ term, entry }) => [wordUrl(term), wordUrl(entry.term)]));
const excludedUrls = new Set(excluded.map(({ term }) => wordUrl(term)));
const allUrls = new Set([...canonicalUrls, ...aliasTargets.keys(), ...excludedUrls]);
const sitemap = await readFile('sitemap.xml', 'utf8');
const unescape = (text) => text.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => unescape(match[1]));
assert.deepEqual(urls, expected, 'Sitemap must contain only eligible canonical routes');
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
assert.equal(await readFile('public/sitemap.xml', 'utf8'), sitemap, 'Public and deployed sitemaps differ');
const fileFor = (url) => path.join(decodeURIComponent(new URL(url).pathname.replace(/^\/chinese\//, '')), 'index.html');
const pages = new Map();
for (const url of allUrls) pages.set(url, await readFile(fileFor(url), 'utf8'));
for (const term of legacyTerms) assert(pages.has(wordUrl(term)), `Legacy address lost: ${term}`);
// No stale generated page is allowed to become an untested orphan.
async function collectHtml(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await collectHtml(file));
    else if (entry.name === 'index.html') found.push(file);
  }
  return found;
}
for (const directory of ['word', 'emotion']) {
  for (const file of await collectHtml(directory)) {
    assert([...allUrls].some((url) => fileFor(url) === file), `Unexpected generated route: ${file}`);
  }
}
const titles = new Set(), descriptions = new Set();
const docs = new Map(pages);
docs.set(new URL('404.html', siteUrl).href, await readFile('404.html', 'utf8'));
let anchorCount = 0;
for (const [url, html] of docs) {
  const file = url.endsWith('/404.html') ? '404.html' : fileFor(url);
  const isCanonical = canonicalUrls.has(url), isAlias = aliasTargets.has(url);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/g) || [];
  const declared = canonical.length ? unescape(canonical[0].match(/href="([^"]+)"/)[1]) : null;
  const noindex = /<meta name="robots" content="[^"]*\bnoindex\b/.test(html);
  assert(!/app-loading|visibility:\s*hidden/.test(html), `${file}: static content hidden during startup`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${file}: expected one H1`);
  assert.equal((html.match(/<main\b/g) || []).length, 1, `${file}: expected one main landmark`);
  if (isCanonical || isAlias) {
    assert.equal(canonical.length, 1, `${file}: expected one canonical`);
    assert.equal(declared, isCanonical ? url : aliasTargets.get(url), `${file}: canonical mismatch`);
    assert(!noindex, `${file}: canonical/alias should be consolidated using canonical, not noindex`);
    assert(/<h2\b/.test(html), `${file}: missing H2`);
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema.url, declared, `${file}: JSON-LD canonical mismatch`);
    if (isCanonical) {
      const title = html.match(/<title>(.*?)<\/title>/)[1];
      const description = html.match(/<meta name="description" content="([^"]*)"/)[1];
      assert(title && !titles.has(title), `${file}: empty or duplicate title`);
      assert(description && !descriptions.has(description), `${file}: empty or duplicate description`);
      titles.add(title); descriptions.add(description);
    } else assert(!urls.includes(url), `${file}: alias in sitemap`);
  } else {
    assert(noindex && !declared && !urls.includes(url), `${file}: excluded page must be noindex, without canonical or sitemap entry`);
  }
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert(csp.split(';').find((d) => d.trim().startsWith('connect-src ')).split(/\s+/).includes('https://gateway.umami.is'), `${file}: Umami CSP blocked`);
  // Validate actual anchors and local assets, including relative paths and fragments.
  for (const match of html.matchAll(/<(a|link|script|img|source)\b[^>]*\b(href|src)="([^"]+)"[^>]*>/g)) {
    const [, tag, , raw] = match;
    const target = new URL(unescape(raw), url);
    if (['mailto:', 'tel:', 'data:'].includes(target.protocol)) continue;
    assert(['https:', 'http:'].includes(target.protocol), `${file}: invalid URL scheme`);
    if (target.origin !== new URL(siteUrl).origin) continue;
    assert(target.pathname.startsWith('/chinese/'), `${file}: asset/link outside /chinese/ base: ${target.href}`);
    const bare = target.origin + target.pathname;
    if (tag === 'a') {
      anchorCount++;
      assert(canonicalUrls.has(bare), `${file}: internal anchor must target a canonical route: ${bare}`);
      if (target.hash) {
        const targetHtml = pages.get(bare);
        assert(targetHtml.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`), `${file}: broken fragment ${target.href}`);
      }
    } else {
      const pathname = decodeURIComponent(target.pathname.replace(/^\/chinese\//, ''));
      if (bare.endsWith('/')) assert(allUrls.has(bare), `${file}: missing local page`);
      else await access(pathname);
    }
  }
  // Check images in meta tags and image/font references in inline styles.
  for (const match of html.matchAll(/<meta (?:property="og:image"|name="twitter:image") content="([^"]+)"/g)) {
    const image = new URL(unescape(match[1]));
    assert(image.pathname.startsWith('/chinese/'));
    await access(decodeURIComponent(image.pathname.replace(/^\/chinese\//, '')));
  }
}
for (const entry of entries) {
  assert(entry.indexable && !entry.exclusionReason);
  const html = pages.get(wordUrl(entry.term));
  assert(entry.providedContent.zh.description.length > entry.term.length, `${entry.term}: empty teaching content`);
  assert(html.includes(escapeHtml(entry.providedContent.zh.description)), `${entry.term}: original teaching content missing from HTML`);
  for (const alias of entry.aliases) assert(matchesQuery(entry, alias), `${entry.term}: alias search broken: ${alias}`);
}
for (const group of variantGroups) assert.equal(entries.filter((entry) => group.includes(entry.term)).length, 1, `Variant group not consolidated: ${group}`);
const rejected = parseTeachingSource('欢迎关注我的Instagram，追蹤人數達標了，謝謝大家的支持與分享。');
assert.equal(rejected.length, 0, 'Social-copy regression');
assert.equal(parseTeachingSource('诗经\nshī jīng').length, 0, 'Incomplete source regression');
assert.equal(parseTeachingSource('自以为是形容一个人总认为自己是对的，听不进别人的意见，带有自负、固执的意味。')[0].term, '自以为是');
assert(parseTeachingRecords('诗经\nshī jīng')[0].exclusionReason);
assert.equal(slugify('甲/乙'), encodeURIComponent('甲／乙'));
// Exercise the existing React tree as used by the generator, including legacy alias lookup.
const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { renderArchive } = await server.ssrLoadModule('/entry-server.jsx');
  for (const alias of ['自以为', '难兄难弟', '端午节']) {
    const entry = entries.find((record) => record.aliases.includes(alias));
    const rendered = renderArchive(entries, new URL(wordUrl(alias)).pathname);
    assert(rendered.includes(escapeHtml(entry.providedContent.zh.description)), `Runtime alias route failed: ${alias}`);
  }
} finally { await server.close(); }
// Mock the tracker without sending fabricated visits to production analytics.
const analytics = (await readFile('src/lib/analytics/umami.js', 'utf8')).replaceAll('import.meta.env', '({})').replaceAll('export ', '');
const scripts = [];
const document = { querySelector: () => scripts.find((s) => !s.removed), createElement: () => ({ dataset: {}, listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; }, remove() { this.removed = true; } }), head: { appendChild(script) { scripts.push(script); } } };
const window = {};
const api = vm.runInNewContext(`${analytics}; ({ ensureUmamiScript, trackEvent })`, { document, window });
assert(api.ensureUmamiScript()); api.ensureUmamiScript(); assert.equal(scripts.length, 1);
assert.equal(api.trackEvent('test'), false);
assert.notEqual(scripts[0].dataset.autoTrack, 'false');
assert.notEqual(scripts[0].dataset.autoPageview, 'false');
let calls = 0; window.umami = { track() { calls++; } };
assert(api.trackEvent('test')); assert.equal(calls, 1);
scripts[0].listeners.error(); api.ensureUmamiScript(); assert.equal(scripts.length, 2);
assert(!(await readFile('src/App.jsx', 'utf8')).includes('trackPageView('), 'Manual effect duplicates automatic SPA pageviews');
console.log(`SEO checks passed: ${urls.length} canonical URLs, ${aliases.length} alias URLs, ${excluded.length} noindex records, ${anchorCount} anchors, original teaching content, base paths and mocked Umami`);
