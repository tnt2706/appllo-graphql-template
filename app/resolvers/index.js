const custom = require('./custom');
const queryResolver = require('./queries');
const mutationResolver = require('./mutations');
const patientResolver = require('./patient');

module.exports = {
  Query: queryResolver,
  Mutation: mutationResolver,
  Patient: patientResolver,
  ...custom,
};
