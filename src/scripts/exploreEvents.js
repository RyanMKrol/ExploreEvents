#!/usr/bin/env node

/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */

import puppeteer from 'puppeteer';

import reportOutput from './modules/reporting';

const MAX_MORE_EVENTS_CLICKS = 10;
const TIMEOUTS = {
  COOKIE_BUTTON_TIMEOUT_WAIT_MS: 3000,
  PAGE_LOAD_HELPER_SELECTOR_TIMEOUT_WAIT_MS: 5000,
};

const PAGE_LOAD_HELPER_TYPES = {
  SCROLL_TILL_DONE: 1,
  REMOVE_ELEMENT: 2,
  CLICK_ELEMENT: 3,
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
    type: PAGE_LOAD_HELPER_TYPES.CLICK_ELEMENT,
    options: {
      selector: '.newsletter-modal__close',
    },
  },
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

const CONFIG_Dingwalls = {
  venue: 'Dingwalls',
  eventUrls: ['https://powerhauscamden.com/whats-on/'],
  eventCardSelector: 'section.page__content > div',
  eventCardArtistSelector: '.feed__title',
  eventCardDateSelector: 'p',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: '#ccc-notify-accept',
};

const CONFIG_TheUnderworld = {
  venue: 'The Underworld',
  eventUrls: ['https://www.theunderworldcamden.co.uk/'],
  eventCardSelector: '#gigs article',
  eventCardArtistSelector: '.list-header-title',
  eventCardDateSelector: '.list-header-date',
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

const CONFIG_TheCamdenAssembly = {
  venue: 'The Camden Assembly',
  eventUrls: ['https://www.camdenassembly.com/live-shows/'],
  eventCardSelector: '.upcommingevents .elementor-posts article',
  eventCardArtistSelector: '.elementor-post__title',
  eventCardDateSelector: '.elementor-post__excerpt',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_OSLO = {
  venue: 'OSLO',
  eventUrls: ['https://www.oslohackney.com/events/'],
  eventCardSelector: '.card--full',
  eventCardArtistSelector: '.card__heading',
  eventCardDateSelector: 'h6',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_Colours = {
  venue: 'Colours',
  eventUrls: ['https://colourshoxton.com/live-club/'],
  eventCardSelector: 'div.tw-section',
  eventCardArtistSelector: '.tw-name',
  eventCardDateSelector: '.tw-date-time',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: 'span.next a',
  cookiePolicyModalAcceptButtonSelector: undefined,
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

const CONFIG_NottingHillArtsClub = {
  venue: 'Notting Hill Arts Club',
  eventUrls: [
    'https://nottinghillartsclub.com/events-list/?filter[month]=2023-10',
    'https://nottinghillartsclub.com/events-list/?filter[month]=2023-11',
    'https://nottinghillartsclub.com/events-list/?filter[month]=2023-12',
    'https://nottinghillartsclub.com/events-list/?filter[month]=2024-01',
    'https://nottinghillartsclub.com/events-list/?filter[month]=2024-02',
    'https://nottinghillartsclub.com/events-list/?filter[month]=2024-03',
    'https://nottinghillartsclub.com/events-list/?filter[month]=2024-04',
    'https://nottinghillartsclub.com/events-list/?filter[month]=2024-05',
  ],
  eventCardSelector: '.event',
  eventCardArtistSelector: '.title',
  eventCardDateSelector: '.eventlist-datetag-startdate',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_PaperDressVintage = {
  venue: 'Paper Dress Vintage',
  eventUrls: ['https://paperdressvintage.co.uk/by-night'],
  eventCardSelector: '.events__event',
  eventCardArtistSelector: 'h4',
  eventCardDateSelector: 'p',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_TheOldBlueLast = {
  venue: 'The Old Blue Last',
  eventUrls: ['https://www.theoldbluelast.com/'],
  eventCardSelector: '.dice-widget article',
  eventCardArtistSelector: '.dice_event-title',
  eventCardDateSelector: 'time',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: '.dice_load-more',
  cookiePolicyModalAcceptButtonSelector: undefined,
  pageLoadHelper: {
    type: PAGE_LOAD_HELPER_TYPES.CLICK_ELEMENT,
    options: {
      selector: '.sqs-popup-overlay-close',
    },
  },
};

const CONFIG_TheGrace = {
  venue: 'The Grace',
  eventUrls: ['https://www.thegrace.london/whats-on/'],
  eventCardSelector: '.card--full',
  eventCardArtistSelector: '.card__heading',
  eventCardDateSelector: 'h6',
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

const CONFIG_TheHundredClub = {
  venue: 'The 100 Club',
  eventUrls: ['https://www.the100club.co.uk/events-calendar/'],
  eventCardSelector: 'div.fc-event-list-content',
  eventCardArtistSelector: 'h4',
  eventCardDateSelector: '.fc-event-list-description h5',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_Lafayette = {
  venue: 'Lafayette',
  eventUrls: ['https://www.lafayettelondon.com/'],
  eventCardSelector: 'div.event_listings .polaroid_blocks li',
  eventCardArtistSelector: 'h1',
  eventCardDateSelector: '.date',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_ElectricBrixton = {
  venue: 'Electric Brixton',
  eventUrls: ['https://www.electricbrixton.uk.com/events/'],
  eventCardSelector: '#whats-on-events .fl-post-column',
  eventCardArtistSelector: 'h3.event-title',
  eventCardDateSelector: 'h4.event-date',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: '.fl-builder-pagination-load-more a',
  cookiePolicyModalAcceptButtonSelector: '#wt-cli-accept-all-btn',
};

const CONFIG_TheBlackHeart = {
  venue: 'The Black Heart',
  eventUrls: ['https://www.ourblackheart.com/events'],
  eventCardSelector: 'article.eventlist-event',
  eventCardArtistSelector: 'h1',
  eventCardDateSelector: '.eventlist-datetag-inner',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_TheSebrightArms = {
  venue: 'The Sebright Arms',
  eventUrls: ['https://www.sebrightarms.com/'],
  eventCardSelector: '#dice-event-list-widget article',
  eventCardArtistSelector: '.dice_event-title',
  eventCardDateSelector: 'time',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: '.dice_load-more',
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_TheSocial = {
  venue: 'The Social',
  eventUrls: ['https://www.thesocial.com/events/'],
  eventCardSelector: '#evcal_list .desc_trig_outter',
  eventCardArtistSelector: 'span.evcal_event_title',
  eventCardDateSelector: '.evo_start',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: '#evcal_next',
  cookiePolicyModalAcceptButtonSelector: undefined,
};

const CONFIG_TheJazzCafe = {
  venue: 'The Jazz Cafe',
  eventUrls: ['https://thejazzcafelondon.com/whats-on/'],
  eventCardSelector: '#events-list .event',
  eventCardArtistSelector: 'h2.event-title',
  eventCardDateSelector: '.event-date',
  eventCardDescriptionSelector: undefined,
  loadMoreButtonSelector: undefined,
  cookiePolicyModalAcceptButtonSelector: '.overlay-buttons #js-gdpr-accept',
};

const CONFIG = CONFIG_TheJazzCafe;

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

    reportOutput({ resultsSet, size: resultsSet.size });
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

  // we wait here after acking the cookie because some pages will
  // refresh after clicking it; after refreshing, the DOM won't exist,
  // so the next step of appending the style will crash the app
  await pauseBrowser(page, 1000);

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
    case PAGE_LOAD_HELPER_TYPES.CLICK_ELEMENT:
      await clickElement(page, helperConfig.options.selector);
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
async function clickElement(page, selector) {
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
