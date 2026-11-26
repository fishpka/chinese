import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { loadSeoData, siteUrl, homeTitle, homeDescription, wordMetadata, wordUrl, emotionUrl, escapeHtml as e } from './seo-data.mjs';
const dist = path.resolve('dist');
const { entries, emotions, aliases, excluded, legacyTerms } = await loadSeoData();
const shell = await readFile(path.join(dist, 'index.html'), 'utf8');
// Reuse existing React components instead of maintaining a second, flashing text UI.
const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { renderArchive } = await server.ssrLoadModule('/entry-server.jsx');
  function link(url, label) { return `<a href="${e(url)}">${e(label)}</a>`; }
  function renderPage({ title, description, url, content, schema, pageType = 'canonical', noindex = false }) {
    let html = shell.replace(/<title>[^<]*<\/title>/, () => `<title>${e(title)}</title>`);
    for (const name of ['description', 'og:title', 'og:description', 'og:url', 'twitter:title', 'twitter:description']) {
      const value = name.endsWith('title') ? title : name === 'og:url' ? url || siteUrl : description;
      html = html.replace(new RegExp(`(<meta (?:name|property)="${name}" content=")[^"]*(")`), (_, before, after) => before + e(value) + after);
    }
    html = html.replace(/<link rel="canonical"[^>]*>/, () => url ? `<link rel="canonical" href="${e(url)}" />` : '');
    const json = JSON.stringify(schema).replaceAll('<', '\\u003c');
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => schema ? `<script type="application/ld+json">${json}</script>` : '');
    if (noindex) html = html.replace(/<meta name="robots" content="[^"]*"[^>]*>/, '<meta name="robots" content="noindex,follow">');
    html = html.replace('<html lang="zh-Hant">', `<html lang="zh-Hant" data-page-type="${pageType}">`);
    return html.replace('<div id="root"></div>', () => `<div id="root">${content}</div>`).replace(/[ \t]+$/gm, '');
  }
  async function writePage(routeUrl, options) {
    const relative = decodeURIComponent(new URL(routeUrl).pathname.replace(/^\/chinese\//, ''));
    const directory = path.join(dist, relative);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'index.html'), renderPage(options));
  }
  const renderedWords = new Map();
  const completed = new Set();
  for (const entry of entries) {
    const url = wordUrl(entry.term);
    const content = renderArchive(entries, new URL(url).pathname);
    const options = {
      ...wordMetadata(entry), url, content,
      schema: { '@context': 'https://schema.org', '@type': 'DefinedTerm', name: entry.term,
        alternateName: entry.aliases, description: entry.providedContent.zh.description, url,
        inDefinedTermSet: { '@type': 'DefinedTermSet', name: '中文語境', url: siteUrl } },
    };
    renderedWords.set(entry.term, options);
    await writePage(url, options);
    completed.add(entry.term);
  }
  for (const { term, entry } of aliases) {
    await writePage(wordUrl(term), { ...renderedWords.get(entry.term), pageType: 'alias' });
    completed.add(term);
  }
  for (const { term, reason, records } of excluded) {
    const preserved = records.map((record) => `<section><h2>原始資料（尚未列為教學詞條）</h2><p>${e(record.baseSearchableText)}</p></section>`).join('');
    await writePage(wordUrl(term), { title: `${term}｜資料待整理 - 中文語境`, description: reason,
      url: null, schema: null, pageType: 'excluded', noindex: true,
      content: `<main class="mx-auto max-w-7xl px-5 py-10"><h1>資料待整理</h1><p>${e(reason)}</p><nav>${link(siteUrl, '返回詞庫')}</nav>${preserved}</main>` });
    completed.add(term);
  }
  // Protect all previously generated addresses, including future parser-policy changes.
  for (const term of legacyTerms) {
    if (completed.has(term)) continue;
    await writePage(wordUrl(term), { title: '資料待整理｜中文語境', description: '此資料尚待人工整理，請由詞庫尋找相關內容。',
      url: null, schema: null, pageType: 'excluded', noindex: true,
      content: `<main><h1>資料待整理</h1><h2>${e(term)}</h2>${link(siteUrl, '返回詞庫')}</main>` });
  }
  for (const emotion of emotions) {
    const url = emotionUrl(emotion);
    const selected = entries.filter((entry) => entry.category === emotion || entry.editable.emotions.includes(emotion));
    await writePage(url, { title: `${emotion}成語與中文詞語｜Chinese Vocabulary - 中文語境`,
      description: `探索 ${selected.length} 個「${emotion}」相關中文詞語、成語、文化解釋及原始使用情境。Chinese vocabulary in context.`, url,
      content: renderArchive(entries, new URL(url).pathname),
      schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${emotion}｜中文語境`, url,
        mainEntity: { '@type': 'ItemList', itemListElement: selected.map((entry, index) => ({ '@type': 'ListItem', position: index + 1, name: entry.term, url: wordUrl(entry.term) })) } },
    });
  }
  await writePage(siteUrl, { title: homeTitle, description: homeDescription, url: siteUrl,
    content: renderArchive(entries, '/chinese/'),
    schema: { '@context': 'https://schema.org', '@type': 'WebSite', name: '中文語境｜Learn Chinese Idioms', url: siteUrl, inLanguage: ['zh-Hant', 'en', 'fr'] },
  });
  await writeFile(path.join(dist, '404.html'), renderPage({ title: '找不到頁面｜中文語境', description: '找不到這個網址，請返回中文語境詞庫。',
    url: null, schema: null, pageType: 'excluded', noindex: true, content: `<main><h1>找不到頁面</h1>${link(siteUrl, '返回中文語境首頁')}</main>` }));
  await mkdir('.seo', { recursive: true });
  await writeFile('.seo/report.json', JSON.stringify({ canonicalWords: entries.length, categories: emotions.length,
    indexableUrls: entries.length + emotions.length + 1, aliases: aliases.map(({ term, entry }) => ({ term, canonical: entry.term })),
    excluded: excluded.map(({ term, reason }) => ({ term, reason })), legacyUrlsPreserved: legacyTerms.length }, null, 2));
  console.log(`Prerendered ${entries.length} canonical words, ${emotions.length} categories, ${aliases.length} aliases and ${excluded.length} excluded records`);
} finally {
  await server.close();
}
