/* eslint no-console:off */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const mongoServer = new MongoMemoryServer();

function connectDatabase() {
  return new Promise((resolve, reject) => {
    mongoServer
      .getUri()
      .then((mongoUri) => {
        mongoose.connect(mongoUri, {
          autoReconnect: true,
          reconnectTries: 100,
          reconnectInterval: 1000,
          useNewUrlParser: true,
          useFindAndModify: false,
          useCreateIndex: true,
        });
        mongoose.connection
          .once('open', async () => {
            resolve();
          })
          .on('error', (error) => {
            console.warn('Warning', error);
            reject(error);
          });
      });
  });
}

async function disconnectDatabase() {
  return Promise.all([
    mongoServer.stop(),
    mongoose.disconnect(),
  ]);
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
};
