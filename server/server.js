require('./config/config');
require('express-async-errors');
const path            = require('path')
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
const moment          = require('moment');
const mongoose        = require('mongoose');
const port 				    = process.env.PORT;
const app             = express();
const winston         = require('./config/winston');
const morgan          = require('morgan');
const error           = require('./middleware/error');


const invoices        = require('./routes/invoices');
const users           = require('./routes/users');
const clients         = require('./routes/clients');
const details         = require('./routes/details');
const contact         = require('./routes/contact');
const login           = require('./routes/login');
const dashboard       = require('./routes/dashboard');
const logout          = require('./routes/logout');
const home            = require('./routes/home');

app.locals.title  = process.env.SME_TITLE;
app.locals.email  = process.env.SME_EMAIL;
app.locals.moment = require('moment');

app.set('views', path.join(__dirname, '../views'))
app.set('view engine', 'ejs')

const middlewares = [
  methodOverride('_method'),
  helmet(),
  layout(),
  morgan('dev', { stream: winston.stream }),
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
app.use('/logout', logout);
app.use('/', home);

app.use(error);

app.listen(port, () => {
	console.log(`server running on ${port}`);
});
