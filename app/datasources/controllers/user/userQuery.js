const _ = require('lodash');
const { ApolloError } = require('apollo-server-express');
const User = require('../../models/User');
const { CONSTANCE: { USER: { ROLES } } } = require('../../../config');
const Pagination = require('../../utils/controllers/pagination');
const { createSelectedFields, buildSearchByNameQuery } = require('../../utils/controllers');

async function getPatient(args, { signature }, info) {
  try {
    const { _id, email } = args;
    const { facilityIds, id: userId, cognitoId, roles } = signature;
    const selectedFields = createSelectedFields(info, ['currentFacility', 'isTestAccount', 'status', 'supportFacilities', 'roles']);
    const inputId = _id || userId;
    const criteria = email ? { email } : inputId ? { _id: inputId } : { cognitoId };
    if (_.includes(roles, ROLES.CLINIC_PHYSICIAN) || _.includes(roles, ROLES.CLINIC_PHYSICIAN)) {
      criteria.facilityIds = { $in: facilityIds };
    }
    criteria.roles = ROLES.PATIENT;
    const user = await User.findOne(criteria).select(selectedFields).lean();
    if (!user) {
      return null;
    }
    const { isTestAccount, status } = user;
    if (isTestAccount && status === 'New') {
      return null;
    }
    return user;
  } catch (error) {
    logger.info('getPatient error', { error: error.stack || error });
    throw new ApolloError(error);
  }
}

async function getPatients(args, { signature }, info) {
  try {
    const { filter, limit } = args;
    const { search, cursor } = filter;
    const { sortOrder, sortField } = filter;
    const { id: userId, facilityIds, roles } = signature;
    const selectedFields = createSelectedFields(info, ['supportFacilities']);

    const criteria = buildSearchByNameQuery(search, { or: { email: new RegExp(search, 'i') } });
    if (_.includes(roles, ROLES.PATIENT)) {
      criteria._id = { _id: userId };
    }
    criteria.currentFacility = { $in: facilityIds };
    const paginated = new Pagination(User,
      {
        criteria,
        sort: { field: sortField, order: sortOrder },
        pagination: { limit, after: cursor },
        select: selectedFields,
      });
    const edges = await paginated.getDocs();
    return edges;
  } catch (error) {
    logger.error('get user error', { error: error.stack });
    throw new ApolloError(error);
  }
}

module.exports = {
  getPatient,
  getPatients,
};
