export const config = { maxDuration: 60 };

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    searchIntent: { type: 'STRING' },
    missingTopics: { type: 'ARRAY', items: { type: 'STRING' } },
    missingEntities: { type: 'ARRAY', items: { type: 'STRING' } },
    faqIdeas: { type: 'ARRAY', items: { type: 'OBJECT', properties: { question: { type: 'STRING' }, answer: { type: 'STRING' } }, required: ['question', 'answer'] } },
    internalLinks: { type: 'ARRAY', items: { type: 'STRING' } },
    freshnessIssues: { type: 'STRING' },
    improvedMetaTitle: { type: 'STRING' },
    improvedMetaDescription: { type: 'STRING' },
    priorityScore: { type: 'INTEGER' },
    recommendedAction: { type: 'STRING' },
  },
  required: ['searchIntent', 'missingTopics', 'missingEntities', 'faqIdeas', 'internalLinks', 'freshnessIssues', 'improvedMetaTitle', 'improvedMetaDescription', 'priorityScore', 'recommendedAction'],
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const key = process.env.GEMINI_API_KEY || '';
  if (!key) return res.status(500).json({ success: false, error: 'Proxy is missing GEMINI_API_KEY' });
  const { url, targetKeyword, currentTitle, pageType, pageContent } = req.body || {};
  if (!url) return res.status(400).json({ success: false, error: 'URL is required for analysis.' });

  const prompt = `Act as a senior travel SEO strategist. Audit this page for search intent, missing topics and entities, useful FAQs, internal links, freshness, E-E-A-T, metadata and priority. Be specific and actionable.\nURL: ${url}\nTarget keyword: ${targetKeyword || 'Not specified'}\nCurrent title: ${currentTitle || 'Not specified'}\nPage type: ${pageType || 'Travel content'}\nPage content:\n${(pageContent || 'No extracted content available.').slice(0, 12000)}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(50000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'You are an expert travel SEO strategist. Return only JSON matching the provided schema.' }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: 'application/json', responseSchema: SCHEMA },
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status === 429 ? 429 : 502).json({ success: false, error: data?.error?.message || `Gemini HTTP ${response.status}` });
    const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
    return res.status(200).json({ success: true, recommendations: JSON.parse(text) });
  } catch (error) {
    return res.status(error?.name === 'TimeoutError' ? 504 : 500).json({ success: false, error: error?.message || 'Analysis failed' });
  }
}
