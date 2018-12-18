const express         = require('express');
const router          = express.Router();
const bodyParser      = require('body-parser');
const moment          = require('moment');
const methodOverride  = require('method-override');
const { check,
 validationResult }   = require('express-validator/check');
const {mongoose}      = require('./db/mongoose');
const {ObjectID}      = require('mongodb');
const {Invoice}       = require("./models/invoice");
const {User}          = require("./models/user");
const {Client}        = require("./models/client");
const {Detail}        = require("./models/detail");

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

      // send the email.....


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

// ********************************************
// protected routes
// ********************************************

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
  ],(req, res) => {

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
        // send back user object


        // set flash message and redirect
      req.flash('success', `Welcome back ${email}!`)
      res.redirect('/dashboard')
});

router.get('/logout', (req, res, next) => {
    // if user then
    // delete tokens and send flash else just redirect to /

    req.flash('alert', "You've logged out - come back soon.")
    res.redirect('/');
});   // logout delete tokens

router.get('/dashboard', (req, res) => {          // redirect for success login
  const promise = Promise.all([
    Invoice.countUniqueClients(),
    Invoice.listInvoices(),
    Invoice.sumOfPaidInvoices(),
    Invoice.sumOfOwedInvoices(),
    Invoice.listUnpaidInvoices()
  ]);
  promise.then(([billedClients, allInvoices, totalPaid, totalOwed, unpaidInvoiceList]) => {

    let uniqueClients = billedClients[0].count;
    let noInvoicesProduced  = allInvoices.length;
    let noUnpaidInvoices    = unpaidInvoiceList.length
    let firstInvoice = allInvoices.pop();
    let firstDate = firstInvoice._id.date;
    let owed = totalOwed.length == 0 ? 0 : totalOwed[0].total;
    let paid = totalPaid.length == 0 ? 0 : totalPaid[0].total;
    let tradingDays = moment(Date.now()).diff(moment(firstDate), 'days');
    let avWeekEarnings = (paid / tradingDays) * 7;


    res.render('dashboard', {
      pageTitle: "Dashboard",
      pageDescription: "Let's get paid!.",
      unpaidInvoiceList,
      noUnpaidInvoices,
      noInvoicesProduced,
      uniqueClients,
      owed,
      paid,
      csrfToken: req.csrfToken(),
      tradingDays,
      avWeekEarnings
    })
  }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource"
    });
  });
});

// ********************************************
// invoice routes
// ********************************************

router.get('/invoices', (req, res) => {           // list all invoices invoices home
  Invoice.listInvoices().then((invoices)=> {
      res.render('invoices/invoices', {
      pageTitle: "Invoices",
      pageDescription: "Invoice Admin.",
      invoices
    })
  }).catch((e) => {
    console.log(e.message);
    res.sendStatus(400);
  })
});

router.get('/invoices/new', (req, res) => {

// TODO: what happened to the validation ?

  const promise = Promise.all([
    Invoice.newestInvoiceNumber(),
    Client.find({}, {name:1}).sort({name: 1})
  ]);

  promise.then(([lastInvoiceNo, clients]) => {

    let now = moment().format("DD MMM YY");
    let nextInvNo = lastInvoiceNo[0].invNo + 1;

    res.render('invoices/newinvoice', {
      data            : { invDate : now, invNo : nextInvNo },
      errors          : {},
      csrfToken       : req.csrfToken(),
      pageTitle       : "Add an Invoice",
      pageDescription : "Create a new Invoice.",
      clients
    });
  }).catch((e) => {
    res.sendStatus(400);
  })
});

router.post('/invoices', (req, res) => {

// TODO: what happened to the validation ?

  const promise = Promise.all([
    Detail.findOne(),
    Client.findOne({_id: req.body.clientId})
  ]);

  promise.then(([detail, client]) => {
    return new Invoice({
      invNo      : req.body.invNo,
      invDate    : req.body.invDate,
      message    : req.body.message,
      client     : {
          _id         : client._id,
          name        : client.name,
          email       : client.email,
          phone       : client.phone
      },
      items      : req.body.items,
      details    : {
          utr         : detail.utr,
          email       : detail.email,
          phone       : detail.phone,
          bank        : detail.bank,
          sortcode    : detail.sortcode,
          accountNo   : detail.accountNo,
          terms       : detail.terms,
          contact     : detail.contact
      },
      paid        : false
    }).save();
  }).then((invoice) => {
      console.log(invoice);
      req.flash('success', `Invoice ${invoice.invNo} for ${invoice.client.name} created !`)
      res.redirect(`invoices/${invoice._id}`);
  }).catch((e) => {
      console.log(e.message);
      res.status(400);
  });
});

router.get('/invoices/:id',  (req, res) => {
  let id = req.params.id;

  if (!ObjectID.isValid(id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  Invoice.findOne({
    _id: id,
  }).then((invoice) => {
    if (!invoice) {
      req.flash('alert', "Can't find that invoice, maybe try later.");
      return res.render('404', {
          pageTitle       : "404",
          pageDescription : "Can't find that client"
      });
    }

    let total = invoice.totalInvoiceValue();

    res.render('invoices/invoice', {
        pageTitle       : "Invoice",
        pageDescription : "invoice.",
        total,
        invoice,
        csrfToken       : req.csrfToken()
    });
  }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  });
});


router.post('/invoices/edit',  (req, res) => {
  let id = req.body.id;

  if (!ObjectID.isValid(id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  const promise = Promise.all([
    Invoice.findOne({  _id: id }),
    Client.find({}, {name:1}).sort({name: 1})
  ]);

  promise.then(([invoice, clients]) => {

    if (!invoice) {
      req.flash('alert', "Can't find that invoice, maybe try later.");
      return res.render('404', {
          pageTitle       : "404",
          pageDescription : "Can't find that client"
      });
    }

    let { client, _id, invNo, invDate, message, items, paid} = invoice


    res.render('invoices/editinvoice', {
      clients,
      data: { client, _id, invNo, invDate, message, items, paid},
      errors: {},
      csrfToken: req.csrfToken(),  // generate a csrf token
      pageTitle       : "Edit Invoice",
      pageDescription : "edit invoice."
    })
  }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  });
});


router.post('/invoices/email', (req, res) => {

  let id = req.body.id;

  if (!ObjectID.isValid(id)) {
    req.flash('alert', "Not possible to email this invoice.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  Invoice.findOne({  _id: id }).then((invoice) => {

    if (!invoice) {
      req.flash('alert', "Can't find that invoice, maybe try later.");
      return res.render('404', {
          pageTitle       : "404",
          pageDescription : "Can't find that client"
      });
    }


    // send the email....

    req.flash('success', `Invoice ${invoice.invNo} sent to ${invoice.client.email}`)
    res.redirect('/dashboard')

  })
  .catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource"
    })
  })
});

router.patch('/invoices/paid', (req, res) => {

  let id = req.body.id;

  if (!ObjectID.isValid(id)) {
    console.log('invalid id');
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  Invoice.findOneAndUpdate(
   { _id : id },
   {$set: {paid:true},$currentDate: { datePaid: true}},
   {returnNewDocument: true })
  .then((invoice) => {

     req.flash('success', `Invoice ${invoice.invNo} for ${invoice.client.name} paid!`);
     res.redirect('/dashboard');


   }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  });
});

router.patch('/invoices/unpaid', (req, res) => {

  let id = req.body.id;

  if (!ObjectID.isValid(id)) {
    console.log('invalid id', id);
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  };

  Invoice.findOneAndUpdate(
   { _id : id },
   {$set: {paid:false}, $unset: {datePaid:1}},
   {returnNewDocument: true })
  .then((invoice) => {
     req.flash('success', `Invoice ${invoice.invNo} for ${invoice.client.name} now unpaid!`);
     res.redirect("/dashboard");

   }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
      pageTitle       : "404",
      pageDescription : "Invalid resource",
    });
  });
});

router.delete('/invoices', (req, res) => {
  const { id, number, name } = req.body;

  if (!ObjectID.isValid(id)) {
    console.log('invalid id', id);
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  Invoice.deleteOne({ _id : id })
  .then((invoice) => {
     req.flash('success', `Invoice ${number} for ${name} deleted!`);
     res.redirect("/dashboard");
   }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  });
});

// PATCH/invoices/:id

// ********************************************
// client routes
// ********************************************

router.get('/clients', (req, res) => {            // list all clients
let clients = Client.find({}, {name:1}).sort({name: 1}).then((clients) => {
    console.log(clients);
    res.render('clients/clients', {
        pageTitle       : "Client List",
        pageDescription : "Clients.",
        clients
    });
  }).catch((e) => {
    res.send(400);
  })
});

router.get('/clients/new', (req, res) => {        // new client form
  res.render('clients/newclient', {
    data            : {},
    errors          : {},
    csrfToken       : req.csrfToken(),  // generate a csrf token
    pageTitle       : "Add a client",
    pageDescription : "Create a new client."
  });
});

router.post('/clients',[  check('name')
                          .isLength({ min: 1 })
                          .withMessage("Client name too short!")
                          .trim(),
                          check('email')
                          .isEmail()
                          .withMessage('That email doesn‘t look right')
                          .trim()
                          .normalizeEmail()], (req, res) => {

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

    const { name, email} = req.body;
    let client = new Client({name, email});

    client.save().then(() => {
      req.flash('success', `${client.name} created !`)
      res.redirect('/dashboard') // create custom header 'x-auth' with value of token
    }).catch((e) => {
      res.status(400).send(e);
  });
});

router.get('/clients/:id',  (req, res) => {
  let id = req.params.id;

  if (!ObjectID.isValid(id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  const promise = Promise.all([
    Client.findOne({_id: id}),
    Invoice.listItemsByClient(id)
    ]);

  promise.then(([client, itemsList]) => {

    if (!client) {
      req.flash('alert', "Can't find that client, maybe try later.");
      return res.render('404', {
          pageTitle       : "404",
          pageDescription : "Can't find that client",
      });
    }

    if (itemsList.length > 0){
      total = itemsList.map(item => item.items.fee).reduce((total, fee) => total + fee)
    } else {
      total = '0'
    }

    res.render('clients/client', {
        pageTitle       : "Client",
        pageDescription : "Client.",
        client,
        itemsList,
        total
    });
  }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  });
});

// PATCH/clients/:id

// ********************************************
// user routes
// ********************************************

router.get('/users', (req, res) => {              // list all users
  let users = User.find({},{firstName:1, lastName:1}).sort({firstName: 1}).then((users) => {
    console.log(users);
    res.render('users/users', {
        pageTitle       : "Users",
        pageDescription : "People with access.",
        users
    });
  }).catch((e) => {
    res.send(400);
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
    .withMessage("last name too short!")
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

      const { firstName, lastName, email, mobile, password } = req.body;
      let user = new User({ firstName, lastName, email, mobile, password });

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

router.get('/users/:id', (req, res) => {
  let id = req.params.id;
  if (!ObjectID.isValid(id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }
  User.findOne({
    _id: id,
  }).then((user) => {
    if (!user) {
      req.flash('alert', "Can't find that client, maybe try later.");
      return res.render('404', {
          pageTitle       : "404",
          pageDescription : "Can't find that client",
      });
    }
    res.render('users/user', {
        pageTitle       : "Users",
        pageDescription : "People with access.",
        user
    });
  }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  });
});

// PATCH/users/:id

// DELETE/users/:id  (can't delete yourself)

module.exports = router
