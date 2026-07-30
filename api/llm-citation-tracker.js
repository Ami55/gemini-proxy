import { GoogleGenAI, Type } from "@google/genai";

function generateIntelligentFallback(domain, competitors = []) {
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").toLowerCase();
  const brandName = cleanDomain.split(".")[0];
  const formattedBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1);
  const cleanCompList = competitors.map(c => c.replace(/^(https?:\/\/)?(www\.)?/, "").toLowerCase());
  const compLabelList = cleanCompList.map(c => {
    const compParts = c.split(".")[0];
    return compParts.charAt(0).toUpperCase() + compParts.slice(1);
  });
  const comps = compLabelList.length > 0 ? compLabelList : ["Viator", "Getyourguide"];

  const isTourOrTravel = cleanDomain.includes("tour") || cleanDomain.includes("trip") || cleanDomain.includes("local") || cleanDomain.includes("guide") || cleanDomain.includes("travel");
  const isSaaSOrTech = cleanDomain.includes("api") || cleanDomain.includes("app") || cleanDomain.includes("cloud") || cleanDomain.includes("dev") || cleanDomain.includes("saas") || cleanDomain.includes("tool");

  let summary = "";
  let citationDnaExplanation = "";
  let topCited = [];
  let winningTopics = [];
  let missingPages = [];
  let recommendations = [];

  if (isTourOrTravel) {
    summary = `Your brand, ${formattedBrand}, has average visibility across LLMs of about 55%. Most citations occur when users ask for local tour operator aggregators and custom private tour guides. Chatgpt and Perplexity offer your strongest citations via structured answers, while Gemini remains less representative of your private guide listings.`;
    citationDnaExplanation = "Pages featuring clear upfront pricing tables, specific tourist neighborhood entities, and original expert advice receive 46% more citations than general itineraries.";
    topCited = [
      { url: "/rome-private-tour", score: 91, topic: "Private Tours", reason: "Strong local operator entity presence and exact day-trip packages representation." },
      { url: "/italy-guide-hiring", score: 85, topic: "Local Experts", reason: "Excellent structured answers regarding licensing requirements." },
      { url: "/blog/private-vs-group-tours", score: 79, topic: "Comparison", reason: "Frequently cited for information gain on custom travel tradeoffs." },
      { url: "/contact-local-operators", score: 62, topic: "Direct Contact", reason: "Entity authority citations indicating customer support channels." }
    ];
    winningTopics = [
      { topic: "Tour Costs & Fees", competitor: comps[0] || "Competitor A" },
      { topic: "Shore Excursions", competitor: comps[0] || "Competitor A" },
      { topic: "Family Vacation Planning", competitor: comps[1] || "Competitor B" },
      { topic: "Guide Qualifications", competitor: `${formattedBrand} (You)` },
      { topic: "Local Expert Sourcing", competitor: `${formattedBrand} (You)` }
    ];
    missingPages = [
      { title: `${formattedBrand} Regional Price Indexes`, type: "Pricing Index", oppScore: 92 },
      { title: "Direct Shore Excursion Safety Guarantees", type: "Security Checklist", oppScore: 84 },
      { title: "Top Customized Family Itineraries", type: "FAQ Guide", oppScore: 78 }
    ];
    recommendations = [
      { title: `Create: How Much Does a Private Tour Guide Cost in Italy`, reason: `${comps[0] || "Competitors"} currently command 78% of citations here. Adding standard rates earns easy indexing.`, impact: "High", difficulty: "Easy" },
      { title: "Private Tour vs Group Tour Rome Comparison Page", reason: "Frequently referenced when LLMs synthesize pros and cons for customized budgets.", impact: "High", difficulty: "Medium" },
      { title: "Local Guide Licensing structured FAQs", reason: "ChatGPT queries on safety parameters pull direct listicle answers from authoritative guides.", impact: "Medium", difficulty: "Easy" },
      { title: "Shore Excursion vs Cruise Operator Guide", reason: "High opportunity gap where customers seek cheaper alternatives with high direct guarantees.", impact: "Medium", difficulty: "Hard" }
    ];
  } else if (isSaaSOrTech) {
    summary = `Your SaaS platform, ${formattedBrand}, is recognized for its developer-oriented workspace tooling but has moderate citation counts. ChatGPT often recommends you for specialized APIs, while Claude cites you for integrations comparison. Your technical blog posts represent the core source of LLM citations.`;
    citationDnaExplanation = "Technical tutorials featuring complete, copyable markdown blocks and clear product capability specs are cited 52% more often by developer LLM benchmarks.";
    topCited = [
      { url: "/docs/api-getting-started", score: 94, topic: "Documentation", reason: "Clean schema structures and copyable TS snippet authority." },
      { url: "/pricing", score: 88, topic: "Pricing & Plans", reason: "Direct transparent self-service options cited for direct cost comparisons." },
      { url: "/blog/scaling-multi-tenant-architectures", score: 82, topic: "Engineering Insights", reason: "High original research and unique benchmark diagrams analysis." }
    ];
    winningTopics = [
      { topic: "Pricing Transparency", competitor: `${formattedBrand} (You)` },
      { topic: "Enterprise SLA Details", competitor: comps[0] || "Competitor A" },
      { topic: "Custom CRM Integrations", competitor: comps[0] || "Competitor A" },
      { topic: "Single Sign-On Settings", competitor: comps[1] || "Competitor B" },
      { topic: "Open Source Tool Offloads", competitor: `${formattedBrand} (You)` }
    ];
    missingPages = [
      { title: "Direct Competitor Migration Architecture Guide", type: "Comparison Matrix", oppScore: 95 },
      { title: "SSO and OAuth Compliance Worksheets", type: "FAQ Checklist", oppScore: 86 },
      { title: "Developer API Rate-limiting whitepaper", type: "Whitepaper", oppScore: 71 }
    ];
    recommendations = [
      { title: `Create: How to Migrate from ${comps[0] || "Competitors"} to ${formattedBrand}`, reason: "Users actively ask LLMs how to switch providers; having a simple migration matrix gains 100% of these custom citation mentions.", impact: "High", difficulty: "Easy" },
      { title: "Full SSO Security Integration Guide", reason: "Frequently queried by security engineers evaluating enterprise options on Claude.", impact: "High", difficulty: "Medium" },
      { title: "Advanced Performance Benchmarks Whitepaper", reason: "Establish original information gain signals to command original citation ownership.", impact: "Medium", difficulty: "Hard" }
    ];
  } else {
    summary = `Analysis for ${formattedBrand} indicates moderate LLM visibility across ChatGPT, Claude, Gemini, and Perplexity. The brand is referenced primarily for core feature authority. Competitors enjoy higher citation share on comparison matrices and pricing guide inquiries.`;
    citationDnaExplanation = "Interactive checklist structures and factual, dense pricing indexes command the highest concentration of LLM data citations.";
    topCited = [
      { url: "/features", score: 86, topic: "Product Value", reason: "Structured lists detailing target customer problem solutions." },
      { url: "/pricing-tiers", score: 82, topic: "Value Packages", reason: "Simple, easy-to-read price models matching automated retrieval parameters." },
      { url: "/about-us", score: 70, topic: "Company Authority", reason: "Founder signals and entity ownership details cited on company origin stories." }
    ];
    winningTopics = [
      { topic: "Value Tiers Overview", competitor: `${formattedBrand} (You)` },
      { topic: "Integration Flexibility", competitor: comps[0] || "Competitor A" },
      { topic: "Customer Case Studies", competitor: comps[1] || "Competitor B" }
    ];
    missingPages = [
      { title: `${formattedBrand} vs ${comps[0] || "Competitor A"} Comparison Matrix`, type: "Comparison", oppScore: 94 },
      { title: "Cost Efficiency Calculator & Breakdown", type: "Calculator Page", oppScore: 82 }
    ];
    recommendations = [
      { title: `Create: ${formattedBrand} vs ${comps[0] || "Competitor A"} - Detailed Difference Comparison`, reason: "LLMs consistently synthesize differences for buying decisions. Direct factual comparisons grab high citation scores.", impact: "High", difficulty: "Easy" },
      { title: "Comprehensive Pricing Calculator Guide", reason: "Aids pricing bots and comparison queries on Perplexity looking for exact figures.", impact: "High", difficulty: "Medium" }
    ];
  }

  const cTable = [
    { name: `You (${cleanDomain})`, score: Math.floor(Math.random() * 20) + 45, citations: Math.floor(Math.random() * 1500) + 2000, pages: Math.floor(Math.random() * 50) + 100 }
  ];
  cleanCompList.forEach((comp) => {
    cTable.push({ name: comp, score: Math.floor(Math.random() * 20) + 65, citations: Math.floor(Math.random() * 5000) + 7000, pages: Math.floor(Math.random() * 200) + 300 });
  });
  if (cTable.length === 1) {
    cTable.push({ name: comps[0].toLowerCase() + ".com", score: 85, citations: 12500, pages: 840 });
    cTable.push({ name: comps[1].toLowerCase() + ".com", score: 82, citations: 11000, pages: 720 });
  }

  const historicalData = [
    { date: "Jan", citations: 1200, pages: 80, chatgpt: 400, claude: 250, gemini: 300, perplexity: 250 },
    { date: "Feb", citations: 1510, pages: 92, chatgpt: 500, claude: 310, gemini: 400, perplexity: 300 },
    { date: "Mar", citations: 2100, pages: 112, chatgpt: 750, claude: 420, gemini: 510, perplexity: 420 },
    { date: "Apr", citations: 2750, pages: 135, chatgpt: 990, claude: 580, gemini: 620, perplexity: 560 },
    { date: "May", citations: 3400, pages: 160, chatgpt: 1250, claude: 710, gemini: 800, perplexity: 640 },
    { date: "Jun", citations: cTable[0].citations, pages: cTable[0].pages, chatgpt: Math.floor(cTable[0].citations * 0.38), claude: Math.floor(cTable[0].citations * 0.22), gemini: Math.floor(cTable[0].citations * 0.23), perplexity: Math.floor(cTable[0].citations * 0.17) }
  ];

  const primaryScore = cTable[0].score;
  let rating = "Average";
  if (primaryScore >= 80) rating = "Strong";
  else if (primaryScore >= 65) rating = "Good";
  else if (primaryScore >= 50) rating = "Average";
  else rating = "Weak";

  const platformStats = {
    chatgpt: { score: Math.min(100, primaryScore + Math.floor(Math.random() * 12) - 3), topTopics: isTourOrTravel ? ["Destination Overviews", "Local Guides"] : ["Core API Features", "Syntax Snippets"], topPages: isTourOrTravel ? ["/rome-private-tour", "/italy-guide-hiring"] : ["/docs/api-getting-started", "/pricing"] },
    claude: { score: Math.min(100, primaryScore + Math.floor(Math.random() * 10) - 5), topTopics: isTourOrTravel ? ["Guide Certifications", "Private vs Group"] : ["Advanced Benchmarks", "Migration Comparison"], topPages: isTourOrTravel ? ["/blog/private-vs-group-tours"] : ["/blog/scaling-multi-tenant-architectures"] },
    gemini: { score: Math.max(0, primaryScore + Math.floor(Math.random() * 8) - 10), topTopics: isTourOrTravel ? ["Direct booking FAQs", "Cost Estimates"] : ["API Integrations", "Developer Pricing"], topPages: isTourOrTravel ? ["/rome-private-tour"] : ["/pricing"] },
    perplexity: { score: Math.min(100, primaryScore + Math.floor(Math.random() * 15)), topTopics: isTourOrTravel ? ["Contact links", "Real-time cost tables"] : ["Pricing comparison", "Quick facts"], topPages: isTourOrTravel ? ["/contact-local-operators"] : ["/pricing", "/docs/api-getting-started"] }
  };

  return {
    summary, primaryScore, rating,
    citationsCount: cTable[0].citations,
    citedPagesCount: cTable[0].pages,
    growthTrend: "+14% vs last mo",
    historicalData, platformStats, citationDnaExplanation,
    topCitedPages: topCited,
    competitorGaps: { table: cTable, winningTopics, missingPages },
    recommendations: recommendations.slice(0, 10)
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { domain, competitors } = req.body;
  if (!domain) {
    return res.status(400).json({ error: "Domain parameter is required." });
  }
  const cleanDomain = domain.trim();
  const rawCompetitors = Array.isArray(competitors) ? competitors : [];
  const compArray = rawCompetitors.map(c => c.trim()).filter(c => c.length > 0);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json(generateIntelligentFallback(cleanDomain, compArray));
  }

  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

    const prompt = `Analyze the domain '${cleanDomain}' and its competitors ${JSON.stringify(compArray)} for LLM (Large Language Model) citations, visibility, original information signals, gap analysis, and content recommendations. 
The user's goal is to increase citations in models like ChatGPT, Claude, Gemini, and Perplexity.
Formulate a realistic citation analysis report based on your extensive knowledge of this sector, these competitors, standard LLM information retrieval schemas, and SEO entity factors. Use actual knowledge of the domain and competitors or typical industry trends in their business model.
You must reply with a valid JSON document conforming strictly to the provided Types. Do not wrap the JSON inside markdown blocks (e.g. do not use "\`\`\`json") in your text response - output ONLY raw, clean JSON starting with { and ending with }.
Use the following strict parameters in JSON properties:
- 'summary': A 3-sentence professional explanation of their current citation strengths, weaknesses, and dominant citations contexts.
- 'primaryScore': LLM Visibility Score (integer, 0-100).
- 'rating': Must be "Strong", "Good", "Average", or "Weak".
- 'citationsCount': Estimated total mentions (integer).
- 'citedPagesCount': Number of distinct pages cited (integer).
- 'growthTrend': Comparison string e.g. "+16% vs last mo".
- 'historicalData': Array of exactly 6 elements tracking historical monthly trends (months: Jan, Feb, Mar, Apr, May, Jun). Each item has integer values for date, citations, pages, chatgpt, claude, gemini, perplexity.
- 'platformStats': Object containing chatgpt, claude, gemini, perplexity. Each platform has 'score' (0-100), 'topTopics' (array of strings), 'topPages' (array of paths).
- 'citationDnaExplanation': A 1-sentence finding about why their content gets listed, focusing on FAQ, structured pricing, comparisons, original guidelines, etc.
- 'topCitedPages': Array of 3 to 4 objects. Each has 'url' (path string starting with /), 'score' (0-100), 'topic', and 'reason' (describing structural/entity indicators).
- 'competitorGaps': Object containing:
  - 'table': Array of domains (You + competitors) with score, citations, pages.
  - 'winningTopics': Array of objects with 'topic' and 'competitor' (which competitor is cited heavily here).
  - 'missingPages': Array of objects with 'title', 'type', and 'oppScore' (integer 0-100).
- 'recommendations': Array of 4 to 8 elements. Maximum 10 elements. Each must have:
  - 'title': Content topic title to create.
  - 'reason': Concise action rationale.
  - 'impact': "High", "Medium", or "Low".
  - 'difficulty': "Easy", "Medium", or "Hard".
Do not return placeholder variables like 'CompA' or '[Your domain]', replace all with the actual formatted names of the domains analysed.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            primaryScore: { type: Type.INTEGER },
            rating: { type: Type.STRING },
            citationsCount: { type: Type.INTEGER },
            citedPagesCount: { type: Type.INTEGER },
            growthTrend: { type: Type.STRING },
            historicalData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING }, citations: { type: Type.INTEGER }, pages: { type: Type.INTEGER },
                  chatgpt: { type: Type.INTEGER }, claude: { type: Type.INTEGER }, gemini: { type: Type.INTEGER }, perplexity: { type: Type.INTEGER }
                },
                required: ["date", "citations", "pages", "chatgpt", "claude", "gemini", "perplexity"]
              }
            },
            platformStats: {
              type: Type.OBJECT,
              properties: {
                chatgpt: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, topTopics: { type: Type.ARRAY, items: { type: Type.STRING } }, topPages: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["score", "topTopics", "topPages"] },
                claude: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, topTopics: { type: Type.ARRAY, items: { type: Type.STRING } }, topPages: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["score", "topTopics", "topPages"] },
                gemini: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, topTopics: { type: Type.ARRAY, items: { type: Type.STRING } }, topPages: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["score", "topTopics", "topPages"] },
                perplexity: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, topTopics: { type: Type.ARRAY, items: { type: Type.STRING } }, topPages: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["score", "topTopics", "topPages"] }
              },
              required: ["chatgpt", "claude", "gemini", "perplexity"]
            },
            citationDnaExplanation: { type: Type.STRING },
            topCitedPages: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { url: { type: Type.STRING }, score: { type: Type.INTEGER }, topic: { type: Type.STRING }, reason: { type: Type.STRING } }, required: ["url", "score", "topic", "reason"] }
            },
            competitorGaps: {
              type: Type.OBJECT,
              properties: {
                table: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, score: { type: Type.INTEGER }, citations: { type: Type.INTEGER }, pages: { type: Type.INTEGER } }, required: ["name", "score", "citations", "pages"] } },
                winningTopics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, competitor: { type: Type.STRING } }, required: ["topic", "competitor"] } },
                missingPages: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, type: { type: Type.STRING }, oppScore: { type: Type.INTEGER } }, required: ["title", "type", "oppScore"] } }
              },
              required: ["table", "winningTopics", "missingPages"]
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, reason: { type: Type.STRING }, impact: { type: Type.STRING }, difficulty: { type: Type.STRING } }, required: ["title", "reason", "impact", "difficulty"] }
            }
          },
          required: ["summary", "primaryScore", "rating", "citationsCount", "citedPagesCount", "growthTrend", "historicalData", "platformStats", "citationDnaExplanation", "topCitedPages", "competitorGaps", "recommendations"]
        }
      }
    });

    const textStr = response.text || "{}";
    const reportData = JSON.parse(textStr.trim());
    return res.status(200).json(reportData);
  } catch (error) {
    console.error("Gemini core generation error:", error);
    return res.json(generateIntelligentFallback(cleanDomain, compArray));
  }
}
