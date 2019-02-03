const express           = require('express');
const router            = express.Router();
const bodyParser        = require('body-parser');
const moment            = require('moment');
const {validationResult}= require('express-validator/check');
const validate          = require('../validators')
const {mongoose}        = require('../db/mongoose');
const {User}            = require("../models/user");


router.get('/', (req, res) => {
  res.render('login', {
    data: {},
    errors: {},
    csrfToken: req.csrfToken(),  // generate a csrf token
    pageTitle: "Sign In.",
    pageDescription: "Come on in."
  })
})

router.post('/', validate.login, (req, res) => {

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.render('login', {
        data            : req.body,
        errors          : errors.mapped(),
        csrfToken       : req.csrfToken(),  // generate new csrf token
        pageTitle       : "Sign In.",
        pageDescription : "Give it another shot."
    });
  };

  let {email, password} = req.body;

    User.findByCredentials(email, password)
    .then((user) => {

      console.log(user);

      user.generateAuthToken()
      .then((token) => {    // generate token on validated user keep promise chaining incase of errors
        res.set('x-auth', token);
        req.flash('success', `Welcome back!`)
        res.render('index', {
          pageTitle: "Welcome to SME",
          pageDescription: "Static website with invoicing backend.",
          token
        })
      });
    }).catch((e) => {
      req.flash('alert', e.message)
      res.redirect('/index')
    })
});

module.exports = router
