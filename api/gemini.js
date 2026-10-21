export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { contents, model, systemInstruction, generationConfig, tools } = body || {};
    const modelName = model || 'gemini-2.0-flash';
    if (!/^[a-zA-Z0-9._-]+$/.test(modelName) || !contents) return res.status(400).json({ error: 'A valid model and contents are required.' });
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'Shared AI service is not configured.' });
    const request = { contents };
    if (systemInstruction) request.systemInstruction = systemInstruction;
    if (generationConfig) request.generationConfig = generationConfig;
    if (tools) request.tools = tools;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify(request), signal: AbortSignal.timeout(110000)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(err.name === 'TimeoutError' ? 504 : 502).json({ error: err.name === 'TimeoutError' ? 'Shared AI request timed out. Please retry.' : 'Shared AI service could not complete the request.' });
  }
}
