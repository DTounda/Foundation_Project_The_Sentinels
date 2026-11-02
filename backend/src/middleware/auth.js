const AppError = require('../utils/AppError');

function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw AppError.unauthorized('Authorization header must be: Bearer <token>');
  }
  return token;
}

/**
 * requireAuth: 401 unless a valid token is sent. Sets req.user = { id, role }.
 * optionalAuth: anonymous is fine, BUT a token that is sent and invalid is rejected.
 *   (If an expired token were silently treated as anonymous, the user would lose their
 *   allergy alerts without knowing. Failing loudly is the safe choice.)
 */
function createAuthMiddleware({ authService }) {
  return {
    requireAuth(req, _res, next) {
      try {
        const token = extractBearerToken(req);
        if (!token) throw AppError.unauthorized();
        req.user = authService.verifyToken(token);
        next();
      } catch (err) {
        next(err);
      }
    },

    optionalAuth(req, _res, next) {
      try {
        const token = extractBearerToken(req);
        if (token) req.user = authService.verifyToken(token);
        next();
      } catch (err) {
        next(err);
      }
    },
  };
}

module.exports = { createAuthMiddleware };
