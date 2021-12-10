async function getPatient(parent, args, context, info) {
  const { dataSources } = context;
  const result = dataSources.getPatient(args, context, info);
  return result;
}

async function getPatients(parent, args, context, info) {
  const { dataSources } = context;
  const result = dataSources.getPatients(args, context, info);
  return result;
}

module.exports = { patient: getPatient,
  patients: getPatients };
