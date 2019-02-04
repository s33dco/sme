const jwt = require('jsonwebtoken');


module.exports = (req, res, next) => {

    const token = req.cookies.token;
    if (!token) {

      req.flash('alert', `Wrong Credentials`)
      return res.render('index', {
        pageTitle: "Welcome to SME",
        pageDescription: "Static website with invoicing backend.",
      });

    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    }
    catch (e) {
      res.clearCookie("token");
      res.status(403).send(`Invalid token - ${e.message}`)
    }
}
