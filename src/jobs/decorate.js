/**
 * This cron job will wait for a message from the ConcertDataDecorationStart
 * queue, and begin decorating data once a message comes in.
 */

import { deleteSqsMessage, pullMessage } from '../utils/aws/sqs';
import { sendTaskSuccess, sendTaskFailure } from '../utils/aws/stepFunctions';
import { addItemsToDynamo, scanTable } from '../utils/aws/dynamo';
import { getAccessToken, getArtistProfilePageUrls } from '../utils/spotify';

const QUEUE_URL = 'https://sqs.us-east-2.amazonaws.com/228666294391/ConcertDataDecorationStart';
const WAIT_BETWEEN_POLL_MS = 1000 * 5;
const STORAGE_TABLE_NAME = 'ConcertDataItems';

/**
 * Polls the queue to start decorating crawled concert data
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
          await decorate();

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
 * Method to decorate concert data
 */
async function decorate() {
  const rawData = await scanTable(STORAGE_TABLE_NAME);

  // remove items that have already been processed
  const dataToDecorate = rawData.filter((item) => typeof item.profileUrl === 'undefined');

  const spotifyToken = await getAccessToken();

  const artistNames = dataToDecorate.map((item) => item.artist);

  const artistProfilePageMap = await getArtistProfilePageUrls(artistNames, spotifyToken);

  const writeBackInformation = dataToDecorate.map((item) => (artistProfilePageMap[item.artist] ? {
    ...item,
    profileUrl: artistProfilePageMap[item.artist],
  } : item));

  await addItemsToDynamo(STORAGE_TABLE_NAME, writeBackInformation);
}

/**
 * Waits an amount of time until the next poll of the queue
 */
function waitAndPoll() {
  setTimeout(pollQueue, WAIT_BETWEEN_POLL_MS);
}

export default pollQueue;
