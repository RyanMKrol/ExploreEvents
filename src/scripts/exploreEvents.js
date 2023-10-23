#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */

import puppeteer from 'puppeteer';

const CONFIG_Roundhouse = {
  venue: 'Roundhouse',
  eventsUrl: 'https://www.roundhouse.org.uk/whats-on/?type=event',
  loadingFinishedSelector: '.card-view',
  eventCardSelector: '.event-card',
  eventCardArtistSelector: '.event-card__title',
  eventCardDateSelector: '.event-card__details',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: '.button--loadmore',
  cookiePolicyModalSelector: '.cookie-policy__popup',
  cookiePolicyModalAcceptButtonSelector: '.button--primary',
};

const CONFIG_EartH = {
  venue: 'EartH',
  eventsUrl: 'https://earthackney.co.uk/events/',
  loadingFinishedSelector: '.list--events',
  eventCardSelector: '.list--events__item',
  eventCardArtistSelector: '.list--events__item__title',
  eventCardDateSelector: '.list--events__item__dates > time:nth-child(1)',
  eventCardDescriptionSelector: '.list--events__item__description',
  loadMoreButtonSelector: undefined,
  cookiePolicyModalSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG = CONFIG_Roundhouse;

(async function main() {
  console.log('setting up page...');
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto(CONFIG.eventsUrl);

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  console.log('finished setting up page');

  console.log('maybe aknowledging cookies...');
  await maybeAcknowledgeCookieModal(page);
  console.log('finished aknowledging cookies');

  console.log('waiting for page to load...');
  // Wait for something that signifies the page is loaded
  await page.waitForSelector(CONFIG.loadingFinishedSelector);
  console.log('page has loaded');

  while (true) {
    console.log('waiting to fetch events from page...');
    const events = await page.$$(CONFIG.eventCardSelector);
    console.log('events have loaded');

    const eventItemDetails = await events.reduce((acc, event) => acc.then(async (newAcc) => {
      const artist = await event.$eval(
        CONFIG.eventCardArtistSelector,
        (result) => result.textContent.trim(),
      );
      const date = await event.$eval(
        CONFIG.eventCardDateSelector,
        (result) => result.textContent.trim(),
      );

      const description = CONFIG.eventCardDescriptionSelector ? await event.$eval(
        CONFIG.eventCardDescriptionSelector,
        (result) => result.textContent.trim(),
      ) : 'DESCRIPTION_NOT_REQUIRED';

      newAcc.push({ artist, date, description });

      return newAcc;
    }), Promise.resolve([]));

    console.log(eventItemDetails, eventItemDetails.length);

    // if there's nothing more to load, we're done
    if (!CONFIG.loadMoreButtonSelector) {
      break;
    }

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
  if (!CONFIG.cookiePolicyModalSelector) {
    return;
  }

  const cookieModal = await page.$(CONFIG.cookiePolicyModalSelector);

  if (cookieModal) {
    cookieModal.$eval(CONFIG.cookiePolicyModalAcceptButtonSelector, (el) => el.click());
  }
}
