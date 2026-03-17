import * as cheerio from 'cheerio';

export interface PropertySearchResult {
  address: string;
  url: string;
  site: string;
  status: 'For Sale' | 'Coming Soon' | 'Sold' | 'Unknown';
  type?: string;
  price?: string;
}

export async function searchPropertyByAddress(address: string): Promise<PropertySearchResult[]> {
  const results: PropertySearchResult[] = [];
  
  // Sites to search
  const searchTasks = [
    searchHemnet(address),
    searchBooli(address),
    searchFastighetsbyran(address),
    searchSvenskFast(address),
    searchMäklarhuset(address)
  ];

  const taskResults = await Promise.allSettled(searchTasks);
  
  taskResults.forEach(res => {
    if (res.status === 'fulfilled') {
      results.push(...res.value);
    }
  });

  return results;
}

const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7',
};

function cleanAddress(addr: string): string {
  return addr.toLowerCase().replace(/[,\s]+/g, ' ').trim();
}

function addressMatches(search: string, found: string): boolean {
  const s = cleanAddress(search);
  const f = cleanAddress(found);
  // Simple word-based matching
  const sWords = s.split(' ');
  return sWords.every(word => f.includes(word));
}

async function searchHemnet(address: string): Promise<PropertySearchResult[]> {
  try {
    const searchUrl = `https://www.hemnet.se/bostader?q=${encodeURIComponent(address)}`;
    const response = await fetch(searchUrl, { headers: COMMON_HEADERS });
    if (!response.ok) return [];
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results: PropertySearchResult[] = [];

    // Hemnet often uses script tags for their data, or standard list items
    $('.normal-results__list-item, .search-results__item, [data-testid="listing-card"]').each((_, el) => {
      const link = $(el).find('a').attr('href');
      const foundAddress = $(el).find('.listing-card__address, .search-result-link__address, [data-testid="listing-card-address"]').text().trim();
      
      if (link && foundAddress) {
        if (addressMatches(address, foundAddress)) {
          results.push({
            address: foundAddress,
            url: link.startsWith('http') ? link : `https://www.hemnet.se${link}`,
            site: 'Hemnet',
            status: 'For Sale'
          });
        }
      }
    });

    return results;
  } catch (e) {
    return [];
  }
}

async function searchBooli(address: string): Promise<PropertySearchResult[]> {
  try {
    const searchUrl = `https://www.booli.se/sok?q=${encodeURIComponent(address)}`;
    const response = await fetch(searchUrl, { headers: COMMON_HEADERS });
    if (!response.ok) return [];
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results: PropertySearchResult[] = [];

    // Booli search results
    $('a[href^="/annons/"], a[href^="/bostad/"]').each((_, el) => {
      const link = $(el).attr('href');
      const foundAddress = $(el).find('h2, h3, .address, [class*="Address"]').text().trim();
      
      if (link && foundAddress) {
        if (addressMatches(address, foundAddress)) {
          results.push({
            address: foundAddress,
            url: link.startsWith('http') ? link : `https://www.booli.se${link}`,
            site: 'Booli',
            status: link.includes('/annons/') ? 'For Sale' : 'Sold'
          });
        }
      }
    });

    return results;
  } catch (e) {
    return [];
  }
}

async function searchFastighetsbyran(address: string): Promise<PropertySearchResult[]> {
  try {
    const searchUrl = `https://www.fastighetsbyran.com/sv/sverige/sokresultat?q=${encodeURIComponent(address)}`;
    const response = await fetch(searchUrl, { headers: COMMON_HEADERS });
    if (!response.ok) return [];
    const html = await response.text();
    const $ = cheerio.load(html);
    const results: PropertySearchResult[] = [];

    $('.property-card, .property-list-item').each((_, el) => {
      const link = $(el).find('a').attr('href');
      const foundAddress = $(el).find('.address, .property-card__address').text().trim();
      if (link && foundAddress && addressMatches(address, foundAddress)) {
        results.push({
          address: foundAddress,
          url: link.startsWith('http') ? link : `https://www.fastighetsbyran.com${link}`,
          site: 'Fastighetsbyrån',
          status: 'For Sale'
        });
      }
    });
    return results;
  } catch (e) { return []; }
}

async function searchSvenskFast(address: string): Promise<PropertySearchResult[]> {
  try {
    const searchUrl = `https://www.svenskfast.se/sok/?q=${encodeURIComponent(address)}`;
    const response = await fetch(searchUrl, { headers: COMMON_HEADERS });
    if (!response.ok) return [];
    const html = await response.text();
    const $ = cheerio.load(html);
    const results: PropertySearchResult[] = [];

    $('.property-card, .property-listing').each((_, el) => {
      const link = $(el).find('a').attr('href');
      const foundAddress = $(el).find('.address, .property-card__address').text().trim();
      if (link && foundAddress && addressMatches(address, foundAddress)) {
        results.push({
          address: foundAddress,
          url: link.startsWith('http') ? link : `https://www.svenskfast.se${link}`,
          site: 'Svensk Fastighetsförmedling',
          status: 'For Sale'
        });
      }
    });
    return results;
  } catch (e) { return []; }
}

async function searchMäklarhuset(address: string): Promise<PropertySearchResult[]> {
  try {
    const searchUrl = `https://www.maklarhuset.se/sok?q=${encodeURIComponent(address)}`;
    const response = await fetch(searchUrl, { headers: COMMON_HEADERS });
    if (!response.ok) return [];
    const html = await response.text();
    const $ = cheerio.load(html);
    const results: PropertySearchResult[] = [];

    $('.property-card, .listing').each((_, el) => {
      const link = $(el).find('a').attr('href');
      const foundAddress = $(el).find('.address').text().trim();
      if (link && foundAddress && addressMatches(address, foundAddress)) {
        results.push({
          address: foundAddress,
          url: link.startsWith('http') ? link : `https://www.maklarhuset.se${link}`,
          site: 'Mäklarhuset',
          status: 'For Sale'
        });
      }
    });
    return results;
  } catch (e) { return []; }
}
