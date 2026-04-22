const { jsonResponse, requireAuthenticatedUsername } = require('../common');

module.exports = async function (context, req) {
  const authResult = requireAuthenticatedUsername(req);
  if (authResult.errorResponse) {
    context.res = authResult.errorResponse;
    return;
  }

  context.res = jsonResponse(200, {
    authenticated: true,
    username: authResult.username,
  });
};
