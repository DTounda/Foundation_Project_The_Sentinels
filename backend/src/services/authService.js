const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

function createAuthService({ userRepository, config }) {
  const { secret, expiresIn } = config.jwt;
  const rounds = config.bcryptRounds;
  // Compared against when the email is unknown, so "no such user" and "wrong password"
  // take about the same time (prevents guessing which emails have accounts).
  const dummyHash = bcrypt.hashSync('not-a-real-password', rounds);

  function splitName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  }

  function publicUser(user) {
    const { firstName, lastName } = splitName(user.fullName);
    return {
      id: user.id,
      fullName: user.fullName,
      firstName,
      lastName,
      email: user.email,
      phone: user.phone || null,
      role: user.role,
    };
  }

  function signToken(user) {
    return jwt.sign({ role: user.role }, secret, {
      subject: String(user.id),
      expiresIn,
      algorithm: 'HS256',
    });
  }

  return {
    async register({ firstName, lastName, fullName, email, phone, password }) {
      if (await userRepository.findByEmail(email)) {
        throw AppError.conflict('An account with this email already exists');
      }
      const resolvedFullName = fullName || `${firstName} ${lastName}`;
      const passwordHash = await bcrypt.hash(password, rounds);
      const user = await userRepository.create({
        fullName: resolvedFullName,
        email,
        phone,
        passwordHash,
      });
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
