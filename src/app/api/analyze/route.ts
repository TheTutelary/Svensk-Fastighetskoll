import { NextRequest, NextResponse } from 'next/server';
import { fetchPropertyData } from '@/lib/engine/scraper';
import { searchPropertyByAddress } from '@/lib/engine/searcher';
import { analyzePropertyRules } from '@/lib/engine/ruleEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, address } = body;

    let targetUrls: string[] = [];
    let searchAddress = address;

    if (url) {
      targetUrls = [url];
    } else if (address) {
      // Step 1: Search across sites
      const searchResults = await searchPropertyByAddress(address);
      
      if (searchResults.length === 0) {
        return NextResponse.json({ error: 'No properties found for this address' }, { status: 404 });
      }

      // Check for distinct addresses (door numbers etc)
      const distinctAddresses = Array.from(new Set(searchResults.map(r => r.address)));
      
      // If user provided a specific address and we found multiple variations, 
      // but one matches exactly, prioritize it.
      // Otherwise, if there are multiple variations, let the UI handle selection.
      if (distinctAddresses.length > 1 && !distinctAddresses.includes(address)) {
        return NextResponse.json({ 
          needsSelection: true, 
          options: distinctAddresses.map(addr => ({
            address: addr,
            sources: searchResults.filter(r => r.address === addr)
          }))
        });
      }

      // If we are here, we either have one address or a perfect match
      const chosenAddress = distinctAddresses.includes(address) ? address : distinctAddresses[0];
      const relevantResults = searchResults.filter(r => r.address === chosenAddress);
      
      targetUrls = relevantResults.map(r => r.url);
      searchAddress = chosenAddress;
    } else {
      return NextResponse.json({ error: 'URL or Address is required' }, { status: 400 });
    }

    // Step 2: Scrape all found URLs
    const scrapeTasks = targetUrls.map(u => fetchPropertyData(u));
    const scrapedDataResults = await Promise.all(scrapeTasks);

    // Step 3: Analyze using Rule Engine
    const report = analyzePropertyRules(scrapedDataResults, searchAddress || 'Unknown Address');

    return NextResponse.json(report);

  } catch (error: any) {
    console.error('Analysis API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during analysis' },
      { status: 500 }
    );
  }
}
