/**
 * Sarkari Tracker - Scraper Health Monitor & Circuit Breaker
 * Tracks scrape health across government commission portals
 * and trips a circuit breaker if ≥ 3 consecutive failures occur.
 */

const scraperHealthState = {
  ibps: { lastRunAt: null, lastSuccessAt: null, consecutiveFailures: 0, status: 'HEALTHY', lastError: null },
  ssc: { lastRunAt: null, lastSuccessAt: null, consecutiveFailures: 0, status: 'HEALTHY', lastError: null },
  upsc: { lastRunAt: null, lastSuccessAt: null, consecutiveFailures: 0, status: 'HEALTHY', lastError: null },
  isro: { lastRunAt: null, lastSuccessAt: null, consecutiveFailures: 0, status: 'HEALTHY', lastError: null }
};

export function recordScrapeAttempt(adapterKey, success, errorMsg = null) {
  if (!scraperHealthState[adapterKey]) {
    scraperHealthState[adapterKey] = { lastRunAt: null, lastSuccessAt: null, consecutiveFailures: 0, status: 'HEALTHY', lastError: null };
  }

  const record = scraperHealthState[adapterKey];
  record.lastRunAt = new Date().toISOString();

  if (success) {
    record.lastSuccessAt = new Date().toISOString();
    record.consecutiveFailures = 0;
    record.status = 'HEALTHY';
    record.lastError = null;
  } else {
    record.consecutiveFailures += 1;
    record.lastError = errorMsg;
    if (record.consecutiveFailures >= 3) {
      record.status = 'CIRCUIT_BREAKER_TRIPPED';
      console.error(`🚨 [CIRCUIT BREAKER] Adapter '${adapterKey}' has failed ${record.consecutiveFailures} consecutive times! Alerts sent.`);
    } else {
      record.status = 'DEGRADED';
    }
  }

  return record;
}

export function getScrapersHealth() {
  return scraperHealthState;
}

export function resetCircuitBreaker(adapterKey) {
  if (scraperHealthState[adapterKey]) {
    scraperHealthState[adapterKey].consecutiveFailures = 0;
    scraperHealthState[adapterKey].status = 'HEALTHY';
    scraperHealthState[adapterKey].lastError = null;
    return true;
  }
  return false;
}
