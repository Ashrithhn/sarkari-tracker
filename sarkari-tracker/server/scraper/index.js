import { scrapeIBPS } from './ibpsScraper.js';
import { scrapeSSC } from './sscScraper.js';
import { scrapeUPSC } from './upscScraper.js';
import { scrapeISRO } from './isroScraper.js';
import { extractAndQueue } from './extractor.js';
import { recordScrapeAttempt, getScrapersHealth, resetCircuitBreaker } from './monitor.js';

export const ADAPTERS = {
  ibps: scrapeIBPS,
  ssc: scrapeSSC,
  upsc: scrapeUPSC,
  isro: scrapeISRO
};

export { getScrapersHealth, resetCircuitBreaker };

/**
 * Execute scraper by adapter key, extract structured data with verbatim quote checking,
 * and submit into the review queue for human sign-off.
 */
export async function runScraper(adapterKey = 'ibps') {
  if (adapterKey === 'all') {
    const results = [];
    for (const [key, scraperFn] of Object.entries(ADAPTERS)) {
      try {
        const scraped = await scraperFn();
        const extraction = extractAndQueue(scraped);
        recordScrapeAttempt(key, true);
        results.push({ adapter: key, success: true, scraped, extraction });
      } catch (err) {
        recordScrapeAttempt(key, false, err.message);
        results.push({ adapter: key, success: false, error: err.message });
      }
    }
    return results;
  }

  const scraperFn = ADAPTERS[adapterKey];
  if (!scraperFn) {
    throw new Error(`Unknown scraper adapter: '${adapterKey}'. Supported: ${Object.keys(ADAPTERS).join(', ')}, all`);
  }

  try {
    const scraped = await scraperFn();
    const extraction = extractAndQueue(scraped);
    recordScrapeAttempt(adapterKey, true);
    return { adapter: adapterKey, scraped, extraction };
  } catch (err) {
    recordScrapeAttempt(adapterKey, false, err.message);
    throw err;
  }
}

