import type { AnalyzeRequest, AnalyzeResponse } from '../types/report';

const API_BASE = '/api';

export async function analyzeProperty(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        return { success: false, error: errorData.error || `Server error: ${response.status}` };
    }

    return response.json();
}
