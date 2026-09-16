const { verifyToken } = require('../utils/jwt');
const { pool } = require('../config/db');
const { error } = require('../utils/response');

async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authentication token missing or invalid', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    // Verify user still exists in database
    const userRes = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [decoded.sub || decoded.id]
    );

    if (userRes.rows.length === 0) {
      return error(res, 'User no longer exists', 401);
    }

    req.user = userRes.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token has expired', 401);
    }
    return error(res, 'Invalid token', 401);
  }
}

module.exports = {
  authenticateJWT
};
