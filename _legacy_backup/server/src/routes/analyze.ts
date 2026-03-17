import { Router, Request, Response } from 'express';
import { analyzeProperty } from '../services/aiAnalyzer.js';
import type { AnalyzeRequest } from '../types/report.js';

export const analyzeRouter = Router();

analyzeRouter.post('/analyze', async (req: Request, res: Response) => {
    try {
        const { address, propertyType, hemnetUrl, additionalContext } = req.body as AnalyzeRequest;

        // Validate input
        if (!address || !propertyType) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: address and propertyType are required.',
            });
            return;
        }

        console.log(`\n🔍 Analyzing: "${address}" (${propertyType})`);
        if (hemnetUrl) console.log(`   Hemnet URL: ${hemnetUrl}`);

        const report = await analyzeProperty({
            address,
            propertyType,
            hemnetUrl,
            additionalContext,
        });

        res.json({ success: true, report });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error during analysis';
        console.error('❌ Analysis failed:', message);
        res.status(500).json({ success: false, error: message });
    }
});
