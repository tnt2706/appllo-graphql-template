const redis = require('redis');
const bluebird = require('bluebird');

const config = require('../../../config');
const { status: healthcheck } = require('../../healthcheck');

bluebird.promisifyAll(redis.RedisClient.prototype);

const authenticateStore = redis.createClient(config.redisDbs.authDb);

authenticateStore.on('error', () => {
  // logger.info('redis connection failed');
  healthcheck.redis = false;
});

module.exports = {
  authenticateStore,
};
