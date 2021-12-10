const _ = require('lodash');
const flatten = require('flat');
const mongoose = require('mongoose');
const { ApolloError } = require('apollo-server-express');
const CarePlan = require('../../models/CarePlan');
const User = require('../../models/User');
const Facility = require('../../models/Facility');
const Notification = require('../../models/Notification');
const { addSf36ResultByPatient, updateSf36ResultByPatient } = require('./sf36ResultUtil');
const { copyS3File, clearS3Folder, copyS3FileBiofuxReport, getS3Url, sendUsersMessage } = require('../aws');
const { cognitoAdminUpdateUser, ensureCognitoUser, cognitoUpdateUserAttributes } = require('../aws/cognito');
const { CONSTANCE, s3 } = require('../../../config');
const { notifySocketioClients, updateUserCache } = require('../grpc');
const { authenticateStore: redis } = require('../redis/stores');
const { resultErrorMessageOther, resultNotFoundData, resultInvalidData } = require('./commonUtils');

const { PATIENT } = CONSTANCE.USER.ROLES;

async function addCompletedProfileByPatient(profile, signature, token) {
  try {
    const { cognitoId, cognitoUsername } = signature;
    profile.cognitoUsername = cognitoUsername;
    profile.cognitoId = cognitoId;
    profile.isProfileCompleted = {
      cardiac: true,
    };
    profile.roles = [PATIENT];
    const flattenPatient = flatten(profile);
    const patient = await User.create(flattenPatient);
    await cognitoUpdateUserAttributes(token, profile);
    updateUserCache(patient._id, patient.username, PATIENT);
    return {
      isSuccess: true,
      patient,
    };
  } catch (err) {
    return {
      isSuccess: false,
      message: err.message,
    };
  }
}

async function updateCompletedProfileByPatient(patient, profile, token) {
  try {
    profile.isProfileCompleted = { cardiac: true };
    const flattenPatient = flatten(profile);
    const result = await User.findOneAndUpdate({ _id: patient._id }, flattenPatient, { new: true }).lean();
    const { firstName, lastName } = profile;
    if (firstName || lastName) {
      await cognitoUpdateUserAttributes(token, profile);
      updateUserCache(patient._id, patient.username, PATIENT);
    }
    return {
      isSuccess: true,
      patient: result,
    };
  } catch (err) {
    return {
      isSuccess: false,
      message: err.message,
    };
  }
}

async function updateInfoByPatient(patient, profile, token) {
  try {
    const result = await User.findOneAndUpdate({ _id: patient._id }, profile, { new: true });
    const { firstName, lastName } = profile;
    if (firstName || lastName) {
      await cognitoUpdateUserAttributes(token, profile);
      updateUserCache(patient._id, patient.username, patient.roles[0]);
    }
    return {
      isSuccess: true,
      patient: result,
    };
  } catch (err) {
    return {
      isSuccess: false,
      message: err.message,
    };
  }
}

async function completePatientProfile(profile, signature) {
  const { facilityId } = profile;
  const { cognitoId, cognitoUsername } = signature;
  if (!facilityId) {
    return resultErrorMessageOther('Validation Error: Facility is required');
  }
  const objFacility = await Facility.findById(facilityId).select('_id status').lean();
  if (!objFacility) {
    return resultNotFoundData('Facility');
  }
  if (objFacility.status === 'Test') {
    profile.isTestAccount = true;
    profile.status = 'Active';
  }
  const patient = await createPatient(profile, cognitoId, cognitoUsername, signature.id);
  return {
    isSuccess: true,
    patient,
  };
}

async function updateProfileByPatient(profile, context, patient) {
  const { facilityId, sf36Result } = profile;
  const { token } = context;
  const facility = await Facility.findById(facilityId).select('_id status').lean();
  //* Ensures profile here
  ensureFacilityUpdatedProfile(facility, patient, profile);
  const patientResult = await updateExistingPatient(patient, profile, token);

  //* Check and init a new care plan
  const { carePlan } = await ensureAddNewCarePlanByPatient(patient, profile);

  //* notification of patient complete carePlan profile to Nurse
  upsertSF36(sf36Result, patient, carePlan);

  return {
    isSuccess: true,
    patient: patientResult,
  };
}

/**
 *
 * @param {*} profile
 * @param {*} patientCognitoId
 * @param {*} signatureId nurse or patient ID
 * @returns
 */
async function createPatient(profile, patientCognitoId, patientCognitoUsername, signatureId) {
  const id = mongoose.Types.ObjectId();
  const { sf36Result: sf36ResultInput, facilityId, afibHistory: afibHistoryInput } = profile;
  const { ecgImages, studyId } = afibHistoryInput || {};
  if (ecgImages && ecgImages.length > 0) {
    profile.afibHistory.ecgImages = await addEcgImages(ecgImages, id);
  }
  if (studyId) {
    const bioflux = await getBiofuxFromRedis(studyId, patientCognitoId);
    if (bioflux) {
      profile.afibHistory.bioflux = bioflux;
    }
  }
  profile.cognitoUsername = patientCognitoUsername;
  profile.cognitoId = patientCognitoId;
  profile.currentFacility = facilityId;
  profile.supportFacilities = [facilityId];
  profile.roles = [PATIENT];
  const flattenPatient = flatten(_.omit(profile, ['afibHistory']));
  const patient = await User.create(flattenPatient);
  const carePlan = await initCarePlan(patient._id, facilityId, signatureId || patient._id, profile.afibHistory, id);
  updateUserCache(patient._id, patient.username, patient.roles[0]);
  let sf36Result;
  if (sf36ResultInput) {
    sf36Result = await addSf36ResultByPatient(patient, sf36ResultInput, carePlan._id);
  }
  addNewHCPNotificationToPatient(patient, carePlan);
  const result = {
    ...patient,
    currentCarePlan: carePlan,
    sf36Result,
  };
  return result;
}

/**
 * self-updating information of the patient
 * @param {*} patient
 * @param {*} profile
 * @param {*} token
 * @returns
 */
async function updateExistingPatient(patient, profile, token) {
  const objProfile = _.omit(profile, ['facilityId', 'sf36Result']);
  if (_.isEmpty(objProfile)) { return patient; }

  if (!patient.isProfileCompleted?.cardiac) {
    profile['isProfileCompleted.cardiac'] = true;
  }
  const result = await User.findOneAndUpdate({ _id: patient._id }, profile, { new: true });
  const { firstName, lastName, isUpdateFacilities } = profile;
  if (firstName || lastName || isUpdateFacilities) {
    if (firstName || lastName) {
      await cognitoUpdateUserAttributes(token, profile);
    }
    updateUserCache(patient._id, patient.username, patient.roles[0]);
  }
  return result;
}

/**
 * updating information of the patient by clinic technnician
 * @param {*} patient
 * @param {*} profile
 * @returns
 */
async function updateExistingPatientByTechnician(patient, profile) {
  const objProfile = _.omit(profile, ['facility', 'sf36Result']);
  if (_.isEmpty(objProfile)) { return patient; }

  const result = await User.findOneAndUpdate({ _id: patient._id }, profile, { new: true });

  // Update firstname, lastname in Cognito
  const { firstName, lastName } = profile;
  if (firstName || lastName) {
    const input = { username: patient.cognitoUsername, firstName, lastName };
    cognitoAdminUpdateUser(input);
    updateUserCache(patient._id, patient.username, patient.roles[0]);
  }
  return result;
}

/**
 * ensure updated Afib history
 * @param {*} profile (Reference type) input data
 * @param {*} patient existing patient
 */
async function ensureUpdatedAfibHistory(afibHistory, carePlan, cognitoId) {
  if (afibHistory) {
    const { ecgImages, studyId } = afibHistory;

    if (ecgImages && ecgImages.length > 0) {
      afibHistory.ecgImages = await addEcgImages(ecgImages, carePlan._id);
    }
    if (_.isNull(ecgImages)) {
      afibHistory.ecgImages = [];
      await clearS3Folder(s3.userBucket, `${carePlan._id}/AFib_history`);
    }
    // ecgImages is Undefined => Don't update
    if (_.isUndefined(ecgImages)) {
      afibHistory.ecgImages = carePlan?.afibHistory?.ecgImages;
    }

    if (studyId) {
      const bioflux = await getBiofuxFromRedis(studyId, cognitoId);
      if (bioflux) {
        afibHistory.bioflux = bioflux;
      } else {
        afibHistory.bioflux = carePlan?.afibHistory?.bioflux;
      }
    }
  }
  return afibHistory;
}

/**
 * Init new care plan
 * @param {*} param._id patient _id
 * @param {*} param.currentFacility patient currentFacility
 * @param {*} signatureId signature id
 */
async function initCarePlan(patientId, facility, signatureId, afibHistory, carePlanId) {
  try {
    const carePlanInput = {
      _id: carePlanId,
      patient: patientId,
      facility,
      status: CONSTANCE.CAREPLAN.STATUS.NEW,
      createdBy: signatureId,
      afibHistory,
    };
    const carePlan = await CarePlan.create(carePlanInput);
    sendNotificationNewCarePlan(carePlan);
    return carePlan;
  } catch (error) {
    logger.info('init careplan error', { error: error.stack || error });
    throw new ApolloError(error);
  }
}

/**
 * Create by email only
 * @param {*} profile
 * @param {*} signatureTechnician
 * @returns
 */
async function createPatientByTechnician(profile, signatureTechnician) {
  const { email, firstName, lastName, facilityId } = profile;
  const userInput = { firstName, lastName, email, username: email };
  const facility = await Facility.findById(facilityId).select('notificationEmail contact').lean();
  if (!facility) {
    return resultNotFoundData('facility');
  }
  const { cognitoId, cognitoUsername } = await ensureCognitoUser(userInput, facility);
  if (!cognitoId || !cognitoUsername) {
    return resultInvalidData('cognito');
  }
  const patient = await createPatient(profile, cognitoId, cognitoUsername, signatureTechnician.id);
  return {
    isSuccess: true,
    patient,
  };
}

async function updatePatientByTechnician(profile, signature, patient, isNewCarePlan) {
  delete profile.email;
  const { facilityId: facilityInput } = profile;
  if (isNewCarePlan) {
    const id = mongoose.Types.ObjectId();
    const { CAREPLAN: { STATUS } } = CONSTANCE;
    const criteria = { status: { $in: [STATUS.NEW, STATUS.ACTIVE] }, patient: patient._id };
    const createdBy = signature.id;
    const carePlan = await CarePlan.findOne(criteria).select('_id afibHistory').lean();
    if (carePlan) { return resultErrorMessageOther('There is an ongoing care plan'); }
    const afibHistory = await ensureUpdatedAfibHistory(profile.afibHistory, id, patient.cognitoId);
    const newCarePlan = await initCarePlan(patient._id, facilityInput, createdBy, afibHistory, id);
    if (createdBy && !_.isEqual(`${createdBy}`, `${patient._id}`)) {
      await addNewHCPNotificationToPatient(patient, newCarePlan);
    }
    //! nurse update facility not check
    profile.currentFacility = facilityInput;
  }
  const result = await updateExistingPatientByTechnician(patient, profile);
  return {
    isSuccess: true,
    patient: result,
  };
}

async function upsertSF36(sf36ResultInput, patient, carePlan) {
  if (sf36ResultInput) {
    if (sf36ResultInput._id) {
      // Update SF36Result
      await updateSf36ResultByPatient(sf36ResultInput);
    } else {
      const createdBy = carePlan?.createdBy;
      const sf36Result = await addSf36ResultByPatient(patient, sf36ResultInput, carePlan._id);
      if (createdBy && !_.isEqual(`${createdBy}`, `${patient._id}`) && sf36Result) {
        await addNotificationPatientCompletionProfile(patient, carePlan);
      }
    }
  }
}

/**
 *
 * @param {*} patient
 * @param {*} profile
 * @returns
 */
async function ensureAddNewCarePlanByPatient(patient, profile) {
  try {
    const { facilityId, sf36Result } = profile;
    const carePlan = await CarePlan.findOne({ patient: patient._id, status: { $in: ['New', 'Active'] } }).lean();
    if (!carePlan && _.every([facilityId, sf36Result])) {
      patient.currentFacility = facilityId;
      const id = mongoose.Types.ObjectId();
      const afibHistory = await ensureUpdatedAfibHistory(profile.afibHistory, id, patient.cognitoId);
      const newCarePlan = await initCarePlan(patient._id, patient.currentFacility, patient._id, afibHistory, id);
      return { isNewCarePlan: true, carePlan: newCarePlan };
    }
    if (carePlan && `${facilityId}` !== `${carePlan.facility}`) {
      const facility = await Facility.findById(carePlan.facility).select('name').lean();
      throw new ApolloError(`There is a Health Care Plan running at another clinic ${facility.name}`);
    }
    return { isNewCarePlan: false, carePlan };
  } catch (error) {
    logger.error('ensureAddNewCarePlanByPatient', { error: error.stack || error });
    throw new ApolloError(error);
  }
}

/**
 * ensure facility change by patient
 * @param {*} objectFacilityInput - Object { _id, status } facility find in mongoDB
 * @param {*} userDb - {facilities, currentFacility}
 * @param {*} profile - Reference type
 */
function ensureFacilityUpdatedProfile(objectFacilityInput, userDb, profile) {
  if (objectFacilityInput) {
    const { _id: facilityInputId, status } = objectFacilityInput;
    const { supportFacilities, currentFacility } = userDb;
    if (status === 'Test') {
      profile.isTestAccount = true;
      profile.status = 'Active';
    }
    if (!_.isEqual(`${currentFacility}`, `${facilityInputId}`)) {
      profile.currentFacility = `${facilityInputId}`;
    }
    const isExistFacility = _.includes(supportFacilities, `${facilityInputId}`);
    if (!isExistFacility) {
      const facilityIds = supportFacilities.map((facility) => facility.toString());
      facilityIds.push(`${facilityInputId}`);
      profile.supportFacilities = facilityIds;
      profile.isUpdateFacilities = true;
    }
  }
}

function sendNotificationNewCarePlan(carePlan) {
  const { SOCKETIO_EVENT } = CONSTANCE;
  const eventName = SOCKETIO_EVENT.NEW_CARE_PLAN;
  const jsonMessage = {
    carePlan: carePlan._id,
    patient: carePlan.patient,
    facility: carePlan.facility,
  };
  const roomFacility = carePlan.facility;
  notifySocketioClients({ room: roomFacility, eventName, jsonMessage, message: 'New care plan' });
}

async function sendNotificationCompletionProfile(patient, carePlan) {
  const { createdBy } = carePlan;
  if (createdBy && !_.isEqual(`${createdBy}`, `${patient._id}`)) {
    await addNotificationPatientCompletionProfile(patient, carePlan);
  }
}

async function addEcgImages(ecgImages, carePlanId) {
  const promises = [];
  for (let i = 0, n = ecgImages.length; i < n; i += 1) {
    const newPromise = copyS3File(ecgImages[i],
      { bucket: s3.userBucket, filename: `${carePlanId}/AFib_history/${i}` });
    promises.push(newPromise);
  }
  const result = await Promise.all(promises);
  return result;
}

async function getBiofuxFromRedis(studyId, cognitoId) {
  let bioflux = await redis.getAsync(studyId);
  if (bioflux) {
    bioflux = JSON.parse(bioflux);
    const { bucket, key } = bioflux.report;
    const reportPath = await copyS3FileBiofuxReport({ bucket, key }, { bucket: s3.userBucket, key: `${cognitoId}/Bioflux_report/${studyId}` });
    bioflux.report.reportPath = reportPath;
  }
  return bioflux;
}

/**
 * Notification of patient sf36 result update to the nurse
 * @param {*} patient
 * @param {*} carePlan { _id, createdBy }
 */
async function addNotificationPatientCompletionProfile(patient, carePlan) {
  const { _id: carePlanId, createdBy } = carePlan;
  const { currentFacility, cognitoId } = patient;
  const { NOTIFICATION, NOTIFICATION_TITLE, SOCKETIO_EVENT } = CONSTANCE;
  const patientName = _.pick(patient, ['_id', 'lastName', 'firstName']);
  const notificationInput = {
    user: createdBy,
    facility: currentFacility,
    carePlan: carePlanId,
    type: NOTIFICATION.PATIENT_COMPLETE_PROFILE,
    title: NOTIFICATION_TITLE.PATIENT_COMPLETE_PROFILE,
    body: JSON.stringify(patient),
    userSub: cognitoId,
  };
  const notification = await Notification.create(notificationInput);
  const eventName = SOCKETIO_EVENT.NOTIFICATION;
  const jsonMessage = {
    _id: notification._id,
    facility: currentFacility,
    patient: patientName,
    type: 'Add',
  };
  const roomNurse = createdBy;
  notifySocketioClients({ room: roomNurse, eventName, jsonMessage, message: 'Notification' });
  return notification;
}

/**
 * Notification of nurse registers a health care program for patient.
 * @param {*} patient
 * @param {*} carePlan { _id, createdBy }
 */
async function addNewHCPNotificationToPatient(patient, carePlan) {
  const { _id: carePlanId } = carePlan;
  const { currentFacility, cognitoId, _id } = patient;
  const { NOTIFICATION, NOTIFICATION_TITLE } = CONSTANCE;
  const notificationInput = {
    user: _id,
    facility: currentFacility,
    carePlan: carePlanId,
    type: NOTIFICATION.NURSE_REGISTER_QUALITY_OF_LIFE_TEST,
    title: NOTIFICATION_TITLE.NURSE_REGISTER_QUALITY_OF_LIFE_TEST,
    body: JSON.stringify(patient),
    userSub: cognitoId,
  };
  sendUsersMessage(notificationInput);
  return null;
}

function buildSearchByNameQuery(name, options = {}) {
  let query = {};
  if (!name) return query;
  const [firstName, lastName] = name.replace(/\s+/g, ' ').trim().split(' ');
  if (firstName) {
    if (!lastName) {
      const or = [
        { firstName: new RegExp(firstName, 'i') },
        { lastName: new RegExp(firstName, 'i') },
      ];
      if (options?.or) { or.push(options.or); }
      query.$or = or;
    } else {
      query = {
        firstName: new RegExp(firstName, 'i'),
        lastName: new RegExp(lastName, 'i'),
      };
    }
  }
  return query;
}

async function userS3Url(path) {
  let result = '';
  if (path) {
    result = await getS3Url({ bucket: s3.frequentlyAccessBucket, fileName: path });
  }
  return result;
}

module.exports = {
  addCompletedProfileByPatient,
  updateCompletedProfileByPatient,
  createPatient,
  initCarePlan,
  createPatientByTechnician,
  updatePatientByTechnician,
  completePatientProfile,
  updateProfileByPatient,
  updateInfoByPatient,
  sendNotificationNewCarePlan,
  sendNotificationCompletionProfile,
  buildSearchByNameQuery,
  userS3Url,
  ensureUpdatedAfibHistory,
};
