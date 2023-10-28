#!/usr/bin/env node

import scrapeVenues from './steps/scraping';
import reportOutput from './steps/reporting';

/**
 * Run the script
 */
(async function main() {
  const results = await scrapeVenues();
  reportOutput(results);
}());
