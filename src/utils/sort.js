/**
 * Sorts an array of strings in the format dd-mm-yyyy in descending order
 * @param {Array<string>} dateStrings An array of date strings
 * @returns {Array<string>} An array of date strings in descending order
 */
function sortDates(dateStrings) {
  return dateStrings.sort((a, b) => {
    // Split the date string into [dd, mm, yyyy]
    const partsA = a.split('-').map(Number);
    const partsB = b.split('-').map(Number);

    // Create date objects
    const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]);
    const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]);

    // Compare the date objects
    return dateB - dateA;
  });
}

export default sortDates;
