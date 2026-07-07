import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `Act as a Local SEO Quality Rater. Analyze the provided Google Business Profile data and categorize factors into these color codes:
- GREEN (Highest/High): Strong performance, fully optimized (Score 70-100).
- YELLOW (Medium): Adequate but needs minor improvements (Score 55-69).
- RED (Low/Lowest): Critical gaps or violations (Score 0-54).

### MANDATORY EVALUATION FACTORS:
1. Relevance (25%): Primary/secondary categories and keyword-rich (not stuffed) descriptions.
2. Distance & Proximity (20%): Accuracy of location and service area.
3. Prominence (25%): Review volume, velocity, and average rating (target 4.5+).
4. Trust & E-E-A-T (20%): Quality of photos, NAP consistency, and verification status.
5. Engagement (10%): Frequency of posts and response time to reviews/Q&A.

### 2026 CRITICAL ELEMENTS:
- Review Sentiment and Keywords: Specific service mentions in reviews.
- NAP Consistency: Name, Address, Phone consistency.
- Engagement Signals: Response time (24-48h) and post frequency (2-3x/week).
- Visual Trust: High-quality, recent photos.
- Business Openness: Accurate operating hours.

### BEST PRACTICES AUDITING CHECKLIST:
Evaluate compliance with Local SEO and brand guidelines across exactly these 15 critical checkpoints. Provide a thorough audit result for each checkpoint in the "bestPractices" array:
1. "Business Name Consistency" — Checks NAP name match on website/third-party profiles, no taglines or extra stuffed keywords.
2. "Category Optimization" — Primary category matching core business, secondary categories correctly set without spam/algorithmic noise.
3. "Location & SAB Configuration" — Correct service area business (SAB) address hiding config, character-for-character NAP address match with website if visible.
4. "Contact & Deep-linking" — Consistent phone, active messaging, deep-linked website URLs containing campaign UTM parameters instead of general homepage.
5. "Operating Hours Accuracy" — Support hours reflection of actual availability rather than generic placeholders (like default "Open 24 hours").
6. "Business Description" — Under 750 characters, brand-aligned tone of voice, no pricing details or URLs.
7. "Services & Products Listings" — 5-10 active products/services, custom booking URLs, specific amenity checkboxes ticked honestly.
8. "Visual Trust & Photos" — Volume check (30+ benchmark), team action shots, interior/exterior shots, correct profile logo.
9. "Attributes & Payments" — Correctly configured payment methods (NFC, credit/debit, cash), crowd attributes, and spoken languages.
10. "Proactive Customer Q&A" — Seeding 3-5 standard customer queries (e.g. cancellation policy, booking process). Flag high priority if completely empty.
11. "Reviews & Reply Cadence" — Review count baselines, going-forward personalized reply habit for last 20-30 reviews, no template replies, all negative reviews addressed.
12. "Updates & Posts Cadence" — Standing update cadence (e.g., every 1-2 weeks), correct usage of events/offers vs standard updates.
13. "Social Profiles & sameAs" — Integrated social/entity links (Facebook, Insta, YouTube, TripAdvisor, Trustpilot) targeting sameAs entity authority (target >= 5 links).
14. "Website Consistency" — Aligning profile fields with the landing page design, keywords, and description themes.
15. "Compliance & Risk Flags" — Detection of duplicate listings, pending verification warnings, or unauthorized dashboard managers.

Return a JSON object matching the AuditResult interface including all 15 checkpoint items under the "bestPractices" array, each with its "category" name matching the checkpoint names, "status" (PASSED, MISSING, or PARTIAL), detailed "details" summarizing findings, and prioritization "impact" (HIGH, MEDIUM, or LOW).`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    businessName: { type: Type.STRING },
    totalScore: { type: Type.NUMBER },
    overallColor: { type: Type.STRING, enum: ["GREEN", "YELLOW", "RED"] },
    factors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          score: { type: Type.NUMBER },
          weight: { type: Type.NUMBER },
          color: { type: Type.STRING, enum: ["GREEN", "YELLOW", "RED"] },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          analysis: { type: Type.STRING },
        },
        required: ["name", "score", "weight", "color", "recommendations", "analysis"],
      },
    },
    priorityRoadmap: { type: Type.ARRAY, items: { type: Type.STRING } },
    bestPractices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          status: { type: Type.STRING, enum: ["PASSED", "MISSING", "PARTIAL"] },
          details: { type: Type.STRING },
          impact: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
        },
        required: ["category", "status", "details", "impact"],
      },
    },
  },
  required: ["businessName", "totalScore", "overallColor", "factors", "priorityRoadmap", "bestPractices"],
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data } = req.body;
    const isUrl = typeof data === "string";
    const contents = isUrl
      ? `Analyze the Google Business Profile at this URL: ${data}. Extract all relevant information to perform a complete Local SEO audit.`
      : `Analyze this GBP data: ${JSON.stringify(data)}`;

    const tools = isUrl ? [{ urlContext: {} }] : undefined;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        tools,
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
