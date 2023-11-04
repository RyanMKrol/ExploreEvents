#!/usr/bin/env node

import fs from 'fs-extra';

import scrapeVenues from './steps/crawling';
import { areScriptResultsHealthy, storeScriptRunHealthMetrics } from './steps/scriptHealth';
import transformResults from './steps/transform';

/**
 * Run the script
 */
(async function main() {
  const results = await scrapeVenues();

  const isHealthy = areScriptResultsHealthy(results);

  if (!isHealthy) {
    console.log('The run is not healthy, stopping here');
    return;
  }

  storeScriptRunHealthMetrics(results);

  const [fullyParsedResults, troublesomeEvents] = transformResults(results);

  const loc = `${process.cwd()}/output/results.json`;

  fs.writeJSONSync(loc, fullyParsedResults, { spaces: 2 });

  console.log(troublesomeEvents);

  const dates = ['2 Nov 2023', '3 Nov 2023', '4 Nov 2023', '5 Nov 2023'];

  const venueNames = Object.keys(fullyParsedResults);

  dates.forEach((date) => {
    console.log(`*** ${date}`);

    const events = venueNames.map((venue) => fullyParsedResults[venue]
      .filter((x) => x.date === date)
      .map((x) => ({ name: x.artist, venue }))).flat().map((x) => JSON.stringify(x));

    console.log(events);
  });
}());
