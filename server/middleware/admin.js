module.exports = (req, res, next) => {
  // req.user from auth middleware

  // 401 unauth
  // 403 forbidden

  if (!req.user.isAdmin) {
    req.flash('alert', `You can't change data, only view.`);
    return res.redirect('/dashboard');
    };
  next();
}
