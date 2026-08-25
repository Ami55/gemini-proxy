export const config = { maxDuration: 60 };

function buildPrompt(city) {
  return `You are an Elite Travel Editor, Local Historian, and Master Guide Writer for Travel Blueprint & Curated Editorial Archive (Level 9 Local Guide Authority).

Write a complete, bespoke, deeply actionable destination travel guide for ${city}. Use current 2026 context where you are confident, and explicitly tell readers to verify time-sensitive prices, schedules, events, entry rules and closures.

CRITICAL RULES:
- Headings must be bespoke and evocative for ${city}; never use repetitive boilerplate headings.
- FAQs must be specific questions travelers actually ask about ${city}.
- Return the guide as clean semantic HTML only, without Markdown fences or commentary.
- Use <h2> for the ten main sections, <h3> for subsections, neighborhoods, itinerary days and FAQ questions, <p> for prose, <ul>/<li> for lists, <blockquote> for editorial callouts and <strong> for labels.
- Naturally incorporate these semantic entities: Precipitation, Shoulder Season, Peak Tourist Density, Accommodation Cost Surges, Neighborhoods, Culinary, Museum Passes and Transit Logistics.
- Never use placeholders. Always name real ${city} places, routes, dishes and institutions.

Begin with a two-sentence hook starting with “Discover” or “Explore”, followed by quick facts for primary language and English proficiency, local currency and symbol, ideal stay, walkability score with terrain, and one signature experience.

Create these ten comprehensive sections:
1. A city-specific seasonal strategy covering sweet-spot months, shoulder season, monthly precipitation/rain days, °C/°F temperatures, daylight and peak-density avoidance.
2. Four or five named neighborhoods. For each give atmosphere, best traveler type, and specific luxury, boutique mid-range and value accommodation options.
3. Six essential cultural sights, monuments and museums with booking windows, passes, crowd-avoidance times, photography viewpoints and nearby overlooked places.
4. Culinary identity: four signature dishes, drinks, historic markets/dining quarters, meal times, reservation norms, tipping and realistic costs.
5. A detailed three-day itinerary. Each day must have Morning, Midday Transit & Cafe Pitstop, Afternoon, Evening Transit & Aperitivo, and Evening. Name actual transit lines/routes and actual venues. Add a Bonus 5-Day Extension with two or three day trips, train lines and travel times.
6. Airport/station connections, public transit, contactless payment, passes, walking terrain and bike-share.
7. At least three real 2026 annual festivals or cultural events, with normal seasonal timing and a warning to verify exact dates.
8. Travel economy: peak accommodation surges, budget/mid-range/luxury daily budgets, and benchmarks for coffee, lunch, dinner with wine and transit.
9. Practical local etiquette, payment, safety/scam and accessibility guidance unique to ${city}.
10. Five highly specific ${city} FAQs about genuine local rules, language, payments, transport quirks, safety hotspots or seasonal constraints, each as an <h3> question followed by a detailed <p> answer.

Write in a vivid, authoritative local-guide voice with cultural storytelling and practical precision. Produce substantial, publication-ready prose rather than an outline.`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  const key = process.env.GEMINI_API_KEY || '';
  if (!key.trim()) return res.status(500).json({ error: 'Proxy is missing GEMINI_API_KEY.' });
  const { city } = req.body || {};
  if (!city || typeof city !== 'string' || !city.trim()) {
    return res.status(400).json({ error: 'City name parameter is required.' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(key.trim())}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(50000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'Return only clean semantic HTML for a premium destination guide. Do not use Markdown code fences.' }] },
        contents: [{ role: 'user', parts: [{ text: buildPrompt(city.trim()) }] }],
        generationConfig: { temperature: 0.55, maxOutputTokens: 16000 },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status === 429 ? 429 : 502).json({
        error: data?.error?.message || `Gemini API returned HTTP ${response.status}`,
      });
    }

    const content = (data?.candidates?.[0]?.content?.parts || [])
      .map((part) => typeof part?.text === 'string' ? part.text : '')
      .join('')
      .replace(/^```(?:html)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    if (!content) return res.status(502).json({ error: 'Gemini returned an empty guide.' });
    return res.status(200).json({ content, source: 'gemini' });
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return res.status(timedOut ? 504 : 500).json({
      error: timedOut ? 'Guide generation timed out. Please retry.' : (error?.message || 'Guide generation failed.'),
    });
  }
}
