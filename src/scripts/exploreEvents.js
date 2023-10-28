#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */

import fs from 'fs-extra';

import TOTAL_CONFIG from './modules/config';
import PAGE_LOAD_HELPER_TYPES from './modules/constants';
import {
  clickElement,
  createBrowserAndPage,
  removeElement,
  scrollToBottomUntilNoMoreChanges,
} from './modules/puppeteer';

const OUTPUT_FILE_LOC = `${process.cwd()}/output/progress.txt`;

const MAX_MORE_EVENTS_CLICKS = 10;
const TIMEOUTS = {
  COOKIE_BUTTON_TIMEOUT_WAIT_MS: 3000,
  PAGE_LOAD_HELPER_SELECTOR_TIMEOUT_WAIT_MS: 5000,
};

// -==============================

// need a system to grab details from the event page
// https://www.academymusicgroup.com/o2shepherdsbushempire/events/all
// https://www.academymusicgroup.com/o2forumkentishtown/events/all
// https://www.academymusicgroup.com/o2academyislington/events/all

// -==============================

// need a system to get around captcha:
// https://www.royalalberthall.com/tickets/

// -==============================

// need a way to generate URLs for venues that are a pain with their load more logic

// -==============================
// need a way to parse the lack of event cards here:
// https://www.thelexington.co.uk/events.php

// will need to use regex or something

// -==============================

// maybe add some kind of filter - you're currently getting everything
// for this instead of just gigs:

// https://www.thegrace.london/whats-on/

// ================================

// write progress to a file so that you can try again if something
// crashes and not have to go through the entire thing

let CONFIG;

(async function main() {
  const rawPreviousResults = await loadCurrentProgress();
  const results = await removeEmptyResults(rawPreviousResults);
  const venuesToProcess = await loadVenuesToProcess(results);

  // Launch the browser and open a new blank page
  const { browser, page } = await createBrowserAndPage();

  for (let j = 0; j < venuesToProcess.length; j += 1) {
    CONFIG = venuesToProcess[j];

    console.log('*****************************************************');

    console.log(CONFIG.venue, CONFIG.eventUrls);

    const resultsSet = new Set();

    // some sites store their events across different distinct
    // pages, so we process them individually
    for (let i = 0; i < CONFIG.eventUrls.length; i += 1) {
    // Navigate the page to a URL
      await page.goto(CONFIG.eventUrls[i]);

      console.log('setting up page... ');
      await setupPage(page);

      console.log('Scrolling to the bottom of this page...');
      await scrollToBottomUntilNoMoreChanges(page);
      console.log('Finished scrolling to the bottom of the page');

      console.log('waiting for page to load...');
      await page.waitForNetworkIdleOptional();
      console.log('page has loaded');

      console.log('maybe execute page load helpers...');
      await maybeExecutePageLoadHelpers(page, CONFIG.pageLoadHelper);
      console.log('page load helpers done');

      // limit the number of times we can click the "more events" button; some websites will
      // let you browse years into the future, so we need to stop at some point
      let moreEventsCount = 0;
      while (moreEventsCount < MAX_MORE_EVENTS_CLICKS) {
        console.log('waiting to fetch events from page...');
        const events = await page.$$(CONFIG.eventCardSelector);
        console.log('events have loaded');

        // eslint-disable-next-line no-loop-func
        await events.reduce((acc, event) => acc.then(async () => {
          try {
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
            ) : undefined;

            resultsSet.add(JSON.stringify({ artist, date, description }));
          } catch (error) {
            // TODO: Start tracking how many times we fail, and do
            // something when that number is too high
            // This page currently has this issue - https://www.thewaitingroomn16.com/
            console.log('there was an error so we skipped this many items', error);
          }
        }), Promise.resolve([]));

        console.log('added a round of things');
        // if there's nothing more to load, we're done
        if (!CONFIG.loadMoreButtonSelector) {
          console.log('no selector in config skipping');
          break;
        }

        console.log('grabbing a button to load more');
        // TODO: we should guarantee that the more events button is clicked at least
        // once, otherwise the underlying DOM may have changed and we might miss events
        const loadMoreButton = await page.$(CONFIG.loadMoreButtonSelector);
        if (!loadMoreButton) {
          console.log('the button does not exist apparently');
          break;
        }

        console.log('trying to click the load more button');
        try {
          console.log('clicking');
          await page.click(CONFIG.loadMoreButtonSelector);
          console.log('have clicked');
          // have to wait for the network to idle before scrolling because the "load more" button
          // can occasionally load a new page entirely, which will cause any scrolling to crash
          console.log('waiting for network idle');
          await page.waitForNetworkIdleOptional();
          console.log('network idle');

          moreEventsCount += 1;
        } catch (err) {
          // TODO: handle this better by checking the visibility of the button
          console.log(err);
          console.log("the load more button likely wasn't visible, so this failed");
          break;
        }

        console.log('Scrolling to the bottom of this page...');
        await scrollToBottomUntilNoMoreChanges(page);
        console.log('Finished scrolling to the bottom of the page');

        // wait for the new events to load after loading more
        console.log('waiting for the page to load everything new');
        await page.waitForNetworkIdleOptional();
      }
    }

    const resultString = JSON.stringify(Array.from(resultsSet));
    console.log(resultString);

    // writeOrAppendToFile;

    results[CONFIG.venue] = Array.from(resultsSet);

    await fs.outputFile(OUTPUT_FILE_LOC, JSON.stringify(results, null, 2));
    console.log(results);
  }

  await browser.close();
}());

/**
 * Sets up the page to be ready for scraping
 * @param {object} page The browser page object
 */
async function setupPage(page) {
  console.log('maybe acknowledging cookies...');
  await maybeAcknowledgeCookieModal(page);

  // disables smooth scrolling which can intefere with the programatic scrolling this script does
  console.log('disabling smooth scrolling...');
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = 'html, body { scroll-behavior: auto !important; }';
    document.head.appendChild(style);
  });
}

/**
 * Acknowledges a cookie modal if one is present
 * @param {object} page The browser page object
 */
async function maybeAcknowledgeCookieModal(page) {
  if (!CONFIG.cookiePolicyModalAcceptButtonSelector) {
    return;
  }

  await clickElement(
    page,
    CONFIG.cookiePolicyModalAcceptButtonSelector,
    TIMEOUTS.COOKIE_BUTTON_TIMEOUT_WAIT_MS,
  );

  // we wait here after acking the cookie because some pages will
  // refresh after clicking it; after refreshing, the DOM won't exist,
  // so the next step of appending the style will crash the app
  await pauseBrowser(page, 3000);
}

/**
 * Pauses all browser execution for the time specified
 * @param {object} page The browser page object
 * @param {number} timeMs How many ms to pause for
 */
async function pauseBrowser(page, timeMs) {
  await page.waitForTimeout(timeMs);
}

/**
 * Executes a page loading helper strategy if needed
 * @param {object} page The browser page object
 * @param {object} helperConfig config representing which helpers are needed to load the page
 */
async function maybeExecutePageLoadHelpers(page, helperConfig) {
  if (!helperConfig || !helperConfig.type) {
    return;
  }

  switch (helperConfig.type) {
    case PAGE_LOAD_HELPER_TYPES.REMOVE_ELEMENT:
      await removeElement(
        page,
        helperConfig.options.selector,
      );
      break;
    case PAGE_LOAD_HELPER_TYPES.CLICK_ELEMENT:
      await clickElement(
        page,
        helperConfig.options.selector,
        TIMEOUTS.PAGE_LOAD_HELPER_SELECTOR_TIMEOUT_WAIT_MS,
      );
      break;
    default:
      console.log('Doing nothing extra to load the page');
      break;
  }
}

/**
 * Fetches how much progress has been made on the list of venues
 * @returns {object} An object representing how much progress has been made
 */
async function loadCurrentProgress() {
  return fs.pathExistsSync(OUTPUT_FILE_LOC) ? fs.readJson(OUTPUT_FILE_LOC) : {};
}

/**
 * When we fail to scrape, we'll store a set with 0 items. To be able
 *  to retry these venues, we need to remove the empty arrays from the
 *  results before starting the script
 * @param {object} data previous result set
 * @returns {object} cleared result set
 */
async function removeEmptyResults(data) {
  const newResults = Object.keys(data).reduce((acc, key) => {
    if (data[key].length !== 0) {
      acc[key] = data[key];
    }
    return acc;
  }, {});

  await fs.outputFile(OUTPUT_FILE_LOC, JSON.stringify(newResults, null, 2));

  return newResults;
}

/**
 * Loads the venues that need processing, given how many venues
 * have already been processed
 * @param {object} currentProgressResults A blob representing venues that
 * have already been processed
 * @returns {object} The config that will be processed by our script
 */
async function loadVenuesToProcess(currentProgressResults) {
  const alreadyProcessedVenues = Object.keys(currentProgressResults);

  const venuesToProcess = TOTAL_CONFIG.reduce((acc, config) => {
    if (!alreadyProcessedVenues.includes(config.venue)) {
      acc.push(config);
    }
    return acc;
  }, []);

  return venuesToProcess;
}
