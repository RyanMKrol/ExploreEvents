#!/usr/bin/env node

/* eslint-disable no-await-in-loop */

import puppeteer from 'puppeteer';

(async function main() {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto('https://www.roundhouse.org.uk/whats-on/?type=event');

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  await maybeAcknowledgeCookieModal(page);

  // Wait for something that signifies the page is loaded
  const searchResultSelector = '.card-view';
  await page.waitForSelector(searchResultSelector);

  while (true) {
    const events = await page.$$('.event-card');

    const eventItemDetails = await events.reduce((acc, event) => acc.then(async (newAcc) => {
      const artist = await event.$eval('.event-card__title', (result) => result.textContent.trim());
      const date = await event.$eval('.event-card__details', (result) => result.textContent.trim());
      newAcc.push({ artist, date });
      return newAcc;
    }), Promise.resolve([]));

    console.log(eventItemDetails, eventItemDetails.length);

    const doesTheButtonExist = await page.$('.button--loadmore');
    if (!doesTheButtonExist) {
      console.log('the button does not exist apparently');
      break;
    }

    await page.click('.button--loadmore');
  }
  await browser.close();
}());

/**
 * Acknowledges a cookie modal if one is present
 * @param {object} page The browser page object
 */
async function maybeAcknowledgeCookieModal(page) {
  const cookieModal = await page.$('.cookie-policy__popup');

  if (cookieModal) {
    cookieModal.$eval('.button--primary', (el) => el.click());
  }
}
