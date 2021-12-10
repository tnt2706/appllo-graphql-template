const _ = require('lodash');

const status = {
  redis: true,
  mongodb: true,
};

function healthcheck() {
  return _.every(status);
}

module.exports = {
  status,
  healthcheck,
};
