#!/usr/bin/env node

/* eslint-disable */

import scrapeConcertList from './steps/crawling';
import filterDate from './steps/filter';
import createReportFile from './steps/report';

/**
 * Run the script
 */
(async function main() {
  const dates = [
    new Date('December 05 2023'),
  ];

  const results = await dates.reduce(async (acc, date) => {
    const localAcc = await acc;

    const resultForDate = await scrapeConcertList(date);
    localAcc.push({
      date: date.toLocaleDateString('en-GB'),
      events: resultForDate
    })

    return localAcc;
  }, Promise.resolve([]));


  const filteredResults = filterDate(results);

  createReportFile({results: filteredResults});
}());
