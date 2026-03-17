import * as cheerio from 'cheerio';

export interface ScrapedData {
  title?: string;
  description?: string;
  ogImage?: string;
  ldJson?: any;
  rawText?: string;
  url: string;
}

export async function fetchPropertyData(url: string): Promise<ScrapedData> {
  if (!url) {
    throw new Error("URL is required");
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      return { url };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr('content') || $('title').text();
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');

    // Extract LD-JSON
    let ldJson = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        // Simple heuristic: if it has "address" or "offers", it's likely the property schema
        if (json['@type'] === 'Product' || json['@type'] === 'Residence' || json['@type'] === 'SingleFamilyResidence' || json.address) {
          ldJson = json;
        }
      } catch (e) {
        // ignore parse errors
      }
    });

    // Extract main text content (naive)
    // Remove scripts, styles, etc.
    $('script, style, noscript, iframe, svg, footer, nav').remove();
    const rawText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 15000); // Limit context window

    return {
      title,
      description,
      ogImage,
      ldJson,
      rawText,
      url
    };

  } catch (error) {
    console.error("Scraping error:", error);
    // Return partial data (just URL) so AI can still try
    return { url };
  }
}
