/**
 * Module deals with scraping the underlying sites to grab data
 */

/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-unused-vars */

import {
  createBrowserAndPage,
  scrollToBottomUntilNoMoreChanges,
} from '../../utils/puppeteer';

const MAX_MORE_EVENTS_CLICKS = 10;
const LONDON_CONCERTS_PAGE = 'https://www.songkick.com/metro-areas/24426-uk-london';

const SELECTORS = {
  DATE_PICKERS: '.datepicker-container',
  DATE_PICKER_SELECT_YEAR: '.ui-datepicker-year',
  DATE_PICKER_SELECT_MONTH: '.ui-datepicker-month',
  DATE_PICKER_SUBMIT: '.datepicker-submit',
  LOAD_MORE_BUTTON: '.next_page:not(.disabled)',
  EVENT_LIST_CONTAINER: '.metro-area-calendar-listings',
  ACCEPT_COOKIES_BUTTON: '#onetrust-accept-btn-handler',
};

const TIMEOUTS = {
  POST_COOKIE_ACK_WAIT_MS: 3000,
  POST_DATE_PICKER_ELEMENT_CLICK_WAIT_MS: 1000,
  POST_PAGE_LOAD_WAIT_MS: 5000,
};

/**
 * Scrape the list of concerts for a given date
 * @param {string} date The date to grab the concerts for
 * @returns {object} A big blob of concert data
 */
async function scrapeConcertList(date) {
  const { browser, page } = await createBrowserAndPage();

  // Navigate the page to a URL
  await page.goto(LONDON_CONCERTS_PAGE);

  console.log('Waiting for the page to load');
  await page.waitForTimeout(TIMEOUTS.POST_PAGE_LOAD_WAIT_MS);

  console.log('Acknowledgeing the cookie modal');
  await maybeAcknowledgeCookieModal(page);

  console.log('Setting up the date ranges');
  await setupPagesDateRange(page, date);

  // limit the number of times we can click the "more events" button; some websites will
  // let you browse years into the future, so we need to stop at some point
  let moreEventsCount = 0;

  console.log('Parsing events');
  while (moreEventsCount < MAX_MORE_EVENTS_CLICKS) {
    console.log('Setting up page... ');
    await setupPage(page);

    console.log('Fetching events from page...');
    const events = await page.$$(SELECTORS.EVENT_LIST_CONTAINER);

    // grab the results

    const hasLoadedMore = await maybeLoadMore(page);
    if (hasLoadedMore) {
      moreEventsCount += 1;
    } else {
      break;
    }
  }
}

/**
 *
 * @param page
 * @param date
 */
async function setupPagesDateRange(page, date) {
  // select date pickers
  const datePickers = await page.$$(SELECTORS.DATE_PICKERS);

  // there should be two date selectors, a "from", and a "to"
  if (datePickers.length !== 2) {
    throw new Error('Unexpected number of date pickers', datePickers.length);
  }

  // select the "from", and "to"
  await selectMonthAndYear(page, datePickers[0], date);
  await selectMonthAndYear(page, datePickers[1], date);

  // submit the range
  const submitDateRangeButton = await page.$(SELECTORS.DATE_PICKER_SUBMIT);
  if (!submitDateRangeButton) {
    throw new Error("Couldn't find button to submit date range");
  }

  await submitDateRangeButton.click();

  await page.waitForTimeout(TIMEOUTS.POST_PAGE_LOAD_WAIT_MS);
}

/**
 *
 * @param datePickerElement
 * @param page
 * @param date
 */
async function selectMonthAndYear(page, datePickerElement, date) {
  await datePickerElement.click();
  await page.waitForTimeout(TIMEOUTS.POST_DATE_PICKER_ELEMENT_CLICK_WAIT_MS);

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  await page.select(SELECTORS.DATE_PICKER_SELECT_YEAR, `${year}`);
  await page.select(SELECTORS.DATE_PICKER_SELECT_MONTH, `${month}`);

  const dayElement = await page.$x(`//a[text()='${day}']`);

  if (dayElement.length !== 1) {
    throw new Error("Couldn't find day selector");
  }

  await dayElement[0].click();
}

/**
 * Acknowledges a cookie modal if one is present
 * @param {object} page The browser page object
 */
async function maybeAcknowledgeCookieModal(page) {
  const element = await page.waitForSelectorOptional(
    SELECTORS.ACCEPT_COOKIES_BUTTON,
    TIMEOUTS.POST_COOKIE_ACK_WAIT_MS,
  );

  await element?.evaluate((el) => el.click());

  // wait to make sure the page settles after acking cookies
  await page.waitForTimeout(TIMEOUTS.POST_COOKIE_ACK_WAIT_MS);
}

/**
 * Attempts to load more content on to the page
 * @param {object} page The browser's page object
 * @returns {boolean} Whether more content was loaded
 */
async function maybeLoadMore(page) {
  console.log('Trying to find the "load more" button...');
  // TODO: we should guarantee that the more events button is clicked at least
  // once, otherwise the underlying DOM may have changed and we might miss events
  const loadMoreButton = await page.$(SELECTORS.LOAD_MORE_BUTTON);
  if (!loadMoreButton) {
    console.log('Could not find a "load more" button');
    return false;
  }

  try {
    console.log('Clicking the "load more" button');
    await page.click(SELECTORS.LOAD_MORE_BUTTON);

    console.log('Waiting for page load to settle');
    await page.waitForTimeout(TIMEOUTS.POST_PAGE_LOAD_WAIT_MS);
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
 * Sets up the page to be ready for scraping
 * @param {object} page The browser page object
 */
async function setupPage(page) {
  // disables smooth scrolling which can intefere with the programatic scrolling this script does
  console.log('Disabling smooth scrolling...');
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = 'html, body { scroll-behavior: auto !important; }';
    document.head.appendChild(style);
  });

  console.log('Scrolling to the bottom of this page...');
  await scrollToBottomUntilNoMoreChanges(page);
}

export default scrapeConcertList;
