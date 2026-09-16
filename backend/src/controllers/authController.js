const authService = require('../services/authService');
const { success, error } = require('../utils/response');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const result = await authService.registerStudent({ name, email, password });
    return success(res, result, 'Student registered successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    return success(res, result, 'Logged in successfully', 200);
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    return success(res, { user: req.user }, 'Current user profile', 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe
};
