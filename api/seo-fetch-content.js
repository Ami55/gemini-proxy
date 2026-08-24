export const config = { maxDuration: 30 };

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const fallback = (url) => {
  const parsed = new URL(url);
  const slug = parsed.pathname.split('/').filter(Boolean).pop() || parsed.hostname;
  const topic = decodeURIComponent(slug).replace(/[-_]+/g, ' ').replace(/\.[a-z0-9]+$/i, '').trim();
  const titleTopic = topic.replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    success: true,
    isCrawlerProtected: true,
    title: `${titleTopic} | Travel Guide`,
    description: `Travel guide and local insights for ${titleTopic}.`,
    content: `URL: ${url}\nDestination or topic: ${titleTopic}\nThe website blocked automated extraction. Analyze using the URL, title, keyword, and destination knowledge.`,
  };
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

  try {
    const parsed = new URL(url.trim());
    const response = await fetch(parsed.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BoldStudioSEO/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return res.status(200).json(fallback(parsed.href));

    const html = await response.text();
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || '';
    const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i)?.[1]?.trim() || '';
    const content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12000);

    if (content.length < 150) return res.status(200).json(fallback(parsed.href));
    return res.status(200).json({ success: true, title, description, content });
  } catch {
    try { return res.status(200).json(fallback(url)); }
    catch { return res.status(400).json({ success: false, error: 'Invalid URL' }); }
  }
}
