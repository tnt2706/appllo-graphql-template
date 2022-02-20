const path = require('path');

const protosDir = path.join(__dirname, '../datasources/protos');

module.exports = {
  grpc: {
    clients: {
      socketioServer: {
        host: process.env.SOCKET_IO_SERVER_SERVICE || '0.0.0.0:6700',
        packageName: 'cardiac',
        serviceName: 'SocketioServer',
        protoPath: path.join(protosDir, 'socketioServer.proto'),
      },
    },
  },
};
