import * as cheerio from 'cheerio';

export interface ScrapedData {
  title?: string;
  description?: string;
  ogImage?: string;
  ldJson?: any;
  rawText?: string;
  url: string;
  address?: string;
  price?: string;
  type?: string;
  area?: string;
  rooms?: string;
  buildYear?: string;
  municipality?: string;
}

export async function fetchPropertyData(url: string): Promise<ScrapedData> {
  if (!url) {
    throw new Error("URL is required");
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

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
        if (Array.isArray(json)) {
           const found = json.find(j => j['@type'] === 'Product' || j['@type'] === 'Residence' || j['@type'] === 'SingleFamilyResidence' || j.address);
           if (found) ldJson = found;
        } else if (json['@type'] === 'Product' || json['@type'] === 'Residence' || json['@type'] === 'SingleFamilyResidence' || json.address) {
          ldJson = json;
        }
      } catch (e) { }
    });

    // Specific Extraction Logic
    let address = ldJson?.address?.streetAddress || ldJson?.name;
    if (!address || address === title) {
        address = title.split(' - ')[0].split(' | ')[0].trim();
    }

    let price = ldJson?.offers?.price || ldJson?.offers?.lowPrice;
    if (!price) {
        // Look for price patterns in text
        const priceMatch = html.match(/(\d[\d\s]{4,})\s*(?:kr|SEK)/i);
        if (priceMatch) price = priceMatch[1].replace(/\s/g, '');
    }

    // Site specific selectors
    let area = '';
    let rooms = '';
    let buildYear = '';
    
    if (url.includes('hemnet.se')) {
        area = $('.property-info__attributes-item:contains("Boarea"), .qa-living-area').text().replace('Boarea', '').trim();
        rooms = $('.property-info__attributes-item:contains("Antal rum"), .qa-rooms').text().replace('Antal rum', '').trim();
        buildYear = $('.property-info__attributes-item:contains("Byggår"), .qa-build-year').text().replace('Byggår', '').trim();
    } else if (url.includes('booli.se')) {
        area = $('[class*="LivingArea"]').text().trim();
        rooms = $('[class*="Rooms"]').text().trim();
        buildYear = $('[class*="ConstructionYear"]').text().trim();
    }

    // Fallback search in raw text
    if (!buildYear) {
        const yearMatch = html.match(/Byggår[:\s]+(\d{4})/i);
        if (yearMatch) buildYear = yearMatch[1];
    }

    // Remove scripts, styles, etc. for cleaner rawText
    $('script, style, noscript, iframe, svg, footer, nav').remove();
    const rawText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 20000);

    return {
      title,
      description,
      ogImage,
      ldJson,
      rawText,
      url,
      address,
      price: price?.toString(),
      area,
      rooms,
      buildYear,
      municipality: ldJson?.address?.addressLocality
    };

  } catch (error) {
    console.error("Scraping error:", error);
    return { url };
  }
}
