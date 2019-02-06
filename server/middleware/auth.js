const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {

    const token = req.cookies.token;

    if (!token) {
      req.flash('alert', `You need to log in.`)
      res.redirect('login');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      res.locals.loggedIn = req.user;
      res.locals.fullAdmin = req.user.isAdmin;
      next();
    }
    catch (e) {
      res.clearCookie("token");
      req.flash('alert', `Invalid token - ${e.message}`)
      res.redirect('/');
    }
}
