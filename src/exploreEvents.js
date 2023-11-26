import pollCrawlQueue from './jobs/crawl';
import pollDecorateQueue from './jobs/decorate';

/**
 * Setup SQS listeners
 */
(async function main() {
  pollCrawlQueue();
  pollDecorateQueue();
}());
