#!/usr/bin/env node

import scrapeVenues from './steps/scraping';
import reportOutput from './steps/reporting';
import { areScriptResultsHealthy, storeScriptRunHealthMetrics } from './steps/scriptHealth';

/**
 * Run the script
 */
(async function main() {
  const results = await scrapeVenues();

  reportOutput(results);

  const isHealthy = areScriptResultsHealthy(results);

  if (isHealthy) {
    storeScriptRunHealthMetrics(results);
  }
}());
