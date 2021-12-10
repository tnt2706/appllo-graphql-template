const _ = require('lodash');
const faker = require('faker');
const { ObjectId } = require('mongoose').Types;
const request = require('supertest');
const randomstring = require('randomstring');
const requireGraphqlFile = require('require-graphql-file');
const assert = require('assert');
const { connectDatabase } = require('../../helpers/db');

const app = require('../../../app/app');

const User = require('../../../app/datasources/models/User');

const GRAPHQL_FILE = requireGraphqlFile('./patients.graphql');

describe('Get Patients: ', () => {
  let users = [];
  let facilityIds = [];
  let signature;
  let signatureFail;
  const facilityIdTest = ObjectId();

  beforeAll(async () => {
    await connectDatabase();
    facilityIds = [facilityIdTest, ObjectId()];

    users = await User.insertMany(
      _.range(0, 100)
        .map(() => ({
          email: faker.internet.email(),
          cognitoUsername: randomstring.generate(12),
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
          roles: ['Patient'],
          cognitoId: randomstring.generate(20),
          currentFacility: _.sample([facilityIdTest]),
          facility: _.sample([facilityIdTest]),
        })),
    );
    signature = JSON.stringify({ roles: ['Clinic Technician'], facilityIds });
    signatureFail = JSON.stringify({ roles: ['Clinic Technician'], facilityIds: [ObjectId] });
  });

  test('From facilityIds fail with role Patient  -  Return null', async () => {
    const randomUser = _.random(0, users.length - 1);
    const signaturePatient = JSON.stringify({ facilityIds: [ObjectId], roles: ['Patient'], id: users[randomUser]._id });

    const res = await request(app)
      .post('/graphql')
      .set('signature', signaturePatient)
      .set('access-token', randomstring.generate(50))
      .send({
        query: GRAPHQL_FILE,
        variables: {
          filter: {
            sortOrder: 'desc',
          },
        },
      });
    const { patients } = res.body.data;
    assert.strictEqual(patients.length, 0);
  });

  test('From facilityIds fail with role Clinic Technician  -  Return null', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('signature', signatureFail)
      .set('access-token', randomstring.generate(50))
      .send({
        query: GRAPHQL_FILE,
        variables: {
          filter: {
            sortOrder: 'desc',
          },
        },
      });
    const { patients } = res.body.data;
    assert.strictEqual(patients.length, 0);
  });

  test('From facility fail with role Clinic Technician  -  Return users limit in database', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('signature', signature)
      .set('access-token', randomstring.generate(50))
      .send({
        query: GRAPHQL_FILE,
        variables: {
          filter: {
            sortOrder: 'desc',
          },
          limit: 5,
        },
      });

    const { patients } = res.body.data;
    assert.strictEqual(patients.length, 5);
  });

  test('From facilityIds success ( with role Clinic Technician ) and limit -  Return users limit in database', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('signature', signature)
      .set('access-token', randomstring.generate(50))
      .send({
        query: GRAPHQL_FILE,
        variables: {
          filter: {
            sortOrder: 'desc',
          },
          limit: 5,
        },
      });

    const { patients } = res.body.data;
    assert.strictEqual(patients.length, 5);
  });

  test('From facilityIds success ( with role Clinic Technician )  -  Return all users in database', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('signature', signature)
      .set('access-token', randomstring.generate(50))
      .send({
        query: GRAPHQL_FILE,
        variables: {
          filter: {
            sortOrder: 'desc',
          },
          limit: 2000,
        },
      });

    const { patients } = res.body.data;
    assert.strictEqual(patients.length, users.length);
  });

  test('From input success with role Patient  -  Return users limit in database', async () => {
    const randomUser = _.random(0, users.length - 1);
    const signaturePatient = JSON.stringify({ facilityIds, roles: ['Patient'], id: users[randomUser]._id });

    const res = await request(app)
      .post('/graphql')
      .set('signature', signaturePatient)
      .set('access-token', randomstring.generate(50))
      .send({
        query: GRAPHQL_FILE,
        variables: {
          filter: {
            sortOrder: 'desc',
          },
        },
      });
    const { patients } = res.body.data;
    assert.strictEqual(patients.length, 1);
  });
});
