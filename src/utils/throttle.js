import sleep from './sleep';

/**
 * Calls a function a number of times per second across a series of items
 * @param {Function} func function to call
 * @param {Array<any>} items items to call the function on
 * @param {number} callsPerSecond how many calls per second
 */
async function callFunctionOnItemsWithThrottle(func, items, callsPerSecond) {
  const waitTime = 1000 / callsPerSecond;

  await items.reduce(async (acc, item) => {
    await acc;
    await func(item);
    await sleep(waitTime);
    return acc;
  }, Promise.resolve());
}

export default callFunctionOnItemsWithThrottle;
