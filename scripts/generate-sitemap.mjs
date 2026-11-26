import { mkdir, writeFile } from 'node:fs/promises';
import { loadSeoData, siteUrl, wordUrl, emotionUrl, escapeHtml } from './seo-data.mjs';
const { entries, emotions, lastmod } = await loadSeoData();
const urls = [siteUrl, ...entries.map((entry) => wordUrl(entry.term)), ...emotions.map(emotionUrl)];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escapeHtml(url)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`;
await mkdir('public', { recursive: true });
await writeFile('public/sitemap.xml', xml);
console.log(`Generated sitemap with ${urls.length} canonical URLs`);
