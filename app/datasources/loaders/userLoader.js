const _ = require('lodash');
const User = require('../models/User');
const { createMergedSelectedFields } = require('../utils/controllers');

async function batchPatient(keys) {
  const { ids: userIds, selectedFields } = createMergedSelectedFields(keys);
  const users = await User.find({ _id: { $in: userIds } })
    .select(selectedFields)
    .lean();
  return _.map(userIds, userId => {
    const user = _.find(users, x => x._id.equals(userId));
    return user;
  });
}

module.exports = {
  batchPatient,
};
