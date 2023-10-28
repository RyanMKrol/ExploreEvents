#!/usr/bin/env node
/* eslint-disable no-loop-func */

/* eslint-disable no-await-in-loop */

import VENUES_CONFIG from './modules/config';
import PAGE_LOAD_HELPER_TYPES from './modules/constants';

import {
  clickElement,
  createBrowserAndPage,
  removeElement,
  scrollToBottomUntilNoMoreChanges,
  waitForManualUpdate,
} from './modules/puppeteer';

import {
  readProgressFile,
  writeProgressFile,
} from './modules/files/progress';

const MAX_MORE_EVENTS_CLICKS = 10;

const TIMEOUTS = {
  COOKIE_BUTTON_TIMEOUT_WAIT_MS: 3000,
  POST_COOKIE_BUTTON_CLICK_WAIT_MS: 3000,
  PAGE_LOAD_HELPER_SELECTOR_TIMEOUT_WAIT_MS: 5000,
};

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

// ===================================

// i need to know when this isn't working, so i should store some kind of file
// that tracks previous numbers, and then compares new resuls to that - if they change
// drastically, our page is broken

/**
 * Run the script
 */
(async function main() {
  // load any progress made by a previous run of this script (delete the
  // progress.txt file if you'd like to start from scratch)
  const results = await readProgressFile();
  console.log(results);

  // using the previous results, remove any venues that have already processed from this run
  const venuesToProcess = await loadVenuesToProcess(results, VENUES_CONFIG);

  const { browser, page } = await createBrowserAndPage();

  for (let j = 0; j < venuesToProcess.length; j += 1) {
    const jobConfig = venuesToProcess[j];

    console.log('*****************************************************');
    console.log(`Starting crawl for this venue: ${jobConfig.venue}`);

    const resultsSet = new Set();

    // some sites store their events across different distinct
    // pages, so we process them individually
    for (let i = 0; i < jobConfig.eventUrls.length; i += 1) {
      // Navigate the page to a URL
      await page.goto(jobConfig.eventUrls[i]);

      console.log('Setting up page... ');
      await setupPage(page, jobConfig);

      // the page load helper may result in a redirect to a new page, so we try
      // to dismiss the cookie notification, and disable scroll smoothing again
      console.log('Setting up page again... ');
      await setupPage(page, jobConfig);

      // limit the number of times we can click the "more events" button; some websites will
      // let you browse years into the future, so we need to stop at some point
      let moreEventsCount = 0;

      while (moreEventsCount < MAX_MORE_EVENTS_CLICKS) {
        console.log('Fetching events from page...');
        const events = await page.$$(jobConfig.eventCardSelector);

        await processPageEvents(browser, jobConfig, events, resultsSet);

        const hasLoadedMore = await maybeLoadMore(page, jobConfig);
        if (hasLoadedMore) {
          moreEventsCount += 1;
        } else {
          break;
        }
      }
    }

    results[jobConfig.venue] = Array.from(resultsSet);

    await writeProgressFile(results);
  }

  await browser.close();
}());

/**
 * Attempts to load more content on to the page
 * @param {object} page The browser's page object
 * @param {object} jobConfig config for the properties needed to run a job for a given venue
 * @returns {boolean} Whether more content was loaded
 */
async function maybeLoadMore(page, jobConfig) {
  // if there's nothing more to load, we're done
  if (!jobConfig.loadMoreButtonSelector) {
    console.log('No configured "load more" button');
    return false;
  }

  console.log('Trying to find the "load more" button...');
  // TODO: we should guarantee that the more events button is clicked at least
  // once, otherwise the underlying DOM may have changed and we might miss events
  const loadMoreButton = await page.$(jobConfig.loadMoreButtonSelector);
  if (!loadMoreButton) {
    console.log('Could not find a "load more" button');
    return false;
  }

  console.log('Clicking the "load more" button');
  try {
    await page.click(jobConfig.loadMoreButtonSelector);

    // have to wait for the network to idle before scrolling because the "load more" button
    // can occasionally load a new page entirely, which will cause any scrolling to crash
    await page.waitForNetworkIdleOptional();
  } catch (err) {
    // TODO: handle this better by checking the visibility of the button
    console.log('Failed to click the "load more" button', err);
    return false;
  }

  console.log('Scrolling to the bottom of this page...');
  await scrollToBottomUntilNoMoreChanges(page);

  return true;
}

/**
 * For a given selector of events on the page, process each "card" to get the artist, and date
 * @param {object} browser The browser object
 * @param {object} jobConfig config for the properties needed to run a job for a given venue
 * @param {any} events Handles for all "event cards" on the page
 * @param {Set<object>} resultsSet A set of processed event cards containing an artist and date
 */
async function processPageEvents(browser, jobConfig, events, resultsSet) {
  const task = jobConfig.alternateProcessingConfig
    ? processOutOfPageEvents(browser, jobConfig, events, resultsSet)
    : processInPageEvents(jobConfig, events, resultsSet);

  await task;
}

/**
 * For a given selector of events on the page, process each "card" to get the artist, and date
 * @param {object} jobConfig config for the properties needed to run a job for a given venue
 * @param {any} events Handles for all "event cards" on the page
 * @param {Set<object>} resultsSet A set of processed event cards containing an artist and date
 */
async function processInPageEvents(jobConfig, events, resultsSet) {
  await events.reduce((acc, event) => acc.then(async () => {
    try {
      const artist = await event.$eval(
        jobConfig.eventCardArtistSelector,
        (result) => result.textContent.trim(),
      );

      const date = await event.$eval(
        jobConfig.eventCardDateSelector,
        (result) => result.textContent.trim(),
      );

      const description = jobConfig.eventCardDescriptionSelector ? await event.$eval(
        jobConfig.eventCardDescriptionSelector,
        (result) => result.textContent.trim(),
      ) : undefined;

      console.log('Result: ', JSON.stringify({ artist, date, description }));

      resultsSet.add(JSON.stringify({ artist, date, description }));
    } catch (error) {
      // TODO: Start tracking how many times we fail, and do
      // something when that number is too high
      // This page currently has this issue - https://www.thewaitingroomn16.com/
      console.log('Failed to process event card...', error);
    }
  }), Promise.resolve([]));
}

/**
 * For a given selector of events on the page, find a link to each event
 * page, visit that page, and pull the artist and date
 * @param {object} browser The browser object
 * @param {object} jobConfig config for the properties needed to run a job for a given venue
 * @param {any} events Handles for all "event cards" on the page
 * @param {Set<object>} resultsSet A set of processed event cards containing an artist and date
 */
async function processOutOfPageEvents(browser, jobConfig, events, resultsSet) {
  const links = await events.reduce(async (accumulator, event) => {
    const localAccumulator = await accumulator;

    const link = await event.$eval(
      jobConfig.alternateProcessingConfig.newTabLinkSelector,
      (result) => result.href,
    );

    localAccumulator.push(link);

    return localAccumulator;
  }, []);

  await links.reduce(async (accumulator, link) => {
    const promiseHandle = await accumulator;

    console.log('Create new page to grab event data...');
    const secondPage = await browser.createNewPage();

    console.log('Go to page...');
    await secondPage.gotoWithSafeTimeout(link);

    console.log('Setting up page again... ');
    await setupPage(secondPage, jobConfig);

    // grabbing a handle we know will always exist, then we can re-use the
    // inPageEvent method to pull the single event details from that page
    console.log('Grab page body...');
    const body = await secondPage.$$('body');

    console.log('Processing new page events...');
    await processInPageEvents(jobConfig, body, resultsSet);

    console.log('Closing tab...');
    await secondPage.close();

    return promiseHandle;
  }, []);
}

/**
 * Sets up the page to be ready for scraping
 * @param {object} page The browser page object
 * @param {object} jobConfig config for the properties needed to run a job for a given venue
 */
async function setupPage(page, jobConfig) {
  console.log('Maybe acknowledging cookies...');
  await maybeAcknowledgeCookieModal(page, jobConfig);

  // disables smooth scrolling which can intefere with the programatic scrolling this script does
  console.log('Disabling smooth scrolling...');
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = 'html, body { scroll-behavior: auto !important; }';
    document.head.appendChild(style);
  });

  console.log('Scrolling to the bottom of this page...');
  await scrollToBottomUntilNoMoreChanges(page);

  console.log('Maybe execute page load helpers...');
  await maybeExecutePageLoadHelpers(page, jobConfig.pageLoadHelper);
}

/**
 * Acknowledges a cookie modal if one is present
 * @param {object} page The browser page object
 * @param {object} jobConfig config for the properties needed to run a job for a given venue
 */
async function maybeAcknowledgeCookieModal(page, jobConfig) {
  if (!jobConfig.cookiePolicyModalAcceptButtonSelector) {
    return;
  }

  await clickElement(
    page,
    jobConfig.cookiePolicyModalAcceptButtonSelector,
    TIMEOUTS.COOKIE_BUTTON_TIMEOUT_WAIT_MS,
  );

  // we wait here after acking the cookie because some pages will
  // refresh after clicking it; after refreshing, the DOM won't exist,
  // so the next step of appending the style will crash the app
  await page.waitForTimeout(TIMEOUTS.POST_COOKIE_BUTTON_CLICK_WAIT_MS);
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
      console.log('Running REMOVE_ELEMENT page load helper...');
      await removeElement(
        page,
        helperConfig.options.selector,
      );
      break;
    case PAGE_LOAD_HELPER_TYPES.CLICK_ELEMENT:
      console.log('Running CLICK_ELEMENT page load helper...');
      await clickElement(
        page,
        helperConfig.options.selector,
        TIMEOUTS.PAGE_LOAD_HELPER_SELECTOR_TIMEOUT_WAIT_MS,
      );
      break;
    case PAGE_LOAD_HELPER_TYPES.MANUAL_INTERACTION:
      console.log('Running MANUAL_INTERACTION page load helper...');
      await waitForManualUpdate(
        page,
      );
      break;
    default:
      throw new Error('Unrecognised page load helper');
  }
}

/**
 * Loads the venues that need processing, given how many venues
 * have already been processed
 * @param {object} currentProgressResults A blob representing venues that
 * have already been processed
 * @param {object} configs All of the configs that _could_ be tracked by this script
 * @returns {object} The config that will be processed by our script
 */
async function loadVenuesToProcess(currentProgressResults, configs) {
  const alreadyProcessedVenues = Object.keys(currentProgressResults);

  const venuesToProcess = configs.reduce((acc, config) => {
    if (!alreadyProcessedVenues.includes(config.venue)) {
      acc.push(config);
    }
    return acc;
  }, []);

  return venuesToProcess;
}
