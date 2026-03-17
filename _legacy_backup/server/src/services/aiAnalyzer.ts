import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PropertyReport, AnalyzeRequest } from '../types/report.js';

const SYSTEM_PROMPT = `You are an expert Swedish real estate analyst. When given a property address and type, you must:

1. IDENTIFY the property — determine the municipality, locality, building year, size, and any other known details.
2. RESEARCH market data — estimate current value, historical sale prices, comparable properties, and operating costs.
3. ASSESS risks — identify structural, financial, and location-based risks.
4. SCORE the property — rate it across 6 categories (each with a specific max score):
   - Location (Macro) — out of 20: Economic growth, employment, services in the area
   - Commutability (3 Cities) — out of 15: Access to major Swedish cities by train/car
   - Plot & Land — out of 15: Plot size, orientation, outdoor spaces
   - Structural Health — out of 20: Building condition, known issues, maintenance
   - Proximity — out of 15: Schools, transit, shopping, healthcare nearby
   - Financial/Energy — out of 15: Operating costs, energy class, heating system

5. PROVIDE a clear recommendation: BUY, NEGOTIATE, or AVOID.

Return your analysis as a JSON object (and NOTHING else — no markdown, no code fences) with this exact structure:
{
  "address": "Full property address",
  "propertyType": "Type of property",
  "municipality": "Municipality name",
  "buildYear": 1975,
  "livingArea": "89 m²",
  "recommendation": "NEGOTIATE",
  "executiveSummary": "2-4 sentence summary with clear guidance. Be direct and actionable.",
  "valuation": {
    "pastValue": "Amount or description",
    "pastValueContext": "Context about historical value",
    "currentAsk": "Current asking price",
    "estimatedFairValue": "Your estimated fair value",
    "fairValueReasoning": "Why this is the fair value",
    "futureEstimate5Years": "Estimated value in 5 years",
    "futureEstimateAssumptions": "Assumptions behind the estimate"
  },
  "scorecard": [
    { "category": "Location (Macro)", "score": 10, "maxScore": 20, "notes": "Detailed notes..." },
    { "category": "Commutability (3 Cities)", "score": 10, "maxScore": 15, "notes": "..." },
    { "category": "Plot & Land", "score": 8, "maxScore": 15, "notes": "..." },
    { "category": "Structural Health", "score": 8, "maxScore": 20, "notes": "..." },
    { "category": "Proximity", "score": 12, "maxScore": 15, "notes": "..." },
    { "category": "Financial/Energy", "score": 6, "maxScore": 15, "notes": "..." }
  ],
  "totalScore": 54,
  "totalMaxScore": 100,
  "scoreSummary": "A short label like 'Budget Project with Heavy Carrying Costs'",
  "risks": [
    { "severity": "critical", "category": "Roof & Attic", "description": "Description of the risk", "swedishTerm": "rötskador" },
    { "severity": "warning", "category": "Bathroom", "description": "Description of the warning", "swedishTerm": "" }
  ],
  "pros": [
    "First pro",
    "Second pro"
  ],
  "cons": [
    "First con",
    "Second con"
  ],
  "dataSources": [
    "Hemnet.se",
    "Booli.se",
    "Public municipality data"
  ]
}

IMPORTANT RULES:
- Be honest about what you know vs. estimate. If exact data isn't available, provide reasonable estimates based on Swedish market knowledge.
- Always include Swedish building/real estate terminology where relevant (e.g., besiktningsprotokoll, driftkostnad, boarea).
- The totalScore MUST equal the sum of all scorecard scores.
- All scores must be within their maxScore range.
- Include at least 3 risks, 3 pros, and 3 cons.
- Be specific to the actual location — reference the real municipality, train connections, and local amenities.
- Operating costs (driftkostnad) should reflect typical Swedish values for the property type and area.`;

export async function analyzeProperty(request: AnalyzeRequest): Promise<PropertyReport> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please set it in the .env file. ' +
      'Get a key at https://aistudio.google.com/apikey'
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  });

  // Build the user prompt
  let userPrompt = `Analyze this Swedish property:\n\n`;
  userPrompt += `**Address:** ${request.address}\n`;
  userPrompt += `**Property Type:** ${request.propertyType}\n`;

  if (request.hemnetUrl) {
    userPrompt += `**Hemnet URL:** ${request.hemnetUrl}\n`;
  }

  if (request.additionalContext) {
    userPrompt += `\n**Additional Context:** ${request.additionalContext}\n`;
  }

  userPrompt += `\nProvide a comprehensive property review in the JSON format specified in your instructions.`;

  console.log('   🤖 Sending to Gemini...');

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { role: 'model', parts: [{ text: SYSTEM_PROMPT }] },
    });

    const response = result.response;
    const text = response.text();

    console.log('   ✅ Gemini response received');

    // Parse the JSON response
    let report: PropertyReport;
    try {
      report = JSON.parse(text) as PropertyReport;
    } catch (parseError) {
      // Try to extract JSON from the response if it's wrapped in markdown
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        report = JSON.parse(jsonMatch[0]) as PropertyReport;
      } else {
        console.error('Failed to parse Gemini response:', text.substring(0, 500));
        throw new Error('Failed to parse AI response. The model returned an invalid format.');
      }
    }

    // Add metadata
    report.analyzedAt = new Date().toISOString();

    // Validate scorecard totals
    if (report.scorecard && report.scorecard.length > 0) {
      const calculatedTotal = report.scorecard.reduce((sum, cat) => sum + cat.score, 0);
      report.totalScore = calculatedTotal;
      report.totalMaxScore = report.scorecard.reduce((sum, cat) => sum + cat.maxScore, 0);
    }

    return report;
  } catch (error: any) {
    console.error('Gemini API Error:', error?.message || error);

    // Check for 429 Too Many Requests / Quota Exceeded
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
      throw new Error(
        'Google Gemini API Free Tier Quota Exceeded (429 Too Many Requests). ' +
        'Please wait a minute before trying again, or upgrade your Google AI Studio project to a paid plan. ' +
        'Check your usage at: https://aistudio.google.com/app/usage'
      );
    }

    // Re-throw other errors
    throw error;
  }
}
