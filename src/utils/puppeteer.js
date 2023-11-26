/* eslint-disable no-await-in-loop */

import puppeteer from 'puppeteer';

/**
 * Sets up a browser and page object
 * @returns {object} An object containing a browser and page
 */
async function createBrowserAndPage() {
  const browserParams = process.env.DEV === '1'
    ? { headless: false }
    : { executablePath: '/usr/bin/chromium-browser' };

  const browser = await puppeteer.launch(browserParams);

  browser.createNewPage = async function createNewPage() {
    const page = await this.newPage();

    // create a method to wait for optional elements
    page.waitForSelectorOptional = async function waitForSelectorOptional(selector, timeoutMs) {
      const element = await Promise.race([
        this.waitForSelector(selector, { timeout: 0 }),
        new Promise((resolve) => { setTimeout(() => resolve(), timeoutMs); }),
      ]);

      return element;
    };

    // create a method to wait for optional elements
    page.gotoWithSafeTimeout = async function gotoWithSafeTimeout(url) {
      const element = await Promise.race([
        this.goto(url),
        new Promise((resolve) => { setTimeout(() => resolve(), 3000); }),
      ]);

      return element;
    };

    // generally we don't need the network to actually idle, 15s is usually more than enough,
    // but if the network idle's before then, we can go even faster!
    // Note: in most cases, the network will idle before the 15s timeout
    page.waitForNetworkIdleOptional = async function waitForNetworkIdleOptional(timeoutMs = 15000) {
      await Promise.race([
        this.waitForNetworkIdle(),
        new Promise((resolve) => { setTimeout(() => resolve(), timeoutMs); }),
      ]);
    };

    // method to pause execution of the script until the user manually unsets the isPaused variable
    page.pause = async function pause() {
      await page.evaluate(() => {
        window.isPaused = true;
      });

      // Log a message to indicate that the script is paused
      console.log('Script is paused. Set window.isPaused = false in the browser console to resume.');

      // Wait for the global variable to be set to false
      await page.waitForFunction(() => !window.isPaused);

      // in cases where this manual pause is needed, the page can often
      // redirect, so we need to wait for that DOM to load to continue
      await page.waitForTimeout(3000);
    };

    return page;
  };

  const page = await browser.createNewPage();

  // Set screen size
  await page.setViewport({ width: 1080, height: 1080 });

  return { browser, page };
}

/**
 * Keeps scrolling to the bottom of the page until we're unable to scroll anymore
 * @param {object} page The browser page object
 */
async function scrollToBottomUntilNoMoreChanges(page) {
  const MAX_RETRIES = 3;
  const TIME_BETWEEN_RETRIES_MS = 1000;

  let previousHeight;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);

    if (previousHeight !== currentHeight) {
      previousHeight = currentHeight;
      await scrollUntilStopping(page);
      retries = 0;
    } else {
      await page.waitForTimeout(TIME_BETWEEN_RETRIES_MS);
      retries += 1;
    }
  }
}

/**
 * Responsible for scrolling as far as the page will allow
 * @param {object} page The browser page object
 */
async function scrollUntilStopping(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      const TIME_BETWEEN_TICKS = 50;
      const SCROLL_DISTANCE_PER_TICK = 500;

      let totalHeight = 0;
      const timer = setInterval(() => {
        const { scrollHeight } = document.body;
        window.scrollBy(0, SCROLL_DISTANCE_PER_TICK, { behavior: 'instant' });
        totalHeight += SCROLL_DISTANCE_PER_TICK;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, TIME_BETWEEN_TICKS);
    });
  });
}

export {
  createBrowserAndPage,
  scrollToBottomUntilNoMoreChanges,
};
