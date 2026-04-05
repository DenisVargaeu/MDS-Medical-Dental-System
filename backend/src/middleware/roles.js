/**
 * Role-based access control middleware factory.
 * Usage: roles('admin', 'doctor')
 */
const roles = (...allowedRoles) => {
  // Support both roles('admin', 'doctor') and roles(['admin', 'doctor'])
  if (Array.isArray(allowedRoles[0])) {
    allowedRoles = allowedRoles[0];
  }
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
    next();
  };
};

module.exports = roles;
