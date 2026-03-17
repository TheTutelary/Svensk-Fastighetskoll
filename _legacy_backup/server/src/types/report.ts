/**
 * Shared TypeScript interfaces for the Property Report
 * These match the structured output from the Gemini AI analysis
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
    // Property identification
    address: string;
    propertyType: string;
    municipality?: string;
    buildYear?: number;
    livingArea?: string;

    // Executive Summary
    recommendation: Recommendation;
    executiveSummary: string;

    // Valuation
    valuation: ValuationSnapshot;

    // Scorecard
    scorecard: ScoreCategory[];
    totalScore: number;
    totalMaxScore: number;
    scoreSummary: string;

    // Risks
    risks: RiskItem[];

    // Pros & Cons
    pros: string[];
    cons: string[];

    // Metadata
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
