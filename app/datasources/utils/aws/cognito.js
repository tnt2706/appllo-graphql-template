const _ = require('lodash');
const AWS = require('aws-sdk');
const generator = require('generate-password');
const config = require('../../../config');
const { sendWelcomeEmail, resendPasswordEmail } = require('./mail');

AWS.config.update({
  region: config.cognito.region,
});

const cognitoClient = new AWS.CognitoIdentityServiceProvider({
  apiVersion: '2016-04-18',
  region: config.cognito.region,
});

/**
 *
 * @param {*} userInput  email, firstName, lastName, username
 * @returns
 */
async function cognitoAdminCreateUser(userInput, facility) {
  const { email, firstName, lastName, username } = userInput;
  const { notificationEmail, contact } = facility;
  const temporaryPassword = generator.generate({
    length: 10,
    numbers: true,
  });
  const phone = contact?.phone1 || contact?.phone2;
  const address = `${contact?.address},${contact?.city},${contact?.state} ${contact?.zip}`;
  logger.debug('### cognitoAdminCreateUser', { userInput, temporaryPassword, facility, isValidEmailAndPhone: !!notificationEmail && !!phone });
  const poolData = {
    UserPoolId: config.cognito.userPoolId,
    Username: username,
    DesiredDeliveryMediums: ['EMAIL'],
    TemporaryPassword: temporaryPassword,
    MessageAction: 'SUPPRESS',
    UserAttributes: [
      {
        Name: 'email',
        Value: email,
      },
      {
        Name: 'given_name',
        Value: firstName,
      },
      {
        Name: 'family_name',
        Value: lastName,
      },
      {
        Name: 'email_verified',
        Value: 'true',
      },
    ],
  };
  return new Promise((resolve, reject) => {
    cognitoClient.adminCreateUser(poolData, (err, data) => {
      if (err) {
        reject(err);
      }
      sendWelcomeEmail({ to: email }, { fullname: `${firstName} ${lastName}`,
        temporaryPassword,
        isValidEmailAndPhone: !!notificationEmail && !!phone,
        email: notificationEmail,
        phone,
        address });
      resolve(data);
    });
  });
}

/**
 *
 * @param {*} userInput  email, firstName, lastName, username
 * @returns
 */
async function cognitoAdminResendPassword(userInput) {
  const { email, firstName, lastName } = userInput;
  const temporaryPassword = generator.generate({
    length: 10,
    numbers: true,
  });
  logger.debug('### cognitoAdminCreateUser', { userInput, temporaryPassword });
  const poolData = {
    UserPoolId: config.cognito.userPoolId,
    Username: email,
    Password: temporaryPassword,
    Permanent: false,
  };
  return new Promise((resolve, reject) => {
    cognitoClient.adminSetUserPassword(poolData, err => {
      if (err) {
        logger.info(`### debug temporary password error:${err}`);
        reject(err);
      }
      resendPasswordEmail({ to: email }, { fullname: `${firstName} ${lastName}`,
        temporaryPassword });
      resolve({ temporaryPassword });
    });
  });
}

async function cognitoGetUserByEmail(email) {
  const poolData = {
    AttributesToGet: ['sub'],
    Filter: `email = "${email}"`,
    UserPoolId: config.cognito.userPoolId,
    Limit: 10,
  };
  const { Users } = await cognitoClient.listUsers(poolData).promise();
  return Users;
}

async function cognitoAdminGetUser(username) {
  const poolData = {
    Username: username,
    UserPoolId: config.cognito.userPoolId,
  };
  return cognitoClient.adminGetUser(poolData).promise();
}

/**
 *
 * @param {*} userInput { email, firstName, lastName, username }
 * @returns CognitoUse {cognitoId, cognitoUsername}
 */
async function ensureCognitoUser(userInput, facility) {
  logger.debug('### ensureCognitoUser', userInput);
  const { email } = userInput;
  const existedUsers = await cognitoGetUserByEmail(email);
  logger.debug('existedUsers', existedUsers);
  const existedUser = _.find(existedUsers, u => {
    const cognitoId = u.Attributes[0].Value;
    const cognitoUsername = u.Username;
    return cognitoId === cognitoUsername;
  });
  logger.debug('existedUser', existedUser);
  let cognitoId = '';
  let cognitoUsername = '';
  if (existedUser) {
    cognitoId = existedUser.Attributes[0].Value;
    cognitoUsername = existedUser.Username;
  } else {
    const cognitoUser = await cognitoAdminCreateUser(userInput, facility);
    cognitoUsername = cognitoUser.User.Username;
    cognitoId = cognitoUser.User.Username;
  }
  return { cognitoId, cognitoUsername };
}

async function cognitoAdminUpdateUser(userInput) {
  const poolData = {
    UserPoolId: config.cognito.userPoolId,
    Username: userInput.username,
    UserAttributes: [
      {
        Name: 'given_name',
        Value: userInput.firstName,
      },
      {
        Name: 'family_name',
        Value: userInput.lastName,
      },
    ],
  };
  return new Promise((resolve, reject) => {
    cognitoClient.adminUpdateUserAttributes(poolData, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}

/**
 * Update User Attributes with token
 * @param {*} token
 * @param {*} userInput.firstName
 * @param {*} userInput.lastName
 * @returns
 */
async function cognitoUpdateUserAttributes(token, userInput) {
  const poolData = {
    AccessToken: token,
    UserAttributes: [],
  };
  if (userInput.firstName) {
    poolData.UserAttributes.push({
      Name: 'given_name',
      Value: userInput.firstName,
    });
  }
  if (userInput.lastName) {
    poolData.UserAttributes.push({
      Name: 'family_name',
      Value: userInput.lastName,
    });
  }

  return new Promise((resolve, reject) => {
    cognitoClient.updateUserAttributes(poolData, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}

async function getUserAttribute(accessToken) {
  const result = await cognitoClient.getUser({ AccessToken: accessToken }).promise();
  const { UserAttributes: attributes, Username: username } = result;
  return { attributes, username };
}

module.exports = {
  ensureCognitoUser,
  cognitoAdminUpdateUser,
  cognitoAdminResendPassword,
  cognitoUpdateUserAttributes,
  getUserAttribute,
  cognitoGetUserByEmail,
  cognitoAdminGetUser,
};
