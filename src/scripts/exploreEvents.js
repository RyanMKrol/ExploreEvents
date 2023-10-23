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
  await page.goto('https://www.academymusicgroup.com/o2shepherdsbushempire/events/all');

  console.log(4);
  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });
  console.log(5);

  // Wait and click on first result
  const searchResultSelector = '.item-list';
  console.log(7);
  await page.waitForSelector(searchResultSelector);

  const events = await page.$$('.event-item');

  const parsedEvents = await events.reduce((acc, val) => acc.then(async (newAcc) => {
    const fullTitle = await val?.evaluate((el) => el.textContent);
    console.log(fullTitle);
    newAcc.push(fullTitle);
    return newAcc;
  }), Promise.resolve([]));

  console.log(parsedEvents);

  await browser.close();
}());
