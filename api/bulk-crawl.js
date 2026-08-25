export const config = { maxDuration: 30 };

const clean = (value) => value.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
function htmlData(html, url, method) {
  const all = (tag) => [...html.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))].map((m) => clean(m[1])).filter(Boolean);
  const title = all('title')[0] || ''; const h1 = all('h1')[0] || title; const mainContent = clean(html).slice(0, 15000);
  return { url, httpStatus: 200, crawlMethod: method, title, metaDescription: html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i)?.[1]?.trim() || '', h1, h2s: all('h2'), h3s: all('h3'), wordCount: mainContent.split(/\s+/).filter(Boolean).length, mainContent, internalLinks: [], externalLinks: [], images: [], publishedDate: '', lastModifiedDate: '', schemaMarkup: '' };
}
function markdownData(markdown, url) {
  const lines = markdown.split('\n'); const titleLine = lines.find((x) => x.startsWith('# '))?.slice(2).trim() || new URL(url).hostname;
  return { url, httpStatus: 200, crawlMethod: 'Jina AI Reader', title: titleLine, metaDescription: '', h1: titleLine, h2s: lines.filter((x) => x.startsWith('## ')).map((x) => x.slice(3).trim()), h3s: lines.filter((x) => x.startsWith('### ')).map((x) => x.slice(4).trim()), wordCount: markdown.split(/\s+/).filter(Boolean).length, mainContent: markdown.slice(0, 15000), internalLinks: [], externalLinks: [], images: [], publishedDate: '', lastModifiedDate: '', schemaMarkup: '' };
}
async function jina(url) { const r = await fetch(`https://r.jina.ai/${url}`, { headers: { Accept: 'text/plain' }, signal: AbortSignal.timeout(18000) }); if (!r.ok) throw new Error(`Jina HTTP ${r.status}`); return markdownData(await r.text(), url); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end(); if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  let { url, forceJina } = req.body || {}; if (!url) return res.status(400).json({ error: 'URL is required' }); if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    if (forceJina) return res.status(200).json({ success: true, httpStatus: 200, data: await jina(url) });
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BoldStudioSEO/1.0)', Accept: 'text/html' }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Direct HTTP ${response.status}`);
    return res.status(200).json({ success: true, httpStatus: response.status, data: htmlData(await response.text(), url, 'Direct Crawler') });
  } catch {
    try { return res.status(200).json({ success: true, httpStatus: 200, data: await jina(url) }); }
    catch (error) { return res.status(200).json({ success: false, error: error?.message || 'Could not fetch page' }); }
  }
}
