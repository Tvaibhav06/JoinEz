const { error } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);

  // Handle known PostgreSQL error codes
  if (err.code === '23505') {
    // Unique violation
    return error(res, 'A record with this information already exists', 409, { detail: err.detail });
  }

  if (err.code === '23503') {
    // Foreign key violation
    return error(res, 'Referenced record does not exist', 400, { detail: err.detail });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return error(res, message, statusCode);
}

module.exports = {
  errorHandler
};
