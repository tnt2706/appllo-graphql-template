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
      authCacheServer: {
        host: process.env.AUTH_CACHE_SERVER_SERVICE || '0.0.0.0:6900',
        packageName: 'cardiac',
        serviceName: 'AuthCacheServer',
        protoPath: path.join(protosDir, 'authCacheServer.proto'),
      },
      biofluxBridgeService: {
        host: process.env.BIOFLUX_BRIDGE_SERVICE || '0.0.0.0:6700',
        packageName: 'bioflux',
        serviceName: 'BiocareCardiacBridge',
        protoPath: path.join(protosDir, 'biofluxBridgeService.proto'),
      },
      commonCacheServer: {
        host: process.env.BIOFLUX_COMMON_CACHE_SERVICE || '0.0.0.0:6900',
        packageName: 'commonCache',
        serviceName: 'CommonCache',
        protoPath: path.join(protosDir, 'commonCache.proto'),
      },
    },
  },
};
