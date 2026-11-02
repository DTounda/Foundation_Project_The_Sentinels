const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

function createAuthService({ userRepository, config }) {
  const { secret, expiresIn } = config.jwt;
  const rounds = config.bcryptRounds;
  // Compared against when the email is unknown, so "no such user" and "wrong password"
  // take about the same time (prevents guessing which emails have accounts).
  const dummyHash = bcrypt.hashSync('not-a-real-password', rounds);

  function publicUser(user) {
    return { id: user.id, fullName: user.fullName, email: user.email, role: user.role };
  }

  function signToken(user) {
    return jwt.sign({ role: user.role }, secret, {
      subject: String(user.id),
      expiresIn,
      algorithm: 'HS256',
    });
  }

  return {
    async register({ fullName, email, password }) {
      if (await userRepository.findByEmail(email)) {
        throw AppError.conflict('An account with this email already exists');
      }
      const passwordHash = await bcrypt.hash(password, rounds);
      let user;
      try {
        user = await userRepository.create({ fullName, email, passwordHash });
      } catch (err) {
        // Two sign-ups with the same email at the same instant: the UNIQUE index catches it.
        if (err && err.code === 'ER_DUP_ENTRY') {
          throw AppError.conflict('An account with this email already exists');
        }
        throw err;
      }
      return { user: publicUser(user), token: signToken(user) };
    },

    async login({ email, password }) {
      const user = await userRepository.findByEmail(email);
      const matches = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);
      if (!user || !matches) {
        throw AppError.unauthorized('Invalid email or password');
      }
      return { user: publicUser(user), token: signToken(user) };
    },

    /** Returns { id, role } or throws 401. */
    verifyToken(token) {
      try {
        const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
        return { id: Number(payload.sub), role: payload.role };
      } catch {
        throw AppError.unauthorized('Invalid or expired token');
      }
    },
  };
}

module.exports = { createAuthService };
