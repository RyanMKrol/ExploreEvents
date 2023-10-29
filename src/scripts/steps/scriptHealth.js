/**
 * Module deals with checking if the script ran correctly or not
 */

import fs from 'fs-extra';

import { VENUE_CRAWLING_CONFIG } from '../../utils/config';
import sortDates from '../../utils/sort';

const METRICS_OUTPUT_FILE_LOC = `${process.cwd()}/output/resultsMetricsHistory.json`;
const ABNORMAL_METRICS_DIFF_PERCENTAGE = 20;

/**
 * Performs a number of health checks on the results
 * @param {object} results The results from scraping the venue sites
 * @returns {boolean} Whether the script results are healthy
 *  `results` looks like:
 * {
 *   "The Garage": [
 *     "{\"artist\":\"God Is An Astronaut\",\"date\":\"Sat.28.Oct.23\"}",
 *     "{\"artist\":\"GLITTERFEST HALLOWEEN\",\"date\":\"Sat.28.Oct.23\"}",
 *   ],
 *   "Scala": [
 *     "{\"artist\":\"Sogand, Zakhmi, Kamyar\",\"date\":\"29th October 2023\"}",
 *     "{\"artist\":\"Briston Maroney\",\"date\":\"1st November 2023\"}",
 *     "{\"artist\":\"Strachy na Lachy\",\"date\":\"5th November 2023\"}",
 *   ]
 * }
 */
function areScriptResultsHealthy(results) {
  const entriesWithNoData = getEntriesWithNoData(results);
  if (entriesWithNoData.length > 0) {
    console.log('Result set includes venues that have returned no results! The following are empty:', entriesWithNoData);
    return false;
  }

  const missingEntries = getMissingEntriesFromResults(results);
  if (missingEntries.length > 0) {
    console.log('Result set is missing venues! The following are missing:', missingEntries);
    return false;
  }

  const entriesWithAbnormalMetrics = getEntriesWithAbnormalMetrics(results);
  if (entriesWithAbnormalMetrics.length > 0) {
    console.log('Result set has venues with significantly less events than expected:', JSON.stringify(entriesWithAbnormalMetrics, null, 2));
    return false;
  }

  return true;
}

/**
 * Check the counts of events in this batch against the average of the last few runs
 * @param {object} results The results from scraping the venue sites
 * @returns {Array<object>} An array of objects containing the venue name and
 * the % diff from historical data
 */
function getEntriesWithAbnormalMetrics(results) {
  const previousScriptResultsMetrics = fs.readJsonSync(METRICS_OUTPUT_FILE_LOC);

  // Sort the dates in descending order
  const sortedDates = sortDates(Object.keys(previousScriptResultsMetrics));

  // Take the three latest dates
  const latestDates = sortedDates.slice(0, 3);

  // Combine the data from the three latest dates and calculate the average
  const combinedData = {};
  const venueCounts = {};

  // combine the raw data, and count how many times each venue went into the count
  latestDates.forEach((date) => {
    const venues = previousScriptResultsMetrics[date];
    Object.keys(venues).forEach((venue) => {
      if (!combinedData[venue]) {
        combinedData[venue] = 0;
        venueCounts[venue] = 0;
      }
      combinedData[venue] += venues[venue];
      venueCounts[venue] += 1;
    });
  });

  // Calculate the average for each venue
  Object.keys(combinedData).forEach((venue) => {
    combinedData[venue] = Math.round(combinedData[venue] / venueCounts[venue]);
  });

  // grabs the metrics for the current result set
  const thisBatchMetrics = Object.keys(results).reduce((acc, venueName) => {
    acc[venueName] = results[venueName].length;
    return acc;
  }, {});

  // calculates the venues that have a significant number of events less than previous script runs
  const venuesWithAbnormalMetrics = Object.keys(thisBatchMetrics).map((venueName) => {
    const thisBatchMetric = thisBatchMetrics[venueName];
    const previousBatchMetric = combinedData[venueName];

    const difference = Math.abs(thisBatchMetric - previousBatchMetric);

    const percentageDiff = (difference / Math.abs(previousBatchMetric)) * 100;

    const signedPercentageDiff = thisBatchMetric >= previousBatchMetric
      ? percentageDiff
      : -percentageDiff;

    return { venue: venueName, diff: signedPercentageDiff };
  }).filter((x) => x.diff < -ABNORMAL_METRICS_DIFF_PERCENTAGE);

  return venuesWithAbnormalMetrics;
}

/**
 * Checks to see if our results has any missing venues
 * @param {object} results The results from scraping the venue sites
 */
function storeScriptRunHealthMetrics(results) {
  const existingMetrics = fs.readJsonSync(METRICS_OUTPUT_FILE_LOC);

  const date = new Date()
    .toLocaleDateString('en-GB')
    .split('/')
    .join('-');

  if (existingMetrics[date]) {
    console.log('Have already run the script today, not storing further metrics');
    return;
  }

  const newMetrics = Object.keys(results).reduce((acc, venueName) => {
    acc[venueName] = results[venueName].length;
    return acc;
  }, {});

  existingMetrics[date] = newMetrics;

  fs.writeJSONSync(METRICS_OUTPUT_FILE_LOC, existingMetrics, { spaces: 2 });
}

/**
 * Checks to see if our results has any venues that returned 0 results
 * @param {object} results The results from scraping the venue sites
 * @returns {Array<string>} Venue names that have no data stored against them
 */
function getEntriesWithNoData(results) {
  return Object.keys(results).filter((resultsKey) => results[resultsKey].length === 0);
}
/**
 * Checks to see if our results has any missing venues
 * @param {object} results The results from scraping the venue sites
 * @returns {Array<string>} Venue names that are missing from the result set
 */
function getMissingEntriesFromResults(results) {
  return VENUE_CRAWLING_CONFIG.map((x) => x.venue)
    .filter((targetVenueKey) => !Object.keys(results).includes(targetVenueKey));
}

export { areScriptResultsHealthy, storeScriptRunHealthMetrics };
