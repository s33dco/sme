require('./config/config');

const fs              = require('fs')                 // logging
const path            = require('path')
const rfs             = require('rotating-file-stream')
const morgan          = require('morgan')
const express         = require('express')
const layout          = require('express-layout')     // ejs
const bodyParser      = require('body-parser')
const validator       = require('express-validator')
const methodOverride  = require('method-override')
const cookieParser    = require('cookie-parser')      // for flash messaging
const session         = require('express-session')    //
const flash           = require('express-flash')      //
const helmet          = require('helmet')             // prevent tampering with headers
const csrf            = require('csurf')              // protect against csrf
const port 				    = process.env.PORT;
const app             = express();
const validate        = require('./validators')
const {Invoice}       = require("./models/invoice");
const {User}          = require("./models/user");
const invoices        = require('./routes/invoices');
const users           = require('./routes/users');
const clients         = require('./routes/clients');
const details         = require('./routes/details');

// set up logger....
const logDirectory  = path.join(__dirname, '/../log')

fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

let accessLogStream = rfs('access.log', {
                        size:     '10M', // rotate every 10 MegaBytes written
                        interval: '1d',  // rotate daily
                        compress: 'gzip', // compress rotated files
                        path: logDirectory
                      });

app.locals.title    = process.env.SME_TITLE;
app.locals.email    = process.env.SME_EMAIL;
app.locals.moment   = require('moment');

app.set('views', path.join(__dirname, '../views'))
app.set('view engine', 'ejs')

const middlewares = [
  methodOverride('_method'),
  helmet(),
  morgan('dev'), // ,{ stream: accessLogStream } - to direct to log file
  layout(),
  express.static(path.join(__dirname, '/../public')),
  bodyParser.urlencoded({ extended: true }),
  validator(),
  cookieParser(),
  session({
    secret: process.env.SUPER_SECRET_KEY,
    key: process.env.SUPER_SECRET_COOKIE,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 }
  }),
  flash(),
  csrf({ cookie: true })
];

app.use(middlewares)
app.use('/invoices', invoices);
app.use('/clients', clients);
app.use('/users', users);
app.use('/details', details);

// ********************************************
// public routes
// ********************************************

app.get('/', (req, res) => {
  res.render('index', {
    pageTitle: "Welcome to SME",
    pageDescription: "Static website with invoicing backend."
  })
})

app.get('/contact', (req, res) => {
  res.render('contact', {
    data: {},
    errors: {},
    csrfToken: req.csrfToken(),  // generate a csrf token
    pageTitle: "Get in touch.",
    pageDescription: "We'd love to hear from you."
  })
})

app.post('/contact', validate.email, (req, res) => {
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

app.get('/login', (req, res) => {
  res.render('login', {
    data: {},
    errors: {},
    csrfToken: req.csrfToken(),  // generate a csrf token
    pageTitle: "Sign In.",
    pageDescription: "Come on in."
  })
})

app.post('/login', validate.login, (req, res) => {

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

// ********************************************
// protected routes below....
// ********************************************

app.get('/dashboard',(req, res) => {

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
    req.flash('alert', `No data available`);
    res.redirect("/invoices");
  });
});

app.get('/logout',(req, res, next) => {
    // if user then
    // delete tokens and send flash else just redirect to /

    req.flash('alert', "You've logged out - come back soon.")
    res.redirect('/');
  });

app.use((req, res, next) => {
  res.status(404).render('404', {
    pageTitle: "404",
    pageDescription: "Err, What?"
  });
});
app.use((err, req, res, next) => {
  res.status(500).render('500', {
    err,
    pageTitle: "500",
    pageDescription: "Err, What?"
  });
});


app.listen(port, () => {
	console.log(`server running on ${port}`);
});
