const _ = require('lodash');
const faker = require('faker');
const { ObjectId } = require('mongoose').Types;
const request = require('supertest');
const randomstring = require('randomstring');
const requireGraphqlFile = require('require-graphql-file');
const utf8 = require('utf8');
const assert = require('assert');
const { connectDatabase } = require('../../helpers/db');

const app = require('../../../app/app');

const User = require('../../../app/datasources/models/User');

const GRAPHQL_FILE = requireGraphqlFile('./patient.graphql');

describe('Get Patient: ', () => {
  let users = [];

  beforeAll(async () => {
    await connectDatabase();

    users = await User.insertMany(
      _.range(0, 10)
        .map(() => ({
          email: faker.internet.email(),
          cognitoUsername: randomstring.generate(12),
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
          roles: ['Patient'],
          cognitoId: randomstring.generate(20),
          facility: ObjectId(),
          isProfileCompleted: {
            cardiac: _.sample([true, false]),
            telemed: _.sample([true, false]),
            bioheart: _.sample([true, false]),
          },
        })),
    );
  });

  test.each([
    { email: faker.internet.email() },
    { id: ObjectId() },
    { email: faker.internet.email(), id: ObjectId() },
  ])('Input is fail -  Return user null', async (input) => {
    const signature = utf8.encode(JSON.stringify({
      cognitoUsername: randomstring.generate(12),
      cognitoId: randomstring.generate(20),
    }));
    const res = await request(app)
      .post('/graphql')
      .set('signature', signature)
      .set('access-token', randomstring.generate(50))
      .send({
        query: GRAPHQL_FILE,
        variables: {
          input,
        },
      });
    const { patient } = res.body.data;
    assert.strictEqual(patient, null);
  });

  test('From input : email success -  Return user', async () => {
    const signature = utf8.encode(JSON.stringify({ ...users[0].toJSON() }));
    const randomUser = _.random(0, users.length - 1);

    const res = await request(app)
      .post('/graphql')
      .set('signature', signature)
      .set('access-token', randomstring.generate(50))
      .send({
        query: GRAPHQL_FILE,
        variables: {
          email: users[randomUser].email,
        },
      });

    const { patient: { email } } = res.body.data;
    assert.strictEqual(email, users[randomUser].email);
  });

  test('From input : Id success -  Return user', async () => {
    const signature = utf8.encode(JSON.stringify({ ...users[0].toJSON() }));
    const randomUser = _.random(0, users.length - 1);

    const res = await request(app)
      .post('/graphql')
      .set('signature', signature)
      .set('access-token', randomstring.generate(50))
      .send({
        query: GRAPHQL_FILE,
        variables: {
          id: users[randomUser]._id,
        },
      });

    const { patient: { email } } = res.body.data;
    assert.strictEqual(email, users[randomUser].email);
  });

  test('From input: email and Id success -  Return user', async () => {
    const signature = utf8.encode(JSON.stringify({ ...users[0].toJSON() }));
    const randomUser = _.random(0, users.length - 1);

    const res = await request(app)
      .post('/graphql')
      .set('signature', signature)
      .set('access-token', randomstring.generate(50))
      .send({
        query: GRAPHQL_FILE,
        variables: {
          email: users[randomUser].email,
          id: users[randomUser]._id,
        },
      });

    const { patient: { email } } = res.body.data;
    assert.strictEqual(email, users[randomUser].email);
  });
});
