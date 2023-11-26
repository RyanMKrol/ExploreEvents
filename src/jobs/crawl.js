/**
 * This cron job will wait for a message from the ConcertDataCrawlStart
 * queue, and begin crawling once a message comes in.
 */

import scrapeConcertList from '../steps/crawling';
import filterDate from '../steps/filter';

import { deleteSqsMessage, pullMessage } from '../utils/aws/sqs';
import { sendTaskSuccess, sendTaskFailure } from '../utils/aws/stepFunctions';
import { addItemsToDynamo } from '../utils/aws/dynamo';

const QUEUE_URL = 'https://sqs.us-east-2.amazonaws.com/228666294391/ConcertDataCrawlStart';
const WAIT_BETWEEN_POLL_MS = process.env.DEV === '1' ? 1000 * 5 : 1000 * 60 * 5;
const STORAGE_TABLE_NAME = 'ConcertDataItems';

/**
 * Polls the queue to start crawling for concert data
 */
async function pollQueue() {
  const sqsCallback = async (err, data) => {
    if (err) {
      console.log('Receive Error', err);
    } else if (data.Messages) {
      await data.Messages.reduce(async (acc, message) => {
        await acc;

        console.log('Message Received', message);

        try {
          const messageData = JSON.parse(message.Body);

          await crawl(messageData.date);

          sendTaskSuccess(message.MessageAttributes.TaskToken.StringValue);
        } catch (messageProcessingError) {
          console.log(messageProcessingError);
          sendTaskFailure(message.MessageAttributes.TaskToken.StringValue);
        } finally {
          deleteSqsMessage(QUEUE_URL, message.ReceiptHandle);
        }

        return acc;
      }, Promise.resolve());
    } else {
      console.log('No messages received');
    }

    waitAndPoll();
  };

  pullMessage(QUEUE_URL, 1, ['All'], sqsCallback);
}

/**
 * Method to crawl data using a given date
 * @param {string} dateString the date to crawl for
 */
async function crawl(dateString) {
  const date = new Date(dateString);

  const crawledData = await scrapeConcertList(date);

  const filteredResults = filterDate(crawledData);

  const dynamoItems = filteredResults.map((item) => {
    const dynamoId = `${dateString}-${item.artist}-${item.venue}`;
    return {
      ...item,
      id: dynamoId,
      date: dateString,
    };
  });

  await addItemsToDynamo(STORAGE_TABLE_NAME, dynamoItems);
}

/**
 * Waits an amount of time until the next poll of the queue
 */
function waitAndPoll() {
  setTimeout(pollQueue, WAIT_BETWEEN_POLL_MS);
}

export default pollQueue;
