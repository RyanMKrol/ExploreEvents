/* eslint-disable no-promise-executor-return */

/**
 * Method to sleep for x milliseconds
 * @param {number} milliseconds how long to wait
 */
async function sleepMs(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export default sleepMs;
