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
 * @param {Array<object>} data Looks like [{artist, venue}, ...]
 * @returns {Array<object>} the input data with certain items removed
 */
function filterDate(data) {
  const dataFilteredWithBlacklistedVenues = Object.keys(data).reduce((acc, date) => {
    const eventData = data[date];
    const filteredData = eventData
      .filter((event) => !BLACKLISTED_VENUE_STRINGS.some((string) => event.venue.includes(string)));

    acc[date] = filteredData;
    return acc;
  }, {});

  return dataFilteredWithBlacklistedVenues;
}

export default filterDate;
