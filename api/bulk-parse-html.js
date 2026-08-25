export const config = { maxDuration: 30 };

const textOf = (html) => html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const matches = (html, tag) => [...html.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))].map((m) => textOf(m[1])).filter(Boolean);

function extract(html, url, crawlMethod) {
  const title = matches(html, 'title')[0] || '';
  const h1 = matches(html, 'h1')[0] || title;
  const h2s = matches(html, 'h2');
  const h3s = matches(html, 'h3');
  const metaDescription = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i)?.[1]?.trim() || '';
  const mainContent = textOf(html).slice(0, 15000);
  return { url, httpStatus: 200, crawlMethod, title, metaDescription, h1, h2s, h3s, wordCount: mainContent.split(/\s+/).filter(Boolean).length, mainContent, internalLinks: [], externalLinks: [], images: [], publishedDate: '', lastModifiedDate: '', schemaMarkup: '' };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { html, url, fileName } = req.body || {};
  if (!html || typeof html !== 'string') return res.status(400).json({ error: 'HTML content string is required' });
  const source = url || fileName || 'Pasted-HTML-Document';
  if (!html.includes('<')) {
    const lines = html.trim().split('\n').map((x) => x.trim()).filter(Boolean);
    return res.status(200).json({ success: true, data: { url: source, httpStatus: 200, crawlMethod: 'Raw Text / Markdown', title: lines[0] || source, metaDescription: (lines[1] || '').slice(0, 160), h1: lines[0] || '', h2s: lines.filter((x) => x.startsWith('## ')).map((x) => x.slice(3)), h3s: lines.filter((x) => x.startsWith('### ')).map((x) => x.slice(4)), wordCount: html.split(/\s+/).filter(Boolean).length, mainContent: html.slice(0, 15000), internalLinks: [], externalLinks: [], images: [], publishedDate: '', lastModifiedDate: '', schemaMarkup: '' } });
  }
  return res.status(200).json({ success: true, data: extract(html, source, fileName ? `File: ${fileName}` : 'Raw HTML Input') });
}
