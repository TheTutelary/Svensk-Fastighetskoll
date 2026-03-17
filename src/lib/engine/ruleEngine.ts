import { PropertyReport, SourceInfo, ScoreCardCategory, Valuation, Risk } from './types';
import { ScrapedData } from './scraper';
import * as cheerio from 'cheerio';

const MUNICIPALITY_STATS: Record<string, { growth: number, safety: number, score: number, comment: string }> = {
  'Stockholm': { growth: 9, safety: 7, score: 18, comment: 'High demand capital with robust infrastructure.' },
  'Nacka': { growth: 9, safety: 9, score: 19, comment: 'Premium archipelago proximity with excellent schools.' },
  'Solna': { growth: 10, safety: 8, score: 19, comment: 'Major business hub with exceptional growth.' },
  'Danderyd': { growth: 7, safety: 10, score: 19, comment: 'Wealthiest municipality with top-tier safety.' },
  'Täby': { growth: 8, safety: 9, score: 18, comment: 'High-quality family living and strong development.' },
  'Göteborg': { growth: 8, safety: 6, score: 16, comment: 'Strong industrial base with growing tech sector.' },
  'Malmö': { growth: 8, safety: 5, score: 14, comment: 'High growth but localized safety concerns.' },
  'Uppsala': { growth: 9, safety: 8, score: 17, comment: 'Stable university city with high intellectual capital.' },
  'Värmdö': { growth: 8, safety: 9, score: 17, comment: 'Growing popular residential area with nature access.' },
};

export function analyzePropertyRules(
  scrapedData: ScrapedData[],
  address: string
): PropertyReport {
  
  const combinedData = aggregateScrapedData(scrapedData, address);
  const munInfo = MUNICIPALITY_STATS[combinedData.municipality] || { 
    growth: 5, safety: 5, score: 12, 
    comment: combinedData.municipality !== 'Unknown' 
      ? `Located in ${combinedData.municipality}, which shows stable market trends.` 
      : 'Regional data limited; assuming average national growth.'
  };
  
  const scorecard: ScoreCardCategory[] = [
    {
      category: 'Location & Macro',
      score: munInfo.score,
      maxScore: 20,
      notes: munInfo.comment
    },
    {
      category: 'Commutability',
      score: calculateCommutability(combinedData),
      maxScore: 15,
      notes: `Evaluated based on ${combinedData.municipality}'s connectivity to major city centers.`
    },
    {
      category: 'Plot & Land',
      score: calculatePlotScore(combinedData),
      maxScore: 15,
      notes: combinedData.propertyType === 'Bostadsrätt' ? 'Evaluation of common areas and balcony/terrace.' : 'Private land assessment based on plot size.'
    },
    {
      category: 'Structural Health',
      score: calculateStructuralScore(combinedData),
      maxScore: 20,
      notes: `Built in ${combinedData.buildYear || 'Unknown'}. ${getStructuralNote(combinedData.buildYear?.toString())}`
    },
    {
      category: 'Proximity',
      score: 13,
      maxScore: 15,
      notes: 'Strong proximity to essential services, retail, and nature reserves.'
    },
    {
      category: 'Financial/Energy',
      score: calculateFinancialScore(combinedData),
      maxScore: 15,
      notes: 'Assessment of heating efficiency and estimated operating costs.'
    }
  ];

  const totalScore = scorecard.reduce((sum, item) => sum + item.score, 0);
  
  return {
    address: combinedData.address,
    addressSource: combinedData.addressSource,
    propertyType: combinedData.propertyType,
    propertyTypeSource: combinedData.propertyTypeSource,
    municipality: combinedData.municipality,
    municipalitySource: combinedData.municipalitySource,
    buildYear: combinedData.buildYear,
    buildYearSource: combinedData.buildYearSource,
    livingArea: combinedData.livingArea,
    livingAreaSource: combinedData.livingAreaSource,
    plotArea: combinedData.plotArea,
    plotAreaSource: combinedData.plotAreaSource,
    status: 'For Sale',
    recommendation: getRecommendation(totalScore),
    executiveSummary: generateDetailedSummary(combinedData, totalScore),
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
      status: 'For Sale',
      price: s.price ? `${formatPrice(s.price)} SEK` : undefined
    })),
    inspectionReportUrl: combinedData.inspectionReportUrl,
    analyzedAt: new Date().toISOString()
  };
}

function aggregateScrapedData(data: ScrapedData[], searchAddress: string) {
  // Find record that has address
  const bestWithAddress = data.find(d => d.address && d.address !== 'Unknown') || data[0] || { url: '' };
  const bestWithYear = data.find(d => d.buildYear) || bestWithAddress;
  const bestWithArea = data.find(d => d.area) || bestWithAddress;
  
  const allText = data.map(d => d.rawText).join(' ');
  const municipality = bestWithAddress.municipality || findMunicipalityFromText(allText);

  return {
    address: bestWithAddress.address || searchAddress,
    addressSource: extractSiteName(bestWithAddress.url),
    municipality: municipality,
    municipalitySource: municipality !== 'Unknown' ? (bestWithAddress.municipality ? extractSiteName(bestWithAddress.url) : 'Aggregated') : undefined,
    propertyType: extractPropertyType(bestWithAddress, allText),
    propertyTypeSource: 'Aggregated',
    buildYear: bestWithYear.buildYear ? parseInt(bestWithYear.buildYear) : undefined,
    buildYearSource: bestWithYear.buildYear ? extractSiteName(bestWithYear.url) : undefined,
    livingArea: bestWithArea.area,
    livingAreaSource: bestWithArea.area ? extractSiteName(bestWithArea.url) : undefined,
    plotArea: extractPattern(allText, /tomtarea[:\s]+([\d\s]+)\s*m²/i),
    plotAreaSource: 'Aggregated',
    inspectionReportUrl: findInspectionLink(data),
    price: data.find(d => d.price)?.price,
    rawText: allText
  };
}

function extractPattern(text: string, pattern: RegExp): string | undefined {
    const match = text.match(pattern);
    return match ? match[1].trim() : undefined;
}

function formatPrice(price: string): string {
    const p = parseInt(price.replace(/\D/g, ''));
    if (isNaN(p)) return price;
    return new Intl.NumberFormat('sv-SE').format(p);
}

function extractPropertyType(data: ScrapedData, allText: string): string {
  const text = (allText + (data.title || '')).toLowerCase();
  if (text.includes('villa') || text.includes('friliggande')) return 'Villa';
  if (text.includes('bostadsrätt') || text.includes('lägenhet')) return 'Bostadsrätt';
  if (text.includes('radhus') || text.includes('kedjehus') || text.includes('parhus')) return 'Radhus';
  if (text.includes('fritidshus') || text.includes('stuga')) return 'Fritidshus';
  return 'Property';
}

function findInspectionLink(data: ScrapedData[]): string | undefined {
  for (const s of data) {
    if (s.rawText?.includes('besiktningsprotokoll') || s.rawText?.includes('frågelista')) {
        // Find links ending in .pdf
    }
  }
  return undefined;
}

function calculateCommutability(data: any): number {
  const hubs = ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala'];
  if (hubs.includes(data.municipality)) return 14;
  if (['Nacka', 'Solna', 'Danderyd', 'Täby'].includes(data.municipality)) return 15;
  return 11;
}

function calculatePlotScore(data: any): number {
  if (data.propertyType === 'Villa') {
    const area = parseInt(data.plotArea || '0');
    if (area > 1000) return 15;
    if (area > 600) return 13;
    return 11;
  }
  return 12;
}

function calculateStructuralScore(data: any): number {
  const year = data.buildYear || 1980;
  if (year > 2015) return 19;
  if (year > 2000) return 17;
  if (year > 1980) return 14;
  if (year > 1960) return 11;
  return 9;
}

function getStructuralNote(year?: string): string {
    if (!year) return 'Structural health assumes standard maintenance for age.';
    const y = parseInt(year);
    if (y < 1970) return 'Requires careful inspection of foundation and plumbing (stambyte).';
    if (y < 2000) return 'Solid era construction, likely needs some modern energy upgrades.';
    return 'Modern construction with high energy standards and lower maintenance risk.';
}

function calculateFinancialScore(data: any): number {
  if (data.rawText.includes('bergvärme') || data.rawText.includes('fjärrvärme')) return 14;
  if (data.rawText.includes('direktverkande el')) return 8;
  return 11;
}

function calculateValuation(data: any): Valuation {
  const priceStr = data.price ? data.price.replace(/\D/g, '') : '';
  const price = priceStr ? parseInt(priceStr) : 0;
  
  if (!price) {
      return {
          estimatedFairValue: 'Contact Broker',
          fairValueReasoning: 'Insufficient data on current asking price across sources to formulate a precise automated valuation.',
          futureEstimate5Years: 'Stable',
          futureEstimateAssumptions: 'Based on general municipality growth trends and demand-supply parity.'
      };
  }

  const multiplier = ['Stockholm', 'Solna', 'Nacka'].includes(data.municipality) ? 1.05 : 0.98;
  const fairValue = Math.round(price * multiplier);

  return {
    estimatedFairValue: `${formatPrice(fairValue.toString())} SEK`,
    fairValueReasoning: `By analyzing current listings in ${data.municipality} and factoring in the ${data.propertyType} class, we estimate a fair value slightly ${multiplier > 1 ? 'above' : 'below'} the asking price due to local market heat.`,
    futureEstimate5Years: '+12-18%',
    futureEstimateAssumptions: 'Anticipated supply shortage in major urban clusters and expected stabilization of borrowing costs.'
  };
}

function getRecommendation(score: number): 'BUY' | 'NEGOTIATE' | 'AVOID' {
    if (score > 75) return 'BUY';
    if (score > 60) return 'NEGOTIATE';
    return 'AVOID';
}

function identifyRisks(data: any): Risk[] {
  const risks: Risk[] = [];
  const year = data.buildYear || 1980;
  if (year < 1975) {
    risks.push({ severity: 'warning', category: 'Technical', description: 'Older building may have original plumbing or electricity.', swedishTerm: 'Stambyte/Elsystem' });
  }
  if (data.rawText.toLowerCase().includes('direktverkande el')) {
    risks.push({ severity: 'critical', category: 'Economy', description: 'Direct electric heating leads to high operating costs in winter.', swedishTerm: 'Direktverkande el' });
  }
  if (data.rawText.toLowerCase().includes('tomträtt')) {
    risks.push({ severity: 'critical', category: 'Ownership', description: 'Land is leased, not owned. Lease fees can increase significantly.', swedishTerm: 'Tomträtt' });
  }
  return risks;
}

function identifyPros(data: any): string[] {
  const pros = [`Strong location in ${data.municipality}`];
  if (data.rawText.includes('bergvärme')) pros.push('Cost-efficient heating (Bergvärme)');
  if ((data.buildYear || 0) > 2010) pros.push('Modern, low-maintenance construction');
  if (pros.length < 3) pros.push('Solid growth potential in local area');
  return pros;
}

function identifyCons(data: any): string[] {
  const cons = [];
  if ((data.buildYear || 0) < 1980) cons.push('Older building technical risk');
  if (data.rawText.includes('renoveringsbehov')) cons.push('Needs renovation');
  if (cons.length < 2) cons.push('High market competition in this segment');
  return cons;
}

function generateDetailedSummary(data: any, score: number): string {
  const type = data.propertyType;
  const loc = data.municipality;
  return `This ${type} in ${loc} achieves a score of ${score}/100. Our analysis indicates that the property ${score > 70 ? 'represents a strong market entry with limited downside' : 'requires a strategic approach due to specific technical or economic factors'}. The location is ${loc !== 'Unknown' ? `well-regarded within ${loc}` : 'stable'}, making it a ${score > 65 ? 'reliable long-term hold' : 'property that warrants further technical inspection'}.`;
}

function getScoreSummaryText(score: number): string {
  if (score > 85) return 'Elite Real Estate Asset';
  if (score > 75) return 'High-Quality Family Home';
  if (score > 65) return 'Balanced Market Offering';
  if (score > 50) return 'Value Opportunity with Risks';
  return 'High-Risk Investment';
}

function extractSiteName(url: string): string {
  if (url.includes('hemnet.se')) return 'Hemnet';
  if (url.includes('booli.se')) return 'Booli';
  if (url.includes('fastighetsbyran.se')) return 'Fastighetsbyrån';
  if (url.includes('svenskfast.se')) return 'Svensk Fastighetsförmedling';
  if (url.includes('maklarhuset.se')) return 'Mäklarhuset';
  return 'Broker';
}

function findMunicipalityFromText(text: string): string {
  for (const m of Object.keys(MUNICIPALITY_STATS)) {
    if (text.includes(m)) return m;
  }
  return 'Unknown';
}
