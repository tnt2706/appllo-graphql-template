const _ = require('lodash');
const {
  createSelectedFields,
  findCurrentCarePlanForPatient,
  getSf36ResultByPatient,
  userS3Url,
} = require('../utils/controllers');

async function resolveReference(patient, { loaders }, info) {
  const selectedFields = createSelectedFields(info);
  const result = await loaders.patient.load(JSON.stringify({ id: patient._id, selectedFields }));
  return result;
}

async function resolveCurrentCarePlan(patient, args, context, info) {
  const selectedFields = createSelectedFields(info);
  const { _id } = patient;
  const careplan = await findCurrentCarePlanForPatient(_id, selectedFields);
  return careplan;
}

async function resolveSf36Result(patient, args, context, info) {
  const selectedFields = createSelectedFields(info);
  const result = await getSf36ResultByPatient(patient, selectedFields);
  return result;
}

async function resolveFacility(patient) {
  const { currentFacility } = patient;
  return {
    _id: currentFacility,
  };
}

async function resolveFacilities(patient) {
  const { supportFacilities } = patient;
  return supportFacilities;
}

async function resolvePhoto(patient) {
  let result = '';
  if (patient.photo) {
    const { photo } = patient;
    result = await userS3Url(photo);
  }
  return result;
}

async function resolveProfileCompleted(patient) {
  const cardiac = patient?.isProfileCompleted?.cardiac;
  if (cardiac) {
    return true;
  }
  return false;
}

module.exports = {
  __resolveReference: resolveReference,
  currentCarePlan: resolveCurrentCarePlan,
  sf36Result: resolveSf36Result,
  currentFacility: resolveFacility,
  facilities: resolveFacilities,
  photo: resolvePhoto,
  isProfileCompleted: resolveProfileCompleted,
};
