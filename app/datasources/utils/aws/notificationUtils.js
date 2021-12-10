const Aws = require('aws-sdk');
const config = require('../../../config');
const { CONSTANCE: { NOTIFICATION } } = require('../../../config');

const pinpoint = new Aws.Pinpoint({ region: config.pinpoint.region, apiVersion: '2016-12-01' });

async function sendUsersMessage(notification) {
  const userMessageRequest = createUsersMessageRequest(notification);
  const params = {
    ApplicationId: config.pinpoint.applicationId,
    SendUsersMessageRequest: userMessageRequest,
  };

  // Try to send the message.
  pinpoint.sendUsersMessages(params, (err, data) => {
    if (err) logger.error('==== sendUsersMessages - err ===', err);
    else {
      showUserMessageOutput(data, notification.userSub);
    }
  });
}

function createMessage(notification) {
  const { type, body } = notification;
  let message = 'You have a new messages';
  switch (type) {
    case :
    {
      const objectBody = JSON.parse(body);
      const name = `${objectBody.firstName} ${objectBody.lastName}`;
      message = `Hi`;
      break;
    }
    default:
      message = 'You have a new messages';
      break;
  }
  notification.message = message;
  return notification;
}

function createUsersMessageRequest(notification) {
  createMessage(notification);
  const { message, title, userSub, _id, body } = notification;
  const silent = false;
  const url = '';
  const action = 'URL';
  const messageRequest = {
    Users: {
      [userSub]: {},
    },
    MessageConfiguration: {
      GCMMessage: {
        Priority: 'high',
        Sound: 'default',
        TimeToLive: 86400,
        // CollapseKey: 'STRING_VALUE',
        // RestrictedPackageName: 'STRING_VALUE',
      },
      APNSMessage: {
        APNSPushType: 'alert',
        Badge: 1,
        Priority: '10',
        Sound: 'default',
        TimeToLive: 86400,
        // Category: 'STRING_VALUE',
        // CollapseId: 'STRING_VALUE',
        // ThreadId: 'STRING_VALUE',
      },
      DefaultPushNotificationMessage: {
        Action: action,
        Body: message,
        SilentPush: silent,
        Title: title,
        Url: url,
        Data: {
          notificationId: _id,
          body,
        },
      },
    },
  };
  return messageRequest;
}

function showUserMessageOutput(data, userSub) {
  let status = '';
  const result = data.SendUsersMessageResponse.Result[userSub];
  if (result && JSON.stringify(result).includes('SUCCESSFUL')) {
    status = 'Message sent! Response information: ';
  } else {
    status = "The message wasn't sent. Response information: ";
  }
  logger.info(status, data.SendUsersMessageResponse);
}

module.exports = {
  sendUsersMessage,
};
