/**
    File for handling utilities around reading/writing to the file
    responsibile for tracking the progress of a current batch
 */

import fs from 'fs-extra';

const OUTPUT_FILE_LOC = `${process.cwd()}/output/progress.txt`;

/**
 * Read progress file
 * @returns {object} Progress made on this batch so far
 * Return result looks like:
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
async function readProgressFile() {
  const contents = await (
    fs.pathExistsSync(OUTPUT_FILE_LOC)
      ? fs.readJson(OUTPUT_FILE_LOC)
      : Promise.resolve({})
  );

  const contentsWithoutEmptyResults = Object.keys(contents).reduce((acc, key) => {
    if (contents[key].length !== 0) {
      acc[key] = contents[key];
    }
    return acc;
  }, {});

  await fs.outputFile(OUTPUT_FILE_LOC, JSON.stringify(contentsWithoutEmptyResults, null, 2));

  return contentsWithoutEmptyResults;
}

/**
 * Write to progress file
 * @param {object} data Data to write to the file
 * Data looks like:
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
async function writeProgressFile(data) {
  await fs.outputFile(OUTPUT_FILE_LOC, JSON.stringify(data, null, 2));
}

export {
  readProgressFile,
  writeProgressFile,
};
