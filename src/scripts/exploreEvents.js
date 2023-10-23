#!/usr/bin/env node

/* eslint-disable no-await-in-loop */

import puppeteer from 'puppeteer';

const CONFIG = {
  venue: 'Roundhouse',
  eventsUrl: 'https://www.roundhouse.org.uk/whats-on/?type=event',
  loadingFinishedSelector: '.card-view',
  eventCardSelector: '.event-card',
  eventCardArtistSelector: '.event-card__title',
  eventCardDateSelector: '.event-card__details',
  loadMoreButtonSelector: '.button--loadmore',
  cookiePolicyModalSelector: '.cookie-policy__popup',
  cookiePolicyModalAcceptButtonSelector: '.button--primary',
};

(async function main() {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto(CONFIG.eventsUrl);

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  await maybeAcknowledgeCookieModal(page);

  // Wait for something that signifies the page is loaded
  const searchResultSelector = CONFIG.loadingFinishedSelector;
  await page.waitForSelector(searchResultSelector);

  while (true) {
    const events = await page.$$(CONFIG.eventCardSelector);

    const eventItemDetails = await events.reduce((acc, event) => acc.then(async (newAcc) => {
      const artist = await event.$eval(
        CONFIG.eventCardArtistSelector,
        (result) => result.textContent.trim(),
      );
      const date = await event.$eval(
        CONFIG.eventCardDateSelector,
        (result) => result.textContent.trim(),
      );
      newAcc.push({ artist, date });
      return newAcc;
    }), Promise.resolve([]));

    console.log(eventItemDetails, eventItemDetails.length);

    const doesTheButtonExist = await page.$(CONFIG.loadMoreButtonSelector);
    if (!doesTheButtonExist) {
      console.log('the button does not exist apparently');
      break;
    }

    await page.click(CONFIG.loadMoreButtonSelector);
  }
  await browser.close();
}());

/**
 * Acknowledges a cookie modal if one is present
 * @param {object} page The browser page object
 */
async function maybeAcknowledgeCookieModal(page) {
  const cookieModal = await page.$(CONFIG.cookiePolicyModalSelector);

  if (cookieModal) {
    cookieModal.$eval(CONFIG.cookiePolicyModalAcceptButtonSelector, (el) => el.click());
  }
}
