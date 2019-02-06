const logger = require('../config/winston')

module.exports = ((err, req, res, next) => {

  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, err);

  if (err.message === 'Wrong Credentials') {
    req.flash('alert', "those details are wrong...")
    return res.render('index', {
      pageTitle: "Welcome to SME",
      pageDescription: "Static website with invoicing backend.",
    });
  }

  if (err.message === "No find") {
    req.flash('alert', "We can't get that for you.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });

  } else {

    res.status(500).render('500', {
      err,
      pageTitle: "500",
      pageDescription: "Err, What?"
    });
  }

});
