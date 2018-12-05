const express       = require('express')
const router        = express.Router()
const bodyParser    = require('body-parser')
const { check,
 validationResult } = require('express-validator/check')
const {mongoose}    = require('./db/mongoose');
const {Invoice}     = require("./models/invoice");
const {User}        = require("./models/user");


router.get('/', (req, res) => {
  res.render('index', {
    pageTitle: "Welcome to SME",
    pageDescription: "Static website with invoicing backend."
  })
})

router.get('/contact', (req, res) => {
  res.render('contact', {
    data: {},
    errors: {},
    csrfToken: req.csrfToken(),  // generate a csrf token
    pageTitle: "Get in touch.",
    pageDescription: "We'd love to hear from you."
  })
})

router.post('/contact', [
        check('message')
          .isLength({ min: 1 })
          .withMessage('Message is required')
          .trim(),
        check('email')
          .isEmail()
          .withMessage('That email doesn‘t look right')
          .trim()
          .normalizeEmail()
        ], (req, res) => {
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

  console.log(req.body)

  req.flash('success', `Thanks for the message ${req.body.email}! I‘ll be in touch :)`)
  res.redirect('/')
});

router.get('/login', (req, res) => {
  res.render('login', {
    data: {},
    errors: {},
    csrfToken: req.csrfToken(),  // generate a csrf token
    pageTitle: "Sign In.",
    pageDescription: "Come on in."
  })
})

router.post('/login', [
        check('email')
          .isEmail()
          .withMessage('That email doesn‘t look right')
          .trim()
          .normalizeEmail(),
        check('password')
          .isLength({ min: 7 })
          .withMessage("password too short!")
          .trim(),
        ], (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
    return res.render('login', {
      data: req.body,
      errors: errors.mapped(),
      csrfToken: req.csrfToken(),  // generate new csrf token
      pageTitle: "Sign In.",
      pageDescription: "Give it another shot."
      });
    };
  console.log(req.body)
  req.flash('success', `Welcome home :)`)
  res.redirect('/dashboard')
});


// app.post('/login',[
// 	check('email').isEmail()
// 		.withMessage('must be valid address')
// 		.normalizeEmail(),
// 	check('password').isLength({min: 7})
// 		.withMessage('should be atleast seven characters long')
// 		.trim().escape()
// 									], (req, res) => {
//
// 			console.log(req.headers);
// 			console.log(req.body);
// 			const errors = validationResult(req);
// 			if (!errors.isEmpty()) {
// 					errors.array().forEach((e) => {
// 						console.log(e.param, e.msg);
// 					});
// 					req.session.sessionFlash = {
// 																					type: 'problem',
// 																					message: 'there was a .'
// 																			}
// 					return res.status(422).redirect('/login');
// 			}
// 			res.redirect('/dashboard');
// });

router.get('/dashboard', (req, res) => {
    res.render('dashboard', {
    pageTitle: "Invoice and Admin",
    pageDescription: "Let's get paid!."
  });
});

router.get('/invoices', (req, res) => {
    res.render('invoices', {
    pageTitle: "Invoices",
    pageDescription: "Invoice Admin."
  });
});

router.get('/clients', (req, res) => {
    res.render('clients', {
    pageTitle: "Clients",
    pageDescription: "Client Admin."
  });
});

router.get('/users', (req, res) => {
    res.render('users', {
    pageTitle: "Users",
    pageDescription: "User Admin."
  });
});




module.exports = router
