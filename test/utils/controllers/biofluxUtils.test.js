const assert = require('assert');
const { ObjectId } = require('mongoose').Types;
const { getBiofluxFacility } = require('../../../app/datasources/utils/controllers');

jest.mock('../../../app/datasources/utils/grpc/biofluxBridgeService.js');

const { getFacilitiesClients } = require('../../../app/datasources/utils/grpc');

describe('biofluxUtils:', () => {
  test('From input fail   -  Return null', async () => {
    getFacilitiesClients.mockImplementation(() => ({ isSuccess: false }));
    const result = await getBiofluxFacility({ _id: ObjectId() });
    assert.strictEqual(result, '');
  });

  test('From input success   -  Return true', async () => {
    getFacilitiesClients.mockImplementation(() => ({ isSuccess: true, facility: [ObjectId()] }));
    const result = await getBiofluxFacility({ _id: ObjectId() });
    assert.strictEqual(result.length, 1);
  });
});
