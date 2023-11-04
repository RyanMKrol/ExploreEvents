#!/usr/bin/env node

import scrapeConcertList from './steps/crawling';

/**
 * Run the script
 */
(async function main() {
  const dates = [
    new Date('December 02 2023'),
    new Date('December 03 2023'),
  ];

  const results = await dates.reduce(async (acc, date) => {
    const localAcc = await acc;

    const resultForDate = await scrapeConcertList(date);
    localAcc[date.toLocaleDateString('en-GB')] = resultForDate;

    return localAcc;
  }, Promise.resolve({}));

  console.log(results);
}());
