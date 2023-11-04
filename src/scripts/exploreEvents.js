#!/usr/bin/env node

import scrapeConcertList from './steps/crawling';
import filterDate from './steps/filter';

/**
 * Run the script
 */
(async function main() {
  const dates = [
    new Date('December 06 2023'),
  ];

  const results = await dates.reduce(async (acc, date) => {
    const localAcc = await acc;

    const resultForDate = await scrapeConcertList(date);
    localAcc[date.toLocaleDateString('en-GB')] = resultForDate;

    return localAcc;
  }, Promise.resolve({}));

  const filteredResults = filterDate(results);

  console.log(filteredResults);
}());
