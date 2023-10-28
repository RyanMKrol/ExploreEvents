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

export default createBrowserAndPage;
