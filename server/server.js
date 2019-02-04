require('./config/config');

const path            = require('path')
const morgan          = require('morgan')
const express         = require('express')
const layout          = require('express-layout')     // ejs
const bodyParser      = require('body-parser')
const {mongoose}      = require('./db/mongoose');
const validator       = require('express-validator')
const methodOverride  = require('method-override')
const cookieParser    = require('cookie-parser')      // for flash messaging
const session         = require('express-session')    //
const flash           = require('express-flash')      //
const helmet          = require('helmet')             // prevent tampering with headers
const csrf            = require('csurf')              // protect against csrf
const moment          = require('moment');
const port 				    = process.env.PORT;
const app             = express();
const invoices        = require('./routes/invoices');
const users           = require('./routes/users');
const clients         = require('./routes/clients');
const details         = require('./routes/details');
const contact         = require('./routes/contact');
const login           = require('./routes/login');
const dashboard       = require('./routes/dashboard');

app.locals.title  = process.env.SME_TITLE;
app.locals.email  = process.env.SME_EMAIL;
app.locals.moment = require('moment');

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
    cookie: { maxAge: 3600000 }
  }),
  flash(),
  csrf({ cookie: true })
];

app.use(middlewares)
app.use('/invoices', invoices);
app.use('/clients', clients);
app.use('/users', users);
app.use('/details', details);
app.use('/contact', contact);
app.use('/login', login);
app.use('/dashboard', dashboard);

app.get('/', (req, res) => {
  res.render('index', {
    pageTitle: "Welcome to SME",
    pageDescription: "Static website with invoicing backend."
  })
})

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
