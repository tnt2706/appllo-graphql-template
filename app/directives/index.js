const auth = require('./auth');
const constraint = require('./constraint');

const directives = {
  auth,
  constraint,
};

module.exports = directives;
