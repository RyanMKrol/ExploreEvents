const BLACKLISTED_VENUE_STRINGS = [
  'Guildford',
  'Cranleigh',
  'Orpington',
  'Carshalton',
  'Kingston',
  'Croydon',
  'Dalston',
  'New Cross',
  'Shepperton',
  'Twickenham',
];

/**
 * Filters the data we've collected, removing any events we're not interested in
 * @param {Array<object>} data Looks like [{date, events: [{artist, venue}, ...]}, ...]
 * @returns {Array<object>} the input data with certain items removed
 */
function filterDate(data) {
  const dataFilteredWithBlacklistedVenues = data.map((dateEventsObject) => {
    const { date, events } = dateEventsObject;

    const filteredData = events
      .filter((event) => !BLACKLISTED_VENUE_STRINGS.some((string) => event.venue.includes(string)));

    return { date, events: filteredData };
  });

  return dataFilteredWithBlacklistedVenues;
}

export default filterDate;
