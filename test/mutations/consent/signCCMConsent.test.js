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

const User = require('../../../app/datasources/models/User');
const CarePlan = require('../../../app/datasources/models/CarePlan');
const MasterData = require('../../../app/datasources/models/MasterData');
const Consent = require('../../../app/datasources/models/Consent');

const GRAPHQL_FILE = requireGraphqlFile('./signCCMConsent');

describe('Sign CCM Consent: ', () => {
  let signature;
  const codeCCM = randomstring.generate(10);
  const userIdTest = ObjectId();
  const carePlanIdTest = ObjectId();
  const facilityIdTest = ObjectId();

  beforeAll(async () => {
    await connectDatabase();

    await User.insertMany(
      _.range(0, 10)
        .map((user, index) => ({
          _id: index === 1 ? userIdTest : ObjectId(),
          email: faker.internet.email(),
          height: 168,
          cognitoUsername: randomstring.generate(12),
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
          roles: ['Patient'],
          cognitoId: randomstring.generate(20),
          facility: ObjectId(),
        })),
    );

    await Consent.insertMany(
      _.range(0, 10)
        .map((consent, index) => ({
          carePlan: index === 1 ? carePlanIdTest : ObjectId(),
          patient: index === 1 ? userIdTest : ObjectId(),
          code: index === 1 ? codeCCM : randomstring.generate(10),
        })),
    );

    await MasterData.insertMany(
      _.range(0, 10)
        .map((master, index) => ({
          carePlan: index === 1 ? carePlanIdTest : ObjectId(),
          patient: index === 1 ? userIdTest : ObjectId(),
          code: index === 0 ? codeCCM : randomstring.generate(10),
        })),
    );

    await CarePlan.insertMany(
      _.range(0, 100)
        .map((carePlan, index) => ({
          _id: index === 1 ? carePlanIdTest : ObjectId(),
          friendlyId: faker.datatype.number(),
          facility: index === 1 ? facilityIdTest : ObjectId(),
          patient: index === 1 ? userIdTest : ObjectId(),
          status: index === 1 ? 'Active' :  _.sample(['New', 'Inactive']),
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

  test('From input fail ( Master code not found ) -  Return false', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: GRAPHQL_FILE,
        variables: {
          input: {
            code: randomstring.generate(10),
            carePlanId: ObjectId(),
            signaturePath: randomstring.generate(20),
          },
        },
      })
      .set('Accept', 'application/json')
      .set('access-token', randomstring.generate(100))
      .set('signature', JSON.stringify(signature))
      .expect('Content-Type', /json/)
      .expect(200);
    const { isSuccess } = res?.body?.data?.signCCMConsent;
    assert.strictEqual(isSuccess, false);
  });

  test('From input fail (CarePlan not found ) -  Return false', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: GRAPHQL_FILE,
        variables: {
          input: {
            code: codeCCM,
            carePlanId: ObjectId(),
            signaturePath: randomstring.generate(20),
          },
        },
      })
      .set('Accept', 'application/json')
      .set('access-token', randomstring.generate(100))
      .set('signature', JSON.stringify(signature))
      .expect('Content-Type', /json/)
      .expect(200);
    const { isSuccess } = res?.body?.data?.signCCMConsent;
    assert.strictEqual(isSuccess, false);
  });

  test('From input fail (Patient not found ) -  Return false', async () => {
    const signaturePatient = {
      id: ObjectId(),
      cognitoUsername: randomstring.generate(12),
      roles: ['Patient'],
      cognitoId: randomstring.generate(20),
    };
    const res = await request(app)
      .post('/graphql')
      .send({
        query: GRAPHQL_FILE,
        variables: {
          input: {
            code: codeCCM,
            carePlanId: carePlanIdTest,
            signaturePath: randomstring.generate(20),
          },
        },
      })
      .set('Accept', 'application/json')
      .set('access-token', randomstring.generate(100))
      .set('signature', JSON.stringify(signaturePatient))
      .expect('Content-Type', /json/)
      .expect(200);
    const { isSuccess } = res?.body?.data?.signCCMConsent;
    assert.strictEqual(isSuccess, false);
  });

  test('From input success  -  Return true', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: GRAPHQL_FILE,
        variables: {
          input: {
            code: codeCCM,
            carePlanId: carePlanIdTest,
            signaturePath: randomstring.generate(20),
          },
        },
      })
      .set('Accept', 'application/json')
      .set('access-token', randomstring.generate(100))
      .set('signature', JSON.stringify(signature))
      .expect('Content-Type', /json/)
      .expect(200);
    const { isSuccess } = res?.body?.data?.signCCMConsent;
    assert.strictEqual(isSuccess, true);
  });
});
