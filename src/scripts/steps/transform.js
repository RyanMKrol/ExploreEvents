/**
 * Module deals with transforming the results into a uniform format
 */

import { VENUE_RESULTS_PARSING_CONFIG } from '../../utils/config';

/**
 * Performs a number of transforms on the results
 * @param {object} results The results from scraping the venue sites
 * @returns A modified version of the results
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
function transformResults(results) {
  console.log(VENUE_RESULTS_PARSING_CONFIG.thi);
  Object.values(results).forEach((val) => {
    console.log('*******');
    console.log(JSON.parse(val[5]).date);
  });

  return results;
}

export default transformResults;
