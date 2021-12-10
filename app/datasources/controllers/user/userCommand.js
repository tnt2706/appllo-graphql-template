const _ = require('lodash');
const { ApolloError } = require('apollo-server-express');
const User = require('../../models/User');
const { resultException } = require('../../utils/controllers');

async function signUp(args, { signature }) {
  try {
    return true;
  } catch (error) {
    logger.info('Resend password info error', { error: error.stack || error });
    return resultException(error);
  }
}

module.exports = {
  signUp,
};
