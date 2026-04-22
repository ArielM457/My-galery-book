const { USERS, createTokenForUsername, jsonResponse } = require('../common');

module.exports = async function (context, req) {
  const { username, password } = req.body || {};
  const user = USERS.find(u => u.username === username && u.password === password);

  if (!user) {
    context.res = jsonResponse(401, { error: 'Credenciales inválidas' });
    return;
  }

  const token = createTokenForUsername(user.username);

  context.res = jsonResponse(200, { token, username: user.username });
};
