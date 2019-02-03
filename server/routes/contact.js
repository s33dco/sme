const express           = require('express');
const router            = express.Router();
const bodyParser        = require('body-parser');
const moment            = require('moment');
const {validationResult}= require('express-validator/check');
const validate          = require('../validators')
const {mongoose}        = require('../db/mongoose');

router.get('/', (req, res) => {
  res.render('contact', {
    data: {},
    errors: {},
    csrfToken: req.csrfToken(),  // generate a csrf token
    pageTitle: "Get in touch.",
    pageDescription: "We'd love to hear from you."
  })
})

router.post('/', validate.email, (req, res) => {
  const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.render('contact', {
        data: req.body,
        errors: errors.mapped(),
        csrfToken: req.csrfToken(),  // generate new csrf token
        pageTitle: "Get in touch.",
        pageDescription: "Give it another shot."
        });
      };

      // send the email.....


    req.flash('success', `Thanks for the message ${req.body.email}! I‘ll be in touch :)`)
    res.redirect('/')

});

module.exports = router
