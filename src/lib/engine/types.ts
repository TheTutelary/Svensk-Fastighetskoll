export interface ScoreCardCategory {
  category: string;
  score: number;
  maxScore: number;
  notes: string;
}

export interface Valuation {
  pastValue?: string;
  pastValueContext?: string;
  currentAsk?: string;
  estimatedFairValue: string;
  fairValueReasoning: string;
  futureEstimate5Years: string;
  futureEstimateAssumptions: string;
}

export interface Risk {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  description: string;
  swedishTerm?: string;
}

export interface SourceInfo {
  site: string;
  url: string;
  status: 'For Sale' | 'Coming Soon' | 'Sold' | 'Unknown';
  price?: string;
}

export interface PropertyReport {
  address: string;
  propertyType: string;
  municipality: string;
  buildYear?: number;
  livingArea?: string;
  plotArea?: string;
  status: 'For Sale' | 'Coming Soon' | 'Sold' | 'Unknown';
  recommendation: 'BUY' | 'NEGOTIATE' | 'AVOID';
  executiveSummary: string;
  valuation: Valuation;
  scorecard: ScoreCardCategory[];
  totalScore: number;
  totalMaxScore: number;
  scoreSummary: string;
  risks: Risk[];
  pros: string[];
  cons: string[];
  dataSources: SourceInfo[];
  inspectionReportUrl?: string;
  analyzedAt: string;
}

export interface AnalyzeRequest {
  url?: string;
  address?: string;
}

export interface SearchResult {
  address: string;
  url: string;
  site: string;
  type?: string;
}
