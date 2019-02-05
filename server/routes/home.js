const express           = require('express');
const router            = express.Router();

router.get('/', (req, res) => {
  res.render('index', {
    pageTitle: "Welcome to SME",
    pageDescription: "Static website with invoicing backend."
  })
});

module.exports = router
