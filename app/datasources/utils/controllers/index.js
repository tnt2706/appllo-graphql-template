const selectedFields = require('./selectedFields');
const patientUtils = require('./userUtil');
const commonUtils = require('./commonUtils');

const Pagination = require('./pagination');

module.exports = {
  ...selectedFields,
  ...patientUtils,
  ...commonUtils,
  Pagination,
};
