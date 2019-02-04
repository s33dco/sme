const express           = require('express');
const router            = express.Router();


router.get('/', (req, res) => {
  res.clearCookie("token");
  req.flash('alert', `You're logged out.`)
  return res.render('index', {
    pageTitle: "Welcome to SME",
    pageDescription: "Static website with invoicing backend.",
  });
})

module.exports = router
