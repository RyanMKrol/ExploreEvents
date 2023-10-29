#!/usr/bin/env node

import scrapeVenues from './steps/crawling';
import reportOutput from './steps/reporting';
import { areScriptResultsHealthy, storeScriptRunHealthMetrics } from './steps/scriptHealth';
import transformResults from './steps/transform';

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

  transformResults(results);
}());
