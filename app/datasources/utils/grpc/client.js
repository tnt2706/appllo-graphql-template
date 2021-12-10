const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

function createGrpcClient(clientConfig) {
  const { host, packageName, serviceName, protoPath } = clientConfig;
  if (!host) {
    logger.info(`Grpc Client host is not provided - service: ${serviceName}`);
    return null;
  }

  const packageDefinition = protoLoader.loadSync(
    protoPath,
    {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    },
  );
  const GrpcService = grpc.loadPackageDefinition(packageDefinition)[packageName][serviceName];
  const options = {
    'grpc.keepalive_time_ms': 10000,
    'grpc.keepalive_timeout_ms': 5000,
    'grpc.keepalive_permit_without_calls': 1,
    'grpc.http2.max_pings_without_data': 0,
    'grpc.http2.min_time_between_pings_ms': 10000,
    'grpc.http2.min_ping_interval_without_data_ms': 5000,
  };
  return new GrpcService(host, grpc.credentials.createInsecure(), options);
}

function createCallOptions(timeoutMs = 60000) {
  const deadline = createDeadline(timeoutMs);
  return {
    deadline,
  };
}

function createDeadline(timeoutMs = 60000) {
  const deadline = new Date(Date.now() + timeoutMs);
  return deadline;
}

module.exports = {
  createGrpcClient,
  createCallOptions,
};
