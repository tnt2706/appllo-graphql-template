const DataLoader = require('dataloader');
const { loaders } = require('../../datasources')();

function createLoaders() {
  return {
    patient: new DataLoader((keys) => loaders.batchPatient(keys)),
    sf36Result: new DataLoader((keys) => loaders.batchSF36Result(keys)),
    consent: new DataLoader((keys) => loaders.batchConsent(keys)),
  };
}

module.exports = {
  createLoaders,
};
