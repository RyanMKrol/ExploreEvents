import AWS from 'aws-sdk';
import 'dotenv/config';

import callFunctionOnItemsWithThrottle from '../throttle';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const DYNAMO_CLIENT = new AWS.DynamoDB.DocumentClient();
const MAX_WRITES_PER_SECOND = 5;

/**
 * Scan given table, fetching all items
 * @param {string} tableName name of table
 * @returns {Promise<Array<object>>} all of the items in the table
 */
async function scanTable(tableName) {
  const params = { TableName: tableName };

  return DYNAMO_CLIENT.scan(params).promise().then((data) => data.Items).catch((err) => {
    console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
    throw err;
  });
}

/**
 * Add multiple items to a dynamoDb table
 * @param {string} tableName the table to add to
 * @param {Array<object>} items the items to add to the table
 * @param {boolean} shouldOverwrite whether an item in the db should be overwritten
 */
async function addItemsToDynamo(tableName, items, shouldOverwrite = false) {
  const addItemsFn = (item) => { addItemToDynamoDB(tableName, item, shouldOverwrite); };

  await callFunctionOnItemsWithThrottle(addItemsFn, items, MAX_WRITES_PER_SECOND);
}

/**
 * Adds an item to a specified DynamoDB table.
 * @param {string} tableName - The name of the DynamoDB table to which the item will be added.
 * @param {object} item - The item to add to the DynamoDB table. This
 * object should match the schema of the table.
 * @param {boolean} shouldOverwrite whether an item in the db should be overwritten
 */
async function addItemToDynamoDB(tableName, item, shouldOverwrite) {
  console.log('Writing to dynamo...');

  const params = {
    TableName: tableName,
    Item: item,
  };

  if (!shouldOverwrite) {
    params.ConditionExpression = 'attribute_not_exists(id)';
  }

  await DYNAMO_CLIENT.put(params).promise().catch((err) => {
    if (err.code === 'ConditionalCheckFailedException') {
      console.log('Item already exists.');
    } else {
      throw err;
    }
  });
}

export { addItemsToDynamo, scanTable };
