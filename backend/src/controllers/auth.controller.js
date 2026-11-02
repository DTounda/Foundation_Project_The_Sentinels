const { parseEmail, parsePassword, parseFullName } = require('../utils/validators');

function createAuthController({ authService }) {
  return {
    async register(req, res) {
      const body = req.body || {};
      const result = await authService.register({
        fullName: parseFullName(body.fullName),
        email: parseEmail(body.email),
        password: parsePassword(body.password),
      });
      res.status(201).json(result);
    },

    async login(req, res) {
      const body = req.body || {};
      const result = await authService.login({
        email: parseEmail(body.email),
        // Only check it is text: we do not reveal password rules on login.
        password: typeof body.password === 'string' ? body.password : '',
      });
      res.status(200).json(result);
    },
  };
}

module.exports = { createAuthController };
