const express   = require('express');
const router    = express.Router();
const config    = require('config');

router.get('/', (req, res) => {
  res.render('index', {
    pageTitle: `${config.get('SME_TITLE')}`,
    pageDescription: "Static website with invoicing backend."
  })
});

module.exports = router
