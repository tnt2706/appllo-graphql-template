const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const subDirs = [
  'directives', 'types', 'inputs', 'mutations', 'queries', 'responses',
];

const typeDefs = _.flatMap(_.map(subDirs, (subDir) => {
  const schemaPath = path.join(__dirname, 'schemas', subDir);
  return fs.readdirSync(schemaPath).map((file) => {
    if (_.startsWith(file, '__')) {
      return '';
    }
    const filePath = path.join(schemaPath, file);
    return fs.readFileSync(filePath, 'utf8').toString();
  });
}));

module.exports = typeDefs;
