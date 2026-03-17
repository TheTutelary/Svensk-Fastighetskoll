/**
 * Shared TypeScript types for the frontend
 * Mirrors the server types for the PropertyReport
 */

export interface ValuationSnapshot {
    pastValue: string;
    pastValueContext: string;
    currentAsk: string;
    estimatedFairValue: string;
    fairValueReasoning: string;
    futureEstimate5Years: string;
    futureEstimateAssumptions: string;
}

export interface ScoreCategory {
    category: string;
    score: number;
    maxScore: number;
    notes: string;
}

export type RiskSeverity = 'critical' | 'warning';

export interface RiskItem {
    severity: RiskSeverity;
    category: string;
    description: string;
    swedishTerm?: string;
}

export type Recommendation = 'BUY' | 'NEGOTIATE' | 'AVOID';

export interface PropertyReport {
    address: string;
    propertyType: string;
    municipality?: string;
    buildYear?: number;
    livingArea?: string;
    recommendation: Recommendation;
    executiveSummary: string;
    valuation: ValuationSnapshot;
    scorecard: ScoreCategory[];
    totalScore: number;
    totalMaxScore: number;
    scoreSummary: string;
    risks: RiskItem[];
    pros: string[];
    cons: string[];
    analyzedAt: string;
    dataSources: string[];
}

export interface AnalyzeRequest {
    address: string;
    propertyType: string;
    hemnetUrl?: string;
    additionalContext?: string;
}

export interface AnalyzeResponse {
    success: boolean;
    report?: PropertyReport;
    error?: string;
}
