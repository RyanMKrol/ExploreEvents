/**
 * Produces pretty text from the website's raw data
 * @param {object} data Raw data from the site scraper
 */
export default function reportOutput(data) {
  console.log(data);
  printManualCheckReminders();
}

/**
 * Prints a reminder to check these websites manually as they're not supported by this tool yet
 */
function printManualCheckReminders() {
  const manualCheckSites = [
    'https://www.corsicastudios.com/calendar/corsica-studios',
    'https://www.thelexington.co.uk/events.php',
    'https://drumshedslondon.com/whats-on/',
  ];

  console.log(`Don't forget to check the following sites!\n${manualCheckSites.join('\n')}`);
}
