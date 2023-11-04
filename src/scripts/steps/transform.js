/**
 * Module deals with transforming the results into a uniform format
 */

import { VENUE_RESULTS_PARSING_CONFIG } from '../../utils/config';
import { MONTH_INDEX_MAPPING } from '../../utils/constants';

/**
 * Performs a number of transforms on the results
 * @param {object} venueEventsMap The results from scraping the venue sites
 * @returns {any} A modified version of the results, with events that have failed parsing
 *  `results` looks like:
 * {
 *   "The Garage": [
 *     "{\"artist\":\"God Is An Astronaut\",\"date\":\"Sat.28.Oct.23\"}",
 *     "{\"artist\":\"GLITTERFEST HALLOWEEN\",\"date\":\"Sat.28.Oct.23\"}",
 *   ],
 *   "Scala": [
 *     "{\"artist\":\"Sogand, Zakhmi, Kamyar\",\"date\":\"29th October 2023\"}",
 *     "{\"artist\":\"Briston Maroney\",\"date\":\"1st November 2023\"}",
 *     "{\"artist\":\"Strachy na Lachy\",\"date\":\"5th November 2023\"}",
 *   ]
 * }
 */
function transformResults(venueEventsMap) {
  const venueNames = Object.keys(venueEventsMap);

  let troublesomeEvents = {};
  let resultsWithParsedDates = {};

  venueNames.forEach((venue) => {
    console.log(venue);

    // pull the regexes for this venue
    const parsingConfig = VENUE_RESULTS_PARSING_CONFIG.filter((x) => x.venue === venue);

    if (parsingConfig.length !== 1) {
      throw new Error("The following venue doesn't have a parsing config: ", venue);
    }

    // create an entry in each for our venue
    troublesomeEvents[venue] = [];
    resultsWithParsedDates[venue] = [];

    // pull the results for this venue
    let venueEvents = venueEventsMap[venue];

    // pre-process the raw dates and pull anything with a dash into the problems map
    [venueEvents, troublesomeEvents[venue]] = maybeProcessEventsWithRangedDates(
      venueEvents,
      parsingConfig[0].removeRangedEvents,
    );

    const regexes = parsingConfig[0].validationRegex;

    venueEvents.forEach((eventInfo) => {
      // so here we just want the raw results from each regex
      const parsedEventDates = parseEventDates(eventInfo, regexes);

      const regexValidationResults = validateParsedEvents(parsedEventDates);

      const problems = regexValidationResults.filter((x) => !x.isValid);

      // if all regexes fail, we need to flag these events
      if (problems.length === regexes.length) {
        problems.forEach((problem) => {
          troublesomeEvents[venue].push({
            artist: problem.artist,
            date: problem.date,
          });
        });
      } else {
        // we can have multiple "valid" results, so just pick the first one and use that
        const validParsingResult = regexValidationResults.filter((x) => x.isValid)[0];

        resultsWithParsedDates[venue].push({
          date: validParsingResult.parsedDate,
          artist: validParsingResult.artist,
        });
      }
    });
  });

  resultsWithParsedDates = processEachEventArrayAddingYearInfo(resultsWithParsedDates);
  troublesomeEvents = cleanupMap(troublesomeEvents);

  return [resultsWithParsedDates, troublesomeEvents];
}

/**
 * Removes events with date ranges if needed
 * @param {Array<object>} venueEvents array of objects containing the event name and date
 * @param {boolean} shouldProcess whether we should remove dates with ranges
 * @returns {any} the new events we should process, and the events we shouldn't
 */
function maybeProcessEventsWithRangedDates(venueEvents, shouldProcess) {
  if (!shouldProcess) {
    return [venueEvents, []];
  }

  const newVenueEvents = [];
  const problematicEvents = [];

  venueEvents.forEach((event) => {
    // believe it or not, these are different symbols
    if (event.date.includes('-') || event.date.includes('–')) {
      problematicEvents.push(event);
    } else {
      newVenueEvents.push(event);
    }
  });

  return [newVenueEvents, problematicEvents];
}

/**
 * We're going to infer the year for the most part by relying on the month
 * of the event. If the month representing the event becomes less than the
 * previous month, we assume we've moved into the next year.
 * @param {object} resultsWithParsedDates An object mapping venue names to
 * parsing results which look like {date, artist}
 * @returns {object} A similar object, only with the date having a year
 */
function processEachEventArrayAddingYearInfo(resultsWithParsedDates) {
  return Object.keys(resultsWithParsedDates).reduce((acc, key) => {
    const eventInfoArray = resultsWithParsedDates[key];

    let prevMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    const eventInfoArrayWithYears = eventInfoArray.map((event) => {
      const [day, month, maybeYear] = event.date.split(' ');

      let date;

      if (maybeYear) {
        date = `${day} ${month} ${maybeYear}`;
      } else {
        const eventMonthNumber = MONTH_INDEX_MAPPING[month];

        if (eventMonthNumber < prevMonth) {
          currentYear += 1;
        }

        prevMonth = eventMonthNumber;

        date = `${day} ${month} ${currentYear}`;
      }

      return { ...event, date };
    });

    acc[key] = eventInfoArrayWithYears;

    return acc;
  }, {});
}

/**
 * Removes any values in a map containing an empty array
 * @param {object} map target map to clean
 * @returns {object} a cleaned up map
 */
function cleanupMap(map) {
  return Object.keys(map).reduce((acc, key) => {
    if (map[key].length > 0) {
      acc[key] = map[key];
    }
    return acc;
  }, {});
}

/**
 * Checks the result of our parsing attempts to make sure we have a valid date
 * @param {Array<object>} parsedEventDates array of dates we've parsed
 * @returns {object} an object representing the validation result, and the data we pulled
 */
function validateParsedEvents(parsedEventDates) {
  return parsedEventDates.map((
    { parsedDate, date, artist },
  ) => {
    const validationRegex = /\d+ (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/;
    const isResultValid = validationRegex.exec(parsedDate);

    return {
      isValid: isResultValid !== null,
      parsedDate,
      date,
      artist,
    };
  });
}

/**
 * Attempts to parse the date for each event
 * @param {object} eventInfo object containing the event name and date
 * @param {Array<regex>} regexes array of regexes used to parse event date
 * @returns {object} object containing original event data, and the parse result
 */
function parseEventDates(eventInfo, regexes) {
  return regexes.map((regex) => {
    const parsingResult = regex.exec(eventInfo.date);

    if (!parsingResult) {
      return {
        parsedDate: '',
        date: eventInfo.date,
        artist: eventInfo.artist,
      };
    }

    const { day, month, year } = parsingResult.groups;

    // month processing
    const firstThreeLetters = month.slice(0, 3);
    const normalizedMonth = firstThreeLetters
      .charAt(0)
      .toUpperCase()
      + firstThreeLetters
        .slice(1)
        .toLowerCase();

    // day processing
    const actualDay = day.charAt(0) === '0' ? day.charAt(1) : day;

    // pull a value from the year if one exists, default otherwise
    const optionalYear = year || '';

    // resulting date
    return {
      parsedDate: `${actualDay} ${normalizedMonth} ${optionalYear}`,
      date: eventInfo.date,
      artist: eventInfo.artist,
    };
  });
}

export default transformResults;
