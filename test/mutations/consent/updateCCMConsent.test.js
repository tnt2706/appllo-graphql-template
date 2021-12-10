const _ = require('lodash');
const faker = require('faker');
const { ObjectId } = require('mongoose').Types;
const request = require('supertest');
const randomstring = require('randomstring');
const requireGraphqlFile = require('require-graphql-file');
const assert = require('assert');
const { connectDatabase } = require('../../helpers/db');

jest.mock('../../../app/datasources/utils/aws/s3Utils.js');

const app = require('../../../app/app');
const { copyS3File } = require('../../../app/datasources/utils/aws');

const CarePlan = require('../../../app/datasources/models/CarePlan');
const Consent = require('../../../app/datasources/models/Consent');

const GRAPHQL_FILE = requireGraphqlFile('./updateCCMConsent.graphql');

describe('Update CCM Consent: ', () => {
  let signature;
  const codeCCM = randomstring.generate(10);
  const consentId = ObjectId();
  const userIdTest = ObjectId();
  const carePlanIdTest = ObjectId();
  const facilityIdTest = ObjectId();

  beforeAll(async () => {
    await connectDatabase();

    await Consent.insertMany(
      _.range(0, 10)
        .map((consent, index) => ({
          _id: index === 1 ? consentId : ObjectId(),
          carePlan: index === 1 ? carePlanIdTest : ObjectId(),
          patient: index === 1 ? userIdTest : ObjectId(),
          code: index === 1 ? codeCCM : randomstring.generate(10),
        })),
    );

    await CarePlan.insertMany(
      _.range(0, 100)
        .map((carePlan, index) => ({
          _id: index === 1 ? carePlanIdTest : ObjectId(),
          friendlyId: faker.datatype.number(),
          facility: index === 1 ? facilityIdTest : ObjectId(),
          patient: index === 1 ? userIdTest : ObjectId(),
          status: index === 1 ? 'Active' : _.sample(['New', 'Inactive']),
        })),
    );
    signature = {
      id: userIdTest,
      cognitoUsername: randomstring.generate(12),
      roles: ['Patient'],
      cognitoId: randomstring.generate(20),
    };

    copyS3File.mockImplementation(() => (randomstring.generate(20)));
  });

  test('From input fail  -  Return false', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: GRAPHQL_FILE,
        variables: {
          id: ObjectId(),
          signaturePath: randomstring.generate(10),
        },
      })
      .set('Accept', 'application/json')
      .set('access-token', randomstring.generate(100))
      .set('signature', JSON.stringify(signature))
      .expect('Content-Type', /json/)
      .expect(200);
    const { isSuccess } = res?.body?.data?.updateCCMConsent;
    assert.strictEqual(isSuccess, false);
  });

  test('From input success -  Return true', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: GRAPHQL_FILE,
        variables: {
          id: consentId,
          signaturePath: randomstring.generate(30),
        },
      })
      .set('Accept', 'application/json')
      .set('access-token', randomstring.generate(100))
      .set('signature', JSON.stringify(signature))
      .expect('Content-Type', /json/)
      .expect(200);
    const { isSuccess } = res?.body?.data?.updateCCMConsent;
    assert.strictEqual(isSuccess, true);
  });
});
