import pollQueue from './jobs/crawl';

/**
 * Setup SQS listeners
 */
(async function main() {
  pollQueue();
}());
