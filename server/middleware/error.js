module.exports = ((err, req, res, next) => {
    res.status(500).render('500', {
      err,
      pageTitle: "500",
      pageDescription: "Err, What?"
    });
});
