const query = require('./userQuery');
const command = require('./userCommand');

module.exports = {
  ...query,
  ...command,
};
