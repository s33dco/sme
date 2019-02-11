module.exports = (req, res, next) => {
  // req.user from auth middleware

  // 401 unauth
  // 403 forbidden

  if (!req.user.isAdmin) {
    req.flash('alert', `You can only view!`);
    res.status(403);
    throw ({
      tag : 'Computer says no...',
      message : 'You do not have access to amend, create or delete data, speak to your administrator if you need this access.',
      statusCode : 403
      });
      logger.info(`${e.statusCode} - ${e.tag} - ${e.message} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${ip} - ${req.user}`);
      next(Error);
    };

  next();
}
