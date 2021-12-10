const config = require('../config');
const { cardiacConn, commonConn } = require('./models/connections');

require('./models');
const controllers = require('./controllers');
const loaders = require('./loaders');
const utils = require('./utils/controllers');
const { status: healthcheck } = require('./healthcheck');

if (config.NODE_ENV !== 'test') {
  commonConn.on('error', () => {
    logger.info('mongodb connection on error');
    healthcheck.mongodb = false;
  });

  cardiacConn.on('error', () => {
    logger.info('mongodb connection on error');
    healthcheck.mongodb = false;
  });
}

module.exports = () => ({ ...controllers, loaders, utils });
