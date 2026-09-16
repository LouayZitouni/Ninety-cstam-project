const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    const error = new Error('Access denied: Admin privileges required');
    error.statusCode = 403; 
    return next(error);
  }

  next();
};

module.exports = isAdmin;
