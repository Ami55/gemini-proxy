export const config = { maxDuration: 60 };

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    cloudNLP: {
      type: 'OBJECT',
      properties: {
        annotated_text: { type: 'STRING' },
        entities: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              id: { type: 'INTEGER' }, text: { type: 'STRING' }, type: { type: 'STRING' }, salience: { type: 'NUMBER' },
              sentiment: { type: 'OBJECT', properties: { score: { type: 'NUMBER' }, magnitude: { type: 'NUMBER' } }, required: ['score', 'magnitude'] },
              metadata: { type: 'OBJECT', properties: { wikipedia_url: { type: 'STRING' } } },
            },
            required: ['id', 'text', 'type', 'salience', 'sentiment'],
          },
        },
        overall_sentiment: { type: 'OBJECT', properties: { score: { type: 'NUMBER' }, magnitude: { type: 'NUMBER' } }, required: ['score', 'magnitude'] },
      },
      required: ['annotated_text', 'entities', 'overall_sentiment'],
    },
    nerPipeline: {
      type: 'OBJECT',
      properties: {
        tokens: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'INTEGER' }, text: { type: 'STRING' }, pos: { type: 'STRING' }, posDescription: { type: 'STRING' } }, required: ['id', 'text', 'pos'] } },
        entities: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'INTEGER' }, text: { type: 'STRING' }, category: { type: 'STRING' }, confidence: { type: 'NUMBER' }, startIndex: { type: 'INTEGER' }, endIndex: { type: 'INTEGER' }, explanation: { type: 'STRING' } }, required: ['id', 'text', 'category', 'confidence', 'startIndex', 'endIndex'] } },
        markdownReport: { type: 'STRING' },
      },
      required: ['tokens', 'entities', 'markdownReport'],
    },
  },
  required: ['cloudNLP', 'nerPipeline'],
};

const SYSTEM = `You are a dual Natural Language Processing engine. Perform both analyses simultaneously.
1. Cloud-style NLP: annotate the original text with <entity type="TYPE" id="ID">text</entity>; classify entities as ORGANIZATION, LOCATION, PERSON, CONSUMER_GOOD, EVENT, PRICE, NUMBER, DATE, WORK_OF_ART or OTHER; estimate salience, entity sentiment and overall sentiment; add a Wikipedia URL only when confidently relevant.
2. NER pipeline: tokenize precisely with sequential zero-based token IDs; assign Universal POS tags and plain-English descriptions; identify entity spans with inclusive zero-based token start/end indexes, category, confidence 0-100 and concise linguistic justification; then produce a useful Markdown report about tokenization, grammatical cues, disambiguation and confidence.
Return only valid JSON matching the schema.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.GEMINI_API_KEY || '';
  const { text } = req.body || {};
  if (!key) return res.status(500).json({ error: 'Proxy is missing GEMINI_API_KEY' });
  if (!text || typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: "Missing or invalid 'text' field." });

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(45000),
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ role: 'user', parts: [{ text: text.trim() }] }], generationConfig: { temperature: 0.1, responseMimeType: 'application/json', responseSchema: SCHEMA } }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status === 429 ? 429 : 502).json({ error: data?.error?.message || `Gemini HTTP ${response.status}` });
    const output = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
    return res.status(200).json(JSON.parse(output));
  } catch (error) {
    return res.status(error?.name === 'TimeoutError' ? 504 : 500).json({ error: error?.message || 'NLP analysis failed' });
  }
}
