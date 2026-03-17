import { useState, useCallback } from 'react';
import type { PropertyReport, AnalyzeRequest } from '../types/report';
import { analyzeProperty } from '../services/api';

interface UseAnalysisState {
    report: PropertyReport | null;
    isLoading: boolean;
    error: string | null;
}

const CACHE_PREFIX = 'spa_report_';

function getCachedReport(key: string): PropertyReport | null {
    try {
        const cached = localStorage.getItem(CACHE_PREFIX + key);
        if (cached) {
            const parsed = JSON.parse(cached);
            // Cache expires after 24 hours
            const age = Date.now() - new Date(parsed.analyzedAt).getTime();
            if (age < 24 * 60 * 60 * 1000) return parsed;
            localStorage.removeItem(CACHE_PREFIX + key);
        }
    } catch { /* ignore */ }
    return null;
}

function setCachedReport(key: string, report: PropertyReport) {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(report));
    } catch { /* ignore quota errors */ }
}

export function useAnalysis() {
    const [state, setState] = useState<UseAnalysisState>({
        report: null,
        isLoading: false,
        error: null,
    });

    const analyze = useCallback(async (request: AnalyzeRequest) => {
        const cacheKey = `${request.propertyType}_${request.address}`.toLowerCase();

        // Check cache first
        const cached = getCachedReport(cacheKey);
        if (cached) {
            setState({ report: cached, isLoading: false, error: null });
            return;
        }

        setState({ report: null, isLoading: true, error: null });

        try {
            const response = await analyzeProperty(request);

            if (response.success && response.report) {
                setCachedReport(cacheKey, response.report);
                setState({ report: response.report, isLoading: false, error: null });
            } else {
                setState({ report: null, isLoading: false, error: response.error || 'Analysis failed' });
            }
        } catch (err) {
            setState({
                report: null,
                isLoading: false,
                error: err instanceof Error ? err.message : 'An unexpected error occurred',
            });
        }
    }, []);

    const clearReport = useCallback(() => {
        setState({ report: null, isLoading: false, error: null });
    }, []);

    return { ...state, analyze, clearReport };
}
