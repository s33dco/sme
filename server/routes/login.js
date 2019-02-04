const bcrypt            = require('bcryptjs');
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

router.post('/', validate.login, async (req, res) => {

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

  let user = await User.findOne({email : req.body.email });

  if (!user) {
    req.flash('alert', `Wrong Credentials`)
    return res.render('index', {
      pageTitle: "Welcome to SME",
      pageDescription: "Static website with invoicing backend.",
    });
  };

  const validPassword = await bcrypt.compare(req.body.password, user.password);

  if (!validPassword) {
    req.flash('alert', `Wrong Credentials`)
    return res.render('index', {
      pageTitle: "Welcome to SME",
      pageDescription: "Static website with invoicing backend.",
    });
  };

  const token = user.generateAuthToken();

  // store token in local storage

  req.flash('success', `Welcome back ${user.firstName}`)
  res.cookie('token', token);
  res.redirect('/dashboard');
});

module.exports = router
