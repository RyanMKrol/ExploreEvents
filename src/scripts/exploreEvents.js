#!/usr/bin/env node

import puppeteer from 'puppeteer';

(async function main() {
  // Launch the browser and open a new blank page
  console.log(1);
  const browser = await puppeteer.launch({ headless: false });
  console.log(2);
  const page = await browser.newPage();
  console.log(3);

  // Navigate the page to a URL
  await page.goto('https://www.roundhouse.org.uk/whats-on/?type=event');

  console.log(4);
  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });
  console.log(5);

  // Wait and click on first result
  const searchResultSelector = '.card-view';
  console.log(7);
  await page.waitForSelector(searchResultSelector);

  const events = await page.$$('.event-card');

  const eventItemDetails = await events.reduce((acc, event) => acc.then(async (newAcc) => {
    const artist = await event.$eval('.event-card__title', (result) => result.textContent.trim());
    const date = await event.$eval('.event-card__details', (result) => result.textContent.trim());
    newAcc.push({ artist, date });
    return newAcc;
  }), Promise.resolve([]));

  console.log(eventItemDetails);

  await browser.close();
}());
