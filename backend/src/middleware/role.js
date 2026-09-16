const { error } = require('../utils/response');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required', 401);
    }
    if (!roles.includes(req.user.role)) {
      return error(res, `Forbidden: requires ${roles.join(' or ')} role`, 403);
    }
    next();
  };
}

module.exports = {
  requireRole
};
