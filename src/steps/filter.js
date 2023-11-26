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
  'The Windmill',
];

/**
 * Filters the data we've collected, removing any events we're not interested in
 * @param {Array<object>} events Looks like [{artist, venue, eventsUrl}, ...]
 * @returns {Array<object>} the input data with certain items removed
 */
function filterDate(events) {
  return events
    .filter((event) => !BLACKLISTED_VENUE_STRINGS.some((string) => event.venue.includes(string)));
}

export default filterDate;
