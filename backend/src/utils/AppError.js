/** An error we expect and can safely show to the client. */
class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }

  static unreadable(message) {
    return new AppError(422, 'UNREADABLE', message);
  }

  static validation(message) {
    return new AppError(400, 'VALIDATION_ERROR', message);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static notFound(message = 'Not found') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message) {
    return new AppError(409, 'CONFLICT', message);
  }
}

module.exports = AppError;
