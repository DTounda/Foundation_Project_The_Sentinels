const AppError = require('../utils/AppError');

function notFoundHandler(req, _res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
  }
  // Malformed JSON body
  if (err && err.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ error: { code: 'VALIDATION_ERROR', message: 'Request body is not valid JSON' } });
  }
  // Unexpected: log the detail on the server, show nothing sensitive to the client.
  console.error(err);
  return res
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side' } });
}

module.exports = { notFoundHandler, errorHandler };
