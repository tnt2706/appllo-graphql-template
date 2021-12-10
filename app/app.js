const express = require('express');
const { ApolloServer, gql, SchemaDirectiveVisitor } = require('apollo-server-express');
const { ApolloServerPluginInlineTraceDisabled } = require('apollo-server-core');
const { buildFederatedSchema } = require('@apollo/federation');
const utf8 = require('utf8');

const directives = require('./directives');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');
const dataSources = require('./datasources');
const { createLoaders } = require('./utils/loaders');
const { healthcheck } = require('./datasources/healthcheck');

const app = express();

app.get('/healthcheck', (req, res) => {
  const isHealthy = healthcheck();
  if (!isHealthy) {
    res.status(422).send({ isSuccess: false });
    return;
  }
  res.status(200).send({ isSuccess: true });
});

const reqContext = async ({ req }) => {
  const { query } = req.body;
  if (query && query.match(/GetServiceDefinition/)) {
    return {};
  }
  const signature = JSON.parse(utf8.decode(req.headers.signature || '{}'));

  return ({
    signature,
    token: req.headers['access-token'],
    loaders: createLoaders(),
  });
};

const federatedSchema = buildFederatedSchema([
  {
    typeDefs: gql`${typeDefs}`,
    resolvers,
  },
]);

SchemaDirectiveVisitor.visitSchemaDirectives(federatedSchema, directives);

const server = new ApolloServer({
  schema: federatedSchema,
  dataSources,
  context: reqContext,
  // plugins: [
  //   ApolloServerPluginInlineTraceDisabled(),
  //   {
  //     requestDidStart() {
  //       return {
  //         willSendResponse({ context, response }) {
  //           response.http.headers.append(
  //             'audit',
  //             utf8.encode(JSON.stringify(context.audit || {})),
  //           );
  //         },
  //       };
  //     },
  //   },
  // ],
  formatError: (error) => {
    logger.error('error', error.stack || error.mesage || error);
    return error;
  },
});

server.applyMiddleware({ app, path: '/' });

module.exports = app;
