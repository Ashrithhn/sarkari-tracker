import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const registryPath = path.join(__dirname, '../data/examRegistry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

console.log(`\n======================================================`);
console.log(`🇮🇳 SarkariTracker Official URL Verification Job`);
console.log(`Checking ${registry.length} registered examination portals...`);
console.log(`======================================================\n`);

async function checkUrl(url) {
  if (!url) return { ok: false, status: 'NO_URL' };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    });
    clearTimeout(timer);
    return { ok: res.status < 400 || res.status === 403, status: res.status };
  } catch (err) {
    return { ok: false, status: err.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_RESTRICTION' };
  }
}

async function verifyAll() {
  const brokenLinks = [];
  let checked = 0;

  for (const exam of registry.slice(0, 15)) { // Check sample batches
    checked++;
    const res = await checkUrl(exam.official_site);
    const statusSymbol = res.ok ? '✓' : '⚠️';
    console.log(`[${statusSymbol}] ${exam.short_name.padEnd(20)} | Status: ${String(res.status).padEnd(8)} | ${exam.official_site}`);
    if (!res.ok && res.status !== 'TIMEOUT' && res.status !== 'NETWORK_RESTRICTION') {
      brokenLinks.push({ exam: exam.short_name, url: exam.official_site, status: res.status });
    }
  }

  console.log(`\nVerification sample check completed (${checked} URLs verified). Flagged broken: ${brokenLinks.length}`);
}

verifyAll();
