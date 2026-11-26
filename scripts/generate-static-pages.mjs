import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadSeoData, siteUrl, wordUrl, emotionUrl, escapeHtml as e } from './seo-data.mjs';
const dist = path.resolve('dist');
const { entries, emotions } = await loadSeoData();
const shell = await readFile(path.join(dist, 'index.html'), 'utf8');
function link(url, label) { return `<a href="${e(url)}">${e(label)}</a>`; }
function list(items) { return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`; }
function renderPage({ title, description, url, content, schema }) {
  let html = shell.replace(/<title>[^<]*<\/title>/, () => `<title>${e(title)}</title>`);
  for (const name of ['description', 'og:title', 'og:description', 'og:url', 'twitter:title', 'twitter:description']) {
    const value = name.endsWith('title') ? title : name === 'og:url' ? url : description;
    html = html.replace(new RegExp(`(<meta (?:name|property)="${name}" content=")[^"]*(")`), (_, before, after) => before + e(value) + after);
  }
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, (_, before, after) => before + e(url) + after);
  const json = JSON.stringify(schema).replaceAll('<', '\\u003c');
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">${json}</script>`);
  return html.replace('<div id="root"></div>', () => `<div id="root"><main class="static-archive" style="max-width:72rem;margin:auto;padding:2rem;line-height:1.8">${content}</main></div>`);
}
async function writePage(url, options) {
  const relative = decodeURIComponent(new URL(url).pathname.replace(/^\/chinese\//, ''));
  const directory = path.join(dist, relative);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), renderPage({ ...options, url }));
}
for (const entry of entries) {
  const url = wordUrl(entry.term);
  const description = `「${entry.term}」是什麼意思？了解這個${entry.category}的文化脈絡與情感意涵。`;
  const details = [['中文解釋', entry.content.zh.description], ['English', entry.content.en.description], ['Français', entry.content.fr.description], ['例句', entry.content.zh.example]].filter(([, value]) => value);
  const tags = [...new Set([entry.category, ...entry.editable.emotions])];
  const related = entries.filter((item) => item.term !== entry.term && (item.category === entry.category || item.editable.emotions.some((tag) => tags.includes(tag)))).slice(0, 8);
  await writePage(url, {
    title: `${entry.term}｜${entry.category} - 中文語境`, description,
    content: `<nav>${link(siteUrl, '中文語境首頁')}</nav><h1>${e(entry.term)}</h1><p>${tags.map((tag) => link(emotionUrl(tag), tag)).join(' · ')}</p>${details.map(([label, text]) => `<section><h2>${e(label)}</h2><p>${e(text)}</p></section>`).join('')}<section><h2>相關詞語</h2>${list(related.map((item) => link(wordUrl(item.term), item.term)))}</section>`,
    schema: { '@context': 'https://schema.org', '@type': 'DefinedTerm', name: entry.term, description: entry.content.zh.description, url, inDefinedTermSet: { '@type': 'DefinedTermSet', name: '中文語境', url: siteUrl } },
  });
}
for (const emotion of emotions) {
  const selected = entries.filter((entry) => entry.category === emotion || entry.editable.emotions.includes(emotion));
  const url = emotionUrl(emotion);
  await writePage(url, {
    title: `${emotion}｜中文語境`, description: `探索「${emotion}」相關的中文詞語、成語與文化語境。`,
    content: `<nav>${link(siteUrl, '中文語境首頁')}</nav><h1>${e(emotion)}</h1><p>共 ${selected.length} 個相關詞語</p>${list(selected.map((entry) => `${link(wordUrl(entry.term), entry.term)}<p>${e(entry.content.zh.description)}</p>`))}`,
    schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${emotion}｜中文語境`, url, mainEntity: { '@type': 'ItemList', itemListElement: selected.map((entry, index) => ({ '@type': 'ListItem', position: index + 1, name: entry.term, url: wordUrl(entry.term) })) } },
  });
}
await writePage(siteUrl, {
  title: '中文語境｜Chinese Nuance Archive', description: '探索中文詞語、成語與文化詞彙，透過中英法解釋、例句與情緒分類，理解詞語背後的文化脈絡與使用情境。',
  content: `<h1>中文語境</h1><p>透過中英法解釋、例句與情緒分類，探索中文詞語、成語與文化脈絡。</p><section><h2>情緒與分類</h2>${list(emotions.map((emotion) => link(emotionUrl(emotion), emotion)))}</section><section><h2>詞語索引</h2>${list(entries.map((entry) => link(wordUrl(entry.term), entry.term)))}</section>`,
  schema: { '@context': 'https://schema.org', '@type': 'WebSite', name: '中文語境', url: siteUrl, inLanguage: ['zh-Hant', 'en', 'fr'] },
});
const notFound = shell.replace(/<meta name="robots" content="[^"]*"[^>]*>/, '<meta name="robots" content="noindex,follow">').replace(/<link rel="canonical"[^>]*>/, '').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '').replace(/<title>[^<]*<\/title>/, '<title>找不到頁面｜中文語境</title>').replace('<div id="root"></div>', `<div id="root"><main><h1>找不到頁面</h1>${link(siteUrl, '返回中文語境首頁')}</main></div>`);
await writeFile(path.join(dist, '404.html'), notFound.replace(/[ \t]+$/gm, ''));
console.log(`Generated static content for home, ${entries.length} words and ${emotions.length} categories`);
