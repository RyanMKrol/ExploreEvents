import AWS from 'aws-sdk';
import 'dotenv/config';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const SQS_API = new AWS.SQS({ apiVersion: '2012-11-05' });

/**
 * Method to pull from a given SQS queue
 * @param {string} queueUrl which queue to pull from
 * @param {number}maxNumberOfMessages how many messages to pull at once
 * @param {Array<string>} messageAttributeNames which attributes to use from the message
 * @param {Function} callback how to process the message
 */
function pullMessage(queueUrl, maxNumberOfMessages, messageAttributeNames, callback) {
  const params = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: maxNumberOfMessages,
    MessageAttributeNames: messageAttributeNames,
  };

  SQS_API.receiveMessage(params, callback);
}

/**
 * Deletes a message from an SQS queue
 * @param {string} queueUrl which queue to delete from
 * @param {any} receiptHandle property on the incoming message
 */
function deleteSqsMessage(queueUrl, receiptHandle) {
  const deleteParams = {
    QueueUrl: queueUrl,
    ReceiptHandle: receiptHandle,
  };

  SQS_API.deleteMessage(deleteParams, (deleteError, deleteData) => {
    if (deleteError) {
      console.log('Delete Error', deleteError);
    } else {
      console.log('Message Deleted', deleteData);
    }
  });
}

export { pullMessage, deleteSqsMessage };
