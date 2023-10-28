/* eslint-disable no-await-in-loop */

import puppeteer from 'puppeteer';

/**
 * Sets up a browser and page object
 * @returns {object} An object containing a browser and page
 */
async function createBrowserAndPage() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  // create a method to wait for optional elements
  page.waitForSelectorOptional = async function waitForSelectorOptional(selector, timeoutMs) {
    const element = await Promise.race([
      this.waitForSelector(selector, { timeout: 0 }),
      new Promise((resolve) => { setTimeout(() => resolve(), timeoutMs); }),
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

  return { browser, page };
}

/**
 * Removes an element from the page using a selector
 * @param {object} page The browser page object
 * @param {string} selector String to access the item you want to remove
 */
async function removeElement(page, selector) {
  await page.evaluate((x) => {
    const element = document.querySelector(x);
    if (element) {
      element.parentNode.removeChild(element);
    }
  }, selector);
}

/**
 * Dismisses an element from the page using a selector
 * @param {object} page The browser page object
 * @param {string} selector String to access the item you want to dismiss
 * @param timeout
 */
async function clickElement(page, selector, timeout) {
  const element = await page.waitForSelectorOptional(
    selector,
    timeout,
  );

  await element?.evaluate((el) => el.click());
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
      const SCROLL_DISTANCE_PER_TICK = 2000;

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
  clickElement,
  createBrowserAndPage,
  removeElement,
  scrollToBottomUntilNoMoreChanges,
};
