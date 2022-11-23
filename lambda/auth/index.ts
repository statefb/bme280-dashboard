const LAMBDA_API_KEY = process.env.LAMBDA_API_KEY || "";

exports.handler = async (event: any) => {
  // console.log(`event >`, JSON.stringify(event, null, 2));

  const {
    authorizationToken,
    requestContext: { apiId, accountId },
  } = event;
  const response = {
    isAuthorized: authorizationToken === LAMBDA_API_KEY,
    resolverContext: {},
    deniedFields: [],
    ttlOverride: 10,
  };
  // console.log(`response >`, JSON.stringify(response, null, 2));
  return response;
};
