function success(res, data = {}, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function error(res, message = 'An error occurred', statusCode = 500, errors = null) {
  const responseBody = {
    success: false,
    message
  };
  if (errors) {
    responseBody.errors = errors;
  }
  return res.status(statusCode).json(responseBody);
}

module.exports = {
  success,
  error
};
