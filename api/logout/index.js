const { extractBearerToken, jsonResponse, revokeToken } = require('../common');

module.exports = async function (context, req) {
  const token = extractBearerToken(req);
  revokeToken(token);
  context.res = jsonResponse(200, { ok: true });
};
