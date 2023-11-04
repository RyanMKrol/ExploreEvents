#!/usr/bin/env node

import scrapeConcertList from './steps/crawling';

/**
 * Run the script
 */
(async function main() {
  const results = await scrapeConcertList(new Date('December 01, 2023 03:24:00'));
  console.log(results);
  process.exit();
}());
