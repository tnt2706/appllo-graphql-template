const _ = require('lodash');
const graphqlFields = require('graphql-fields');

function createSelectedFields(queryInfo, additionalFields = [], childPath = '', returnArray = false) {
  let selectedFields;
  if (childPath) {
    selectedFields = _.filter(_.keys(graphqlFields(queryInfo)[childPath]), (item) => !['__typename'].includes(item));
  } else {
    selectedFields = _.filter(_.keys(graphqlFields(queryInfo)), (item) => !['__typename'].includes(item));
  }
  const finalFields = _.union(additionalFields, selectedFields);
  return returnArray ? finalFields : finalFields.join(' ');
}

function createMergedSelectedFields(batchingKeys, additionalFields = []) {
  let mergeSelectedFields = [];
  const ids = _.map(batchingKeys, (key) => {
    const { id, selectedFields } = JSON.parse(key);
    mergeSelectedFields = _.union(mergeSelectedFields, selectedFields);
    return id;
  });

  const finalFields = _.union(additionalFields, mergeSelectedFields);
  const selectedFields = finalFields.join(' ') || '-__v';
  return { ids, selectedFields };
}

module.exports = {
  createSelectedFields,
  createMergedSelectedFields,
};
