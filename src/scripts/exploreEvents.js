#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */

import puppeteer from 'puppeteer';

const CONFIG_Roundhouse = {
  venue: 'Roundhouse',
  eventsUrl: 'https://www.roundhouse.org.uk/whats-on/?type=event',
  eventCardSelector: '.event-card',
  eventCardArtistSelector: '.event-card__title',
  eventCardDateSelector: '.event-card__details',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: '.button--loadmore',
  cookiePolicyModalAcceptButtonSelector: '.cookie-policy__popup .button--primary',
};

const CONFIG_EartH = {
  venue: 'EartH',
  eventsUrl: 'https://earthackney.co.uk/events/',
  eventCardSelector: '.list--events__item',
  eventCardArtistSelector: '.list--events__item__title',
  eventCardDateSelector: '.list--events__item__dates > time:nth-child(1)',
  eventCardDescriptionSelector: '.list--events__item__description',
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_Omeara = {
  venue: 'Omeara',
  eventsUrl: 'https://omearalondon.com/events/?event-type=live&currentpage=1',
  eventCardSelector: '.events-grid-view__event-card',
  eventCardArtistSelector: '.event-title',
  eventCardDateSelector: '.event-date',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: '.cky-btn-accept',
};

const CONFIG_UnionChapel = {
  venue: 'Union Chapel',
  eventsUrl: 'https://unionchapel.org.uk/whats-on',
  eventCardSelector: '.card',
  eventCardArtistSelector: '.card-inner > p.card-title',
  eventCardDateSelector: '.card-inner > p > strong',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: '#cookiescript_accept',
};

const CONFIG_TheShacklewellArms = {
  venue: 'The Shacklewell Arms',
  eventsUrl: 'https://www.shacklewellarms.com/events',
  eventCardSelector: '.dice_events article',
  eventCardArtistSelector: '.dice_event-title',
  eventCardDateSelector: 'time',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: '.dice_load-more',
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG = CONFIG_TheShacklewellArms;

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
  await page.waitForNetworkIdle();
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

    // wait for the new events to load after loading more
    await page.waitForNetworkIdle();
  }
  await browser.close();
}());

/**
 * Acknowledges a cookie modal if one is present
 * @param {object} page The browser page object
 */
async function maybeAcknowledgeCookieModal(page) {
  if (!CONFIG.cookiePolicyModalAcceptButtonSelector) {
    return;
  }

  const cookieButtonSelector = await page.waitForSelector(
    CONFIG.cookiePolicyModalAcceptButtonSelector,
  );

  await cookieButtonSelector?.evaluate((el) => el.click());
}

/**
 * Pauses all browser execution for the time specified
 * @param {object} page The browser page object
 * @param {number} timeMs How many ms to pause for
 */
async function pauseBrowser(page, timeMs) {
  await page.waitForTimeout(timeMs);
}
