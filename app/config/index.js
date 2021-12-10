const container = require('./container');
const db = require('./db');
const grpc = require('./grpc');
const aws = require('./aws');
const constant = require('./constant');

const config = {
  ...container,
  ...db,
  ...grpc,
  ...aws,
  ...constant,
};

module.exports = config;
