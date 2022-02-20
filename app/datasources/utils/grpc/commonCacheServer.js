const { commonCacheServer } = require('../../../config').grpc.clients;
const { createGrpcClient, createCallOptions } = require('./client');

const client = createGrpcClient(commonCacheServer);

async function updateUserCache(userId, username, role) {
  const options = createCallOptions();
  await new Promise(resolve => {
    const request = { userId, username, role };
    client.updateUserCache(request, options, (error, data) => {
      if (error) {
        logger.error('updateUserCache error', error);
      }
      logger.error('updateUserCache result', data);
      resolve(data);
    });
  });
}

module.exports = {
  updateUserCache,
};
