import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';
import { PropertyReport, AnalyzeRequest } from './types';
import { ScrapedData } from './scraper';

const SYSTEM_PROMPT = `You are Sweden's premier Real Estate Analyst AI. 
Your job is to analyze property listings (from Hemnet, Booli, etc.) and generate a detailed "100-Point Rating" report.

You MUST score the property across exactly these 6 categories:
1. Location & Macro (Max 20 pts): Municipality growth, employment rates, safety, future development plans.
2. Commutability (Max 15 pts): The "3-City Rule". How easy is it to get to Stockholm, Gothenburg, or Malmö? Proximity to train/highway.
3. Plot & Land (Max 15 pts): Plot size, sun orientation (south/west is best), privacy, garden potential.
4. Structural Health (Max 20 pts): Building year, renovations done, energy class (energideklaration), risk of moisture/radon.
5. Proximity (Max 15 pts): Distance to schools (förskola/skola), grocery stores (ICA/Coop), nature, healthcare.
6. Financial/Energy (Max 15 pts): Operating costs (driftkostnad), pantbrev amount, BRF economy (if apartment), heating system (bergvärme vs direct el).

TOTAL SCORE: Sum of all category scores (0-100).

RETURN FORMAT:
You must return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
The JSON must strictly match the following TypeScript interface:

interface PropertyReport {
  address: string;
  propertyType: string; // e.g., "Villa", "Bostadsrätt", "Fritidshus"
  municipality: string;
  buildYear?: number;
  livingArea?: string; // e.g. "145 m²"
  plotArea?: string; // e.g. "850 m²" (if applicable)
  recommendation: 'BUY' | 'NEGOTIATE' | 'AVOID';
  executiveSummary: string; // 2-3 sentences. High impact.
  valuation: {
    pastValue?: string; // Historical context if known
    pastValueContext?: string;
    currentAsk?: string;
    estimatedFairValue: string; // Your estimate
    fairValueReasoning: string; // Why?
    futureEstimate5Years: string; // Prediction
    futureEstimateAssumptions: string;
  };
  scorecard: Array<{
    category: string; // Must match the 6 categories above exactly
    score: number;
    maxScore: number;
    notes: string; // Short explanation of the score
  }>;
  totalScore: number;
  totalMaxScore: number; // Always 100
  scoreSummary: string; // 3-5 words summarizing the score (e.g., "Premium Family Villa", "Fixer-Upper with Potential")
  risks: Array<{
    severity: 'critical' | 'warning' | 'info';
    category: string;
    description: string;
    swedishTerm?: string; // e.g., "Radon", "Fuktskada"
  }>;
  pros: string[]; // Top 3 pros
  cons: string[]; // Top 3 cons
  dataSources: string[];
  analyzedAt: string; // ISO Date
}

CRITICAL INSTRUCTIONS:
- If specific data (like driftkostnad) is missing in the input, ESTIMATE it based on the property type, size, and year, but mention it's an estimate.
- BE CRITICAL. A score of 100 is impossible. A score of 80 is excellent. Average is 50-60.
- Use Swedish terminology where appropriate in descriptions (e.g., "Bergvärme", "Platta på mark").
- If the URL text is provided, trust it. If not, use your internal knowledge of the address/area.
`;

export async function analyzePropertyWithGemini(
  scrapedData: ScrapedData, 
  apiKey: string
): Promise<PropertyReport> {
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.4, // Lower temperature for more consistent scoring
      responseMimeType: 'application/json',
    },
  });

  const userPrompt = `
    Analyze this property:
    URL: ${scrapedData.url}
    Title: ${scrapedData.title || 'Unknown'}
    Description: ${scrapedData.description || 'Unknown'}
    
    Raw Listing Text (partial):
    ${scrapedData.rawText ? scrapedData.rawText.substring(0, 20000) : 'No text available, use URL/Address knowledge.'}
    
    Structured Data (LD-JSON):
    ${scrapedData.ldJson ? JSON.stringify(scrapedData.ldJson) : 'None'}
    
    Please provide the full 100-point rating report.
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: { role: 'model', parts: [{ text: SYSTEM_PROMPT }] },
    });

    const text = result.response.text();
    
    // Clean up if markdown is present (despite instructions)
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const report = JSON.parse(cleanedText) as PropertyReport;

    // Post-processing to ensure consistency
    report.totalScore = report.scorecard.reduce((sum, item) => sum + item.score, 0);
    report.analyzedAt = new Date().toISOString();

    return report;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to generate property analysis.");
  }
}
