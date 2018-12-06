const express       = require('express');
const router        = express.Router();
const bodyParser    = require('body-parser');
const { check,
 validationResult } = require('express-validator/check');
const {mongoose}    = require('./db/mongoose');
const {Invoice}     = require("./models/invoice");
const {User}        = require("./models/user");
const {Client}      = require("./models/client");

// ********************************************
// public routes
// ********************************************

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

// private routes

router.post('/login', [                           // users/login
    check('email')
      .isEmail()
      .withMessage('That email doesn‘t look right')
      .trim()
      .normalizeEmail(),
    check('password')
      .isLength({ min: 7 })
      .withMessage("password too short!")
      .trim()
    ],
      (req, res) => {
          // console.log(req.body)
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
        console.log(email, password);

        // check email and password with db and generate x-token


        // set flash message and redirect
        req.flash('success', `Welcome back!`)
        res.redirect('/dashboard')
});

router.get('/logout', (req, res, next) => {
    // delete tokens

    req.flash('alert', "You've logged out, come back soon.")
    res.redirect('/');
});   // logout delete tokens

router.get('/dashboard', (req, res) => {          // redirect for success login
    res.render('dashboard', {
    pageTitle: "Invoice and Admin",
    pageDescription: "Let's get paid!."
  });
});


// ********************************************
// invoice routes
// ********************************************

router.get('/invoices', (req, res) => {           // list all invoices invoices home
    res.render('invoices/invoices', {
    pageTitle: "Invoices",
    pageDescription: "Invoice Admin."
  });
});

// GET/invoices/new

// POST/invoices

// GET/invoices/:id

// PATCH/invoices/:id

// DELETE/invoices/:id



// ********************************************
// client routes
// ********************************************


router.get('/clients', (req, res) => {            //  view all clients
    res.render('clients/clients', {
    pageTitle: "Clients",
    pageDescription: "Client Admin."
  });
});

router.get('/clients/new', (req, res) => {          // new client form
  res.render('clients/newclient', {
    data            : {},
    errors          : {},
    csrfToken       : req.csrfToken(),  // generate a csrf token
    pageTitle       : "Add a client",
    pageDescription : "Create a new client."
  });
});

router.post('/clients', [                           // create client
  check('clientName')
    .isLength({ min: 1 })
    .withMessage("Client name too short!")
    .trim(),
  check('email')
    .isEmail()
    .withMessage('That email doesn‘t look right')
    .trim()
    .normalizeEmail()
    ], (req, res) => {
        // console.log(req.body)
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          return res.render('clients/newclient', {
            data            : req.body,
            errors          : errors.mapped(),
            csrfToken       : req.csrfToken(),  // generate new csrf token
            pageTitle       : "Add a client",
            pageDescription : "Give it another shot."
          });
        };

      let { clientName, email} = req.body;
      let body = {clientName, email};
      let client = new Client(body);

      client.save().then(() => {
        req.flash('success', `${client.clientName} created !`)
        res.redirect('/dashboard') // create custom header 'x-auth' with value of token
      }).catch((e) => {
        res.status(400).send(e);
    });
});

// GET/clients/:id

// PATCH/clients/:id

// ********************************************
// user routes
// ********************************************

router.get('/users', (req, res) => {              // list all users
  User.find().then((users) => {
    res.render('users/users', {
      pageTitle       : "Users",
      pageDescription : "User Admin.",
      users           : users
    });
  });
});

router.get('/users/new', (req, res) => {          // new user form
  res.render('users/newuser', {
    data            : {},
    errors          : {},
    csrfToken       : req.csrfToken(),  // generate a csrf token
    pageTitle       : "Add a user",
    pageDescription : "Create a new user with admin access."
  });
});

router.post('/users', [                           // create user
  check('firstName')
    .isLength({ min: 1 })
    .withMessage("first name too short!")
    .isAlpha()
    .withMessage("only letters")
    .trim(),
  check('lastName')
    .isLength({ min: 1 })
    .withMessage("lasy name too short!")
    .isAlpha()
    .withMessage("only letters")
    .trim(),
  check('email')
    .isEmail()
    .withMessage('That email doesn‘t look right')
    .trim()
    .normalizeEmail(),
  check('password')
    .isLength({ min: 7 })
    .withMessage("password too short!")
    .trim(),
  check('passwordConfirmation')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
            return false;
          } else {
            return value;
          }
    }).withMessage("Passwords don't match")
    ], (req, res) => {
        // console.log(req.body)
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          return res.render('users/newuser', {
            data            : req.body,
            errors          : errors.mapped(),
            csrfToken       : req.csrfToken(),  // generate new csrf token
            pageTitle       : "Add a user",
            pageDescription : "Give it another shot."
          });
        };

      let { firstName, lastName, email, mobile, password } = req.body;
      let body = {firstName, lastName, email, password};
      let user = new User(body);

// todo
// do not make token and auth new user.

      user.save().then(() => {
        return user.generateAuthToken();
      }).then((token) => {
        req.flash('success', `${user.firstName} ${user.lastName} created !`)
        res.header('x-auth', token).redirect('/dashboard') // create custom header 'x-auth' with value of token
      }).catch((e) => {
        res.status(400).send(e);
    });
});

// PATCH/users/:id

// DELETE/users/:id  (can't delete yourself)


module.exports = router
