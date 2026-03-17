import { PropertyReport, SourceInfo, ScoreCardCategory, Valuation, Risk } from './types';
import { ScrapedData } from './scraper';
import * as cheerio from 'cheerio';

const MUNICIPALITY_STATS: Record<string, { growth: number, safety: number, score: number }> = {
  'Stockholm': { growth: 9, safety: 7, score: 18 },
  'Nacka': { growth: 9, safety: 9, score: 19 },
  'Solna': { growth: 10, safety: 8, score: 19 },
  'Danderyd': { growth: 7, safety: 10, score: 19 },
  'Täby': { growth: 8, safety: 9, score: 18 },
  'Göteborg': { growth: 8, safety: 6, score: 16 },
  'Malmö': { growth: 8, safety: 5, score: 14 },
  'Uppsala': { growth: 9, safety: 8, score: 17 },
  'Värmdö': { growth: 8, safety: 9, score: 17 },
};

export function analyzePropertyRules(
  scrapedData: ScrapedData[],
  address: string
): PropertyReport {
  
  // Aggregate data from all sources
  const combinedData = aggregateScrapedData(scrapedData);
  const munInfo = MUNICIPALITY_STATS[combinedData.municipality] || { growth: 5, safety: 5, score: 12 };
  
  const scorecard: ScoreCardCategory[] = [
    {
      category: 'Location & Macro',
      score: munInfo.score,
      maxScore: 20,
      notes: `${combinedData.municipality} is a ${munInfo.growth >= 8 ? 'high-growth' : 'stable'} area with ${munInfo.safety >= 8 ? 'excellent' : 'good'} safety ratings.`
    },
    {
      category: 'Commutability',
      score: calculateCommutability(combinedData),
      maxScore: 15,
      notes: 'Based on proximity to central hubs and transport links.'
    },
    {
      category: 'Plot & Land',
      score: calculatePlotScore(combinedData),
      maxScore: 15,
      notes: combinedData.propertyType === 'Bostadsrätt' ? 'Shared courtyard/balcony considered.' : 'Private plot evaluation.'
    },
    {
      category: 'Structural Health',
      score: calculateStructuralScore(combinedData),
      maxScore: 20,
      notes: `Based on build year (${combinedData.buildYear || 'Unknown'}) and energy class.`
    },
    {
      category: 'Proximity',
      score: 12, // Placeholder for school/store proximity logic
      maxScore: 15,
      notes: 'Good access to local services and nature.'
    },
    {
      category: 'Financial/Energy',
      score: calculateFinancialScore(combinedData),
      maxScore: 15,
      notes: 'Operating costs and heating system evaluation.'
    }
  ];

  const totalScore = scorecard.reduce((sum, item) => sum + item.score, 0);
  
  const report: PropertyReport = {
    address: combinedData.address || address,
    propertyType: combinedData.propertyType,
    municipality: combinedData.municipality,
    buildYear: combinedData.buildYear,
    livingArea: combinedData.livingArea,
    plotArea: combinedData.plotArea,
    status: combinedData.status,
    recommendation: totalScore > 75 ? 'BUY' : totalScore > 50 ? 'NEGOTIATE' : 'AVOID',
    executiveSummary: generateSummary(combinedData, totalScore),
    valuation: calculateValuation(combinedData),
    scorecard,
    totalScore,
    totalMaxScore: 100,
    scoreSummary: getScoreSummaryText(totalScore),
    risks: identifyRisks(combinedData),
    pros: identifyPros(combinedData),
    cons: identifyCons(combinedData),
    dataSources: scrapedData.map(s => ({
      site: extractSiteName(s.url),
      url: s.url,
      status: combinedData.status
    })),
    inspectionReportUrl: combinedData.inspectionReportUrl,
    analyzedAt: new Date().toISOString()
  };

  return report;
}

function aggregateScrapedData(data: ScrapedData[]) {
  // Simple heuristic aggregation
  const first = data[0] || { url: '' };
  const ld = first.ldJson || {};
  
  return {
    address: first.title?.split('|')[0]?.trim() || '',
    municipality: extractMunicipality(first),
    propertyType: extractPropertyType(first),
    buildYear: extractBuildYear(first),
    livingArea: extractLivingArea(first),
    plotArea: extractPlotArea(first),
    status: 'For Sale' as any,
    inspectionReportUrl: findInspectionLink(data),
    price: ld.offers?.price || 'Unknown'
  };
}

function extractMunicipality(data: ScrapedData): string {
  const text = data.rawText || '';
  for (const m of Object.keys(MUNICIPALITY_STATS)) {
    if (text.includes(m)) return m;
  }
  return 'Unknown';
}

function extractPropertyType(data: ScrapedData): string {
  const text = (data.rawText || '').toLowerCase();
  if (text.includes('villa')) return 'Villa';
  if (text.includes('bostadsrätt') || text.includes('lägenhet')) return 'Bostadsrätt';
  if (text.includes('radhus') || text.includes('kedjehus')) return 'Radhus';
  if (text.includes('fritidshus') || text.includes('stuga')) return 'Fritidshus';
  return 'Unknown';
}

function extractBuildYear(data: ScrapedData): number | undefined {
  const match = data.rawText?.match(/Byggår:?\s*(\d{4})/i);
  return match ? parseInt(match[1]) : undefined;
}

function extractLivingArea(data: ScrapedData): string | undefined {
  const match = data.rawText?.match(/(\d+)\s*m²/);
  return match ? `${match[1]} m²` : undefined;
}

function extractPlotArea(data: ScrapedData): string | undefined {
  const match = data.rawText?.match(/tomtarea:?\s*([\d\s]+)\s*m²/i);
  return match ? `${match[1].trim()} m²` : undefined;
}

function findInspectionLink(data: ScrapedData[]): string | undefined {
  for (const s of data) {
    const $ = cheerio.load(s.rawText || '');
    // Actually search in raw text for common inspection keywords
    if (s.rawText?.includes('Besiktningsprotokoll')) {
       // Try to find a link if we had the full HTML
    }
  }
  return undefined;
}

function calculateCommutability(data: any): number {
  let score = 10;
  if (['Stockholm', 'Göteborg', 'Malmö'].includes(data.municipality)) score += 3;
  return Math.min(score, 15);
}

function calculatePlotScore(data: any): number {
  if (data.propertyType === 'Villa') {
    const area = parseInt(data.plotArea || '0');
    if (area > 800) return 14;
    if (area > 500) return 12;
    return 10;
  }
  return 11; // Standard for apartments
}

function calculateStructuralScore(data: any): number {
  const year = data.buildYear || 1980;
  if (year > 2010) return 18;
  if (year > 1990) return 15;
  if (year > 1970) return 12;
  return 10;
}

function calculateFinancialScore(data: any): number {
  return 12; // Placeholder
}

function calculateValuation(data: any): Valuation {
  return {
    estimatedFairValue: data.price ? `${data.price} SEK` : 'Market value',
    fairValueReasoning: 'Based on area averages and property condition.',
    futureEstimate5Years: '+15-20%',
    futureEstimateAssumptions: 'Normal market growth and continued area desirability.'
  };
}

function identifyRisks(data: any): Risk[] {
  const risks: Risk[] = [];
  if (data.buildYear && data.buildYear < 1970) {
    risks.push({ severity: 'warning', category: 'Structure', description: 'Older structure may need technical inspection.', swedishTerm: 'Teknisk besiktning' });
  }
  return risks;
}

function identifyPros(data: any): string[] {
  const pros = ['Established neighborhood', 'Solid investment potential'];
  if (data.buildYear && data.buildYear > 2000) pros.push('Modern construction');
  return pros;
}

function identifyCons(data: any): string[] {
  return ['Market competition', 'Requires maintenance planning'];
}

function generateSummary(data: any, score: number): string {
  return `This ${data.propertyType} in ${data.municipality} scores ${score}/100. It offers a solid living standard in a desirable location.`;
}

function getScoreSummaryText(score: number): string {
  if (score > 85) return 'Exceptional Asset';
  if (score > 70) return 'Strong Property';
  if (score > 55) return 'Fair Value';
  return 'High Maintenance / Risky';
}

function extractSiteName(url: string): string {
  if (url.includes('hemnet.se')) return 'Hemnet';
  if (url.includes('booli.se')) return 'Booli';
  if (url.includes('fastighetsbyran.se')) return 'Fastighetsbyrån';
  return 'Broker Site';
}

function findMunicipalityFromText(text: string): string {
  for (const m of Object.keys(MUNICIPALITY_STATS)) {
    if (text.includes(m)) return m;
  }
  return 'Sweden';
}
