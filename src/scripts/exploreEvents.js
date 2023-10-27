#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */

import puppeteer from 'puppeteer';

const TIMEOUTS = {
  COOKIE_BUTTON_TIMEOUT_WAIT_MS: 3000,
  PAGE_LOAD_HELPER_SELECTOR_TIMEOUT_WAIT_MS: 5000,
};

const PAGE_LOAD_HELPER_TYPES = {
  SCROLL_TILL_DONE: 1,
  REMOVE_ELEMENT: 2,
  DISMISS_ELEMENT: 3,
};

const CONFIG_Roundhouse = {
  venue: 'Roundhouse',
  eventUrls: ['https://www.roundhouse.org.uk/whats-on/?type=event'],
  eventCardSelector: '.event-card',
  eventCardArtistSelector: '.event-card__title',
  eventCardDateSelector: '.event-card__details',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: '.button--loadmore',
  cookiePolicyModalAcceptButtonSelector: '.cookie-policy__popup .button--primary',
  pageLoadHelper: {
    type: PAGE_LOAD_HELPER_TYPES.REMOVE_ELEMENT,
    options: {
      selector: '.filters-bar',
    },
  },
};

const CONFIG_EartH = {
  venue: 'EartH',
  eventUrls: ['https://earthackney.co.uk/events/'],
  eventCardSelector: '.list--events__item',
  eventCardArtistSelector: '.list--events__item__title',
  eventCardDateSelector: '.list--events__item__dates > time:nth-child(1)',
  eventCardDescriptionSelector: '.list--events__item__description',
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_VillageUnderground = {
  venue: 'Village Underground',
  eventUrls: ['https://villageunderground.co.uk/events/'],
  eventCardSelector: '.list--events__item',
  eventCardArtistSelector: '.list--events__item__title',
  eventCardDateSelector: '.list--events__item__dates > time:nth-child(1)',
  eventCardDescriptionSelector: '.list--events__item__description',
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_TheO2 = {
  venue: 'The O2',
  eventUrls: ['https://www.theo2.co.uk/events/venue/the-o2-arena'],
  eventCardSelector: '.eventItem',
  eventCardArtistSelector: 'h3',
  eventCardDateSelector: '.date.divider-date',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: '#loadMoreEvents',
  cookiePolicyModalAcceptButtonSelector: '#onetrust-button-group #onetrust-accept-btn-handler',
};

const CONFIG_Omeara = {
  venue: 'Omeara',
  eventUrls: ['https://omearalondon.com/events/?event-type=live&currentpage=1'],
  eventCardSelector: '.events-grid-view__event-card',
  eventCardArtistSelector: '.event-title',
  eventCardDateSelector: '.event-date',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: '.cky-btn-accept',
};

const CONFIG_UnionChapel = {
  venue: 'Union Chapel',
  eventUrls: ['https://unionchapel.org.uk/whats-on'],
  eventCardSelector: '.card',
  eventCardArtistSelector: '.card-inner > p.card-title',
  eventCardDateSelector: '.card-inner > p > strong',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: '#cookiescript_accept',
};

const CONFIG_TheShacklewellArms = {
  venue: 'The Shacklewell Arms',
  eventUrls: ['https://www.shacklewellarms.com/events'],
  eventCardSelector: '.dice_events article',
  eventCardArtistSelector: '.dice_event-title',
  eventCardDateSelector: 'time',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: '.dice_load-more',
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_HereAtOuternet = {
  venue: 'HERE at Outernet',
  eventUrls: ['https://dice.fm/venue/here-at-outernet-wgbx'],
  eventCardSelector: '[class*=EventParts__EventBlock]',
  eventCardArtistSelector: '[class*=EventParts__EventName]',
  eventCardDateSelector: '[class*=EventParts__EventDate]',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: '[class*=idOrSlug__MoreButton]',
  cookiePolicyModalAcceptButtonSelector: '.ch2-dialog-actions .ch2-btn-primary',
};

const CONFIG_Troxy = {
  venue: 'Troxy',
  eventUrls: ['https://troxy.co.uk/whats-on/'],
  eventCardSelector: '.events-col',
  eventCardArtistSelector: 'h3',
  eventCardDateSelector: '.date-and-title',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_BushHall = {
  venue: 'Bush Hall',
  eventUrls: ['https://bushhallmusic.co.uk/pages/whats-on'],
  eventCardSelector: '.dice-widget article',
  eventCardArtistSelector: '.dice_event-title',
  eventCardDateSelector: 'time',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_MothClub = {
  venue: 'MOTH Club',
  eventUrls: ['https://mothclub.co.uk/events'],
  eventCardSelector: '.dice-widget article',
  eventCardArtistSelector: '.dice_event-title',
  eventCardDateSelector: 'time',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: '.dice_load-more',
  cookiePolicyModalAcceptButtonSelector: '.mc-closeModal',
};

const CONFIG_TheBlackHeart = {
  venue: 'The Black Heart',
  eventUrls: ['https://www.ourblackheart.com/upcoming-events'],
  eventCardSelector: '.summary-item',
  eventCardArtistSelector: '.summary-title',
  eventCardDateSelector: '.summary-thumbnail-event-date-inner',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_TheWaitingRoom = {
  venue: 'The Waiting Room',
  eventUrls: ['https://www.thewaitingroomn16.com/'],
  eventCardSelector: '.grid-item',
  eventCardArtistSelector: '.event_title',
  eventCardDateSelector: '.date_time',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_barbican = {
  venue: 'barbican',
  eventUrls: ['https://www.barbican.org.uk/whats-on/contemporary-music'],
  eventCardSelector: 'article.listing--event',
  eventCardArtistSelector: '.listing-title--event',
  eventCardDateSelector: '.listing-date',
  eventCardDescriptionSelector: '.search-listing__intro div:nth-child(2)',
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: '.cookie-notice .cm-btn-success',
};

const CONFIG_TheGarage = {
  venue: 'The Garage',
  eventUrls: ['https://www.thegarage.london/live/'],
  eventCardSelector: '.card--full',
  eventCardArtistSelector: '.card__heading',
  eventCardDateSelector: 'h6',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: '.button__close',
};

const CONFIG_Scala = {
  venue: 'Scala',
  eventUrls: ['https://scala.co.uk/events/categories/live-music/'],
  eventCardSelector: '.tb-event-item',
  eventCardArtistSelector: 'h2',
  eventCardDateSelector: '.date',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_Koko = {
  venue: 'KOKO',
  eventUrls: ['https://www.koko.co.uk/whats-on'],
  eventCardSelector: '[class*=Event_component]',
  eventCardArtistSelector: '[class*=Event_title]',
  eventCardDateSelector: '[class*=Event_date]',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_ElectricBallroom = {
  venue: 'Electric Ballroom',
  eventUrls: ['https://electricballroom.co.uk/whats-on/'],
  eventCardSelector: '.card',
  eventCardArtistSelector: 'h2',
  eventCardDateSelector: '.event-date',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_EventimApollo = {
  venue: 'Eventim Apollo',
  eventUrls: ['https://www.eventimapollo.com/events',
    'https://www.eventimapollo.com/events/m/1/#month-filters',
    'https://www.eventimapollo.com/events/m/2/#month-filters',
    'https://www.eventimapollo.com/events/m/3/#month-filters',
    'https://www.eventimapollo.com/events/m/4/#month-filters',
    'https://www.eventimapollo.com/events/m/5/#month-filters',
    'https://www.eventimapollo.com/events/m/6/#month-filters',
    'https://www.eventimapollo.com/events/m/7/#month-filters',
    'https://www.eventimapollo.com/events/m/8/#month-filters',
    'https://www.eventimapollo.com/events/m/9/#month-filters',
    'https://www.eventimapollo.com/events/m/10/#month-filters',
  ],
  eventCardSelector: '.card',
  eventCardArtistSelector: 'h3',
  eventCardDateSelector: '.date',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: '.event-index__load-more',
  cookiePolicyModalAcceptButtonSelector: '#onetrust-accept-btn-handler',
};

const CONFIG_AlexandraPalace = {
  venue: 'Alexandra Palace',
  eventUrls: ['https://www.alexandrapalace.com/whats-on/'],
  eventCardSelector: '[class*=whats-on-item]:not(.past-event)',
  eventCardArtistSelector: 'h3',
  eventCardDateSelector: '.dates',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_TheLowerThird = {
  venue: 'The Lower Third',
  eventUrls: ['https://dice.fm/venue/the-lower-third-pply'],
  eventCardSelector: '[class*=EventParts__EventBlock]',
  eventCardArtistSelector: '[class*=EventParts__EventName]',
  eventCardDateSelector: '[class*=EventParts__EventDate]',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: '[class*=idOrSlug__MoreButton]',
  cookiePolicyModalAcceptButtonSelector: '.ch2-dialog-actions .ch2-btn-primary',
};

const CONFIG_IslingtonAssemblyHall = {
  venue: 'Islington Assembly Hall',
  eventUrls: ['https://islingtonassemblyhall.co.uk/events/'],
  eventCardSelector: '.event__item',
  eventCardArtistSelector: '.event__item__title',
  eventCardDateSelector: '.event__item__date',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_TheDome = {
  venue: 'The Dome',
  eventUrls: ['https://domelondon.co.uk/all-events'],
  eventCardSelector: 'article[class*=eventlist-event]:not(.eventlist-event--past)',
  eventCardArtistSelector: 'h1.eventlist-title',
  eventCardDateSelector: 'time.event-date',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: '.sqs-cookie-banner-v2-accept',
};

const CONFIG_Wembley = {
  venue: 'Wembley Stadium',
  eventUrls: ['https://www.wembleystadium.com/events'],
  eventCardSelector: '.fa-filter-content__item',
  eventCardArtistSelector: 'h2',
  eventCardDateSelector: '.fa-content-promo__content span.small-text',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: '#onetrust-accept-btn-handler',
};

const CONFIG_OvoArena = {
  venue: 'Ovo Arena',
  eventUrls: ['https://www.ovoarena.co.uk/events'],
  eventCardSelector: '.eventItemWrapperEvent',
  eventCardArtistSelector: '.title',
  eventCardDateSelector: '.date',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: '#loadMoreEvents',
  cookiePolicyModalAcceptButtonSelector: '.cc-compliance .cc-allow',
};

const CONFIG_SouthBankCentre = {
  venue: 'South Bank Centre',
  eventUrls: ['https://www.southbankcentre.co.uk/whats-on?type=gigs'],
  eventCardSelector: '.arrangement-card__container',
  eventCardArtistSelector: '.arrangement-card__title',
  eventCardDateSelector: '.arrangement-card__date',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
  pageLoadHelper: {
    type: PAGE_LOAD_HELPER_TYPES.DISMISS_ELEMENT,
    options: {
      selector: '.newsletter-modal__close',
    },
  },
};

const CONFIG = CONFIG_SouthBankCentre;

// need a system to grab details from the event page
// https:// www.academymusicgroup.com/o2shepherdsbushempire/events/all
// https://www.academymusicgroup.com/o2forumkentishtown/events/all

// need a system to get around captcha:
// https://www.royalalberthall.com/tickets/

(async function main() {
  // Launch the browser and open a new blank page
  const { browser, page } = await createBrowserAndPage();

  const resultsSet = new Set();

  // some sites store their events across different distinct pages, so we process them individually
  for (let i = 0; i < CONFIG.eventUrls.length; i += 1) {
    // Navigate the page to a URL
    await page.goto(CONFIG.eventUrls[i]);

    console.log('setting up page... ');
    await setupPage(page);

    console.log('Scrolling to the bottom of this page...');
    await scrollToBottomUntilNoMoreChanges(page);
    console.log('Finished scrolling to the bottom of the page');

    console.log('waiting for page to load...');
    await page.waitForNetworkIdle();
    console.log('page has loaded');

    console.log('maybe execute page load helpers...');
    await maybeExecutePageLoadHelpers(page, CONFIG.pageLoadHelper);
    console.log('page load helpers done');

    while (true) {
      console.log('waiting to fetch events from page...');
      const events = await page.$$(CONFIG.eventCardSelector);
      console.log('events have loaded');

      await events.reduce((acc, event) => acc.then(async () => {
        try {
          const artist = await event.$eval(
            CONFIG.eventCardArtistSelector,
            (result) => result.textContent.trim(),
          );
          console.log(artist);

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
        await page.click(CONFIG.loadMoreButtonSelector);
      } catch (err) {
      // TODO: handle this better by checking the visibility of the button
        console.log("the load more button likely wasn't visible, so this failed");
        break;
      }

      console.log('Scrolling to the bottom of this page...');
      await scrollToBottomUntilNoMoreChanges(page);
      console.log('Finished scrolling to the bottom of the page');

      // wait for the new events to load after loading more
      console.log('waiting for the page to load everything new');
      await page.waitForNetworkIdle();
    }
    console.log(resultsSet, resultsSet.size);
  }

  await browser.close();
}());

/**
 * Sets up the page to be ready for scraping
 * @param {object} page The browser page object
 */
async function setupPage(page) {
  console.log('maybe aknowledging cookies...');
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

  const cookieButton = await page.waitForSelectorOptional(
    CONFIG.cookiePolicyModalAcceptButtonSelector,
    TIMEOUTS.COOKIE_BUTTON_TIMEOUT_WAIT_MS,
  );

  console.log('maybe doing something with the cookie button');
  await cookieButton?.evaluate((el) => el.click());
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
      await removeElement(page, helperConfig.options.selector);
      break;
    case PAGE_LOAD_HELPER_TYPES.DISMISS_ELEMENT:
      await dismissElement(page, helperConfig.options.selector);
      break;
    default:
      console.log('Doing nothing extra to load the page');
      break;
  }
}

/**
 * Dismisses an element from the page using a selector
 * @param {object} page The browser page object
 * @param {string} selector String to access the item you want to dismiss
 */
async function dismissElement(page, selector) {
  const element = await page.waitForSelectorOptional(
    selector,
    TIMEOUTS.PAGE_LOAD_HELPER_SELECTOR_TIMEOUT_WAIT_MS,
  );

  await element?.evaluate((el) => el.click());
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
 * Keeps scrolling to the bottom of the page until we're unable to scroll anymore
 * @param {object} page The browser page object
 */
async function scrollToBottomUntilNoMoreChanges(page) {
  const MAX_RETRIES = 3;
  const TIME_BETWEEN_RETRIES_MS = 1000;

  let previousHeight;
  let retries = 0;

  while (true) {
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);

    if (previousHeight !== currentHeight) {
      previousHeight = currentHeight;
      await autoScroll(page);
      retries = 0;
    } else {
      if (retries >= MAX_RETRIES) { // wait for 3 cycles to ensure no more changes
        break;
      }
      await page.waitForTimeout(TIME_BETWEEN_RETRIES_MS);
      retries += 1;
    }
  }
}

/**
 * Responsible for scrolling as far as the page will allow
 * @param {object} page The browser page object
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
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
  page.waitForSelectorOptional = async function waitForSelectorOptional(selector, timeout) {
    const element = await Promise.race([
      this.waitForSelector(selector, { timeout: 0 }),
      new Promise((resolve) => { setTimeout(() => resolve(), timeout); }),
    ]);

    return element;
  };

  return { browser, page };
}
