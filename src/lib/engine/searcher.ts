import * as cheerio from 'cheerio';

export interface PropertySearchResult {
  address: string;
  url: string;
  site: string;
  status: 'For Sale' | 'Coming Soon' | 'Sold' | 'Unknown';
  type?: string;
}

export async function searchPropertyByAddress(address: string): Promise<PropertySearchResult[]> {
  const results: PropertySearchResult[] = [];
  
  // Sites to search
  const searchTasks = [
    searchHemnet(address),
    searchBooli(address),
    searchFastighetsbyran(address),
    searchSvenskFast(address)
  ];

  const taskResults = await Promise.allSettled(searchTasks);
  
  taskResults.forEach(res => {
    if (res.status === 'fulfilled') {
      results.push(...res.value);
    }
  });

  return results;
}

async function searchHemnet(address: string): Promise<PropertySearchResult[]> {
  try {
    const searchUrl = `https://www.hemnet.se/bostader?q=${encodeURIComponent(address)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    if (!response.ok) return [];
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results: PropertySearchResult[] = [];

    // Hemnet's current list item selector (heuristic)
    $('.normal-results__list-item, .search-results__item').each((_, el) => {
      const link = $(el).find('a').attr('href');
      const foundAddress = $(el).find('.listing-card__address, .search-result-link__address').text().trim();
      
      if (link && foundAddress.toLowerCase().includes(address.toLowerCase().split(' ')[0])) {
        results.push({
          address: foundAddress,
          url: link.startsWith('http') ? link : `https://www.hemnet.se${link}`,
          site: 'Hemnet',
          status: 'For Sale' // Hemnet default
        });
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
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    
    if (!response.ok) return [];
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results: PropertySearchResult[] = [];

    $('a[href^="/annons/"], a[href^="/bostad/"]').each((_, el) => {
      const link = $(el).attr('href');
      const foundAddress = $(el).find('h2, h3, .address').text().trim();
      
      if (link && foundAddress.toLowerCase().includes(address.toLowerCase().split(' ')[0])) {
        results.push({
          address: foundAddress,
          url: link.startsWith('http') ? link : `https://www.booli.se${link}`,
          site: 'Booli',
          status: link.includes('/annons/') ? 'For Sale' : 'Sold'
        });
      }
    });

    return results;
  } catch (e) {
    return [];
  }
}

async function searchFastighetsbyran(address: string): Promise<PropertySearchResult[]> {
  // Mocking for now, as scraping specific brokers needs more tailored selectors
  return [];
}

async function searchSvenskFast(address: string): Promise<PropertySearchResult[]> {
  // Mocking for now
  return [];
}
