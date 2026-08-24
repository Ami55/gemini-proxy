export const config = { maxDuration: 60 };

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    rewrittenMarkdown: { type: 'STRING' },
    wordCount: { type: 'INTEGER' },
    readingTimeMinutes: { type: 'INTEGER' },
    keyImprovements: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['rewrittenMarkdown', 'wordCount', 'readingTimeMinutes', 'keyImprovements'],
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const key = process.env.GEMINI_API_KEY || '';
  if (!key) return res.status(500).json({ success: false, error: 'Proxy is missing GEMINI_API_KEY' });
  const input = req.body || {};
  if (!input.url) return res.status(400).json({ success: false, error: 'URL is required for rewrite.' });

  const recommendations = input.recommendations || {};
  const prompt = `Write a publication-ready travel article in Markdown.\nURL: ${input.url}\nKeyword: ${input.targetKeyword || 'Travel guide'}\nCurrent title: ${input.currentTitle || ''}\nPage type: ${input.pageType || 'Destination guide'}\nTone: ${input.tone || 'expert local guide'}\nTarget length: ${input.targetLength || 'comprehensive'}\nRecommendations: ${JSON.stringify(recommendations)}\nExisting content:\n${(input.pageContent || '').slice(0, 8000)}\n\nInclude an optimized H1 and meta description, quick-planner table, strong introduction, practical itinerary, neighborhood guidance, key attractions and booking advice, food, transport, hidden gems, private-guide value, FAQs and a final checklist. Write complete prose, not an outline.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(50000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'You are an elite travel content writer and SEO copy chief. Return only JSON matching the provided schema.' }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, responseMimeType: 'application/json', responseSchema: SCHEMA },
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status === 429 ? 429 : 502).json({ success: false, error: data?.error?.message || `Gemini HTTP ${response.status}` });
    const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
    const payload = JSON.parse(text);
    return res.status(200).json({ success: true, rewrite: { ...payload, tone: input.tone || 'expert-guide', targetLength: input.targetLength || 'comprehensive', generatedAt: new Date().toISOString() } });
  } catch (error) {
    return res.status(error?.name === 'TimeoutError' ? 504 : 500).json({ success: false, error: error?.message || 'Rewrite failed' });
  }
}
