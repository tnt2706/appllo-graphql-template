async function addCompletedProfile(_, args, context, info) {
  const { dataSources } = context;
  const result = await dataSources.addCompletedProfile(args, context, info);
  return result;
}

module.exports = {
  addCompletedProfile,

};
