const { parseEmail, parsePassword, parseContactName, parsePhone } = require('../utils/validators');

function createAuthController({ authService }) {
  return {
    async register(req, res) {
      const body = req.body || {};
      const firstName = parseContactName(body.firstName, 'firstName');
      const lastName = parseContactName(body.lastName, 'lastName');
      const result = await authService.register({
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email: parseEmail(body.email),
        phone: parsePhone(body.phone),
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
