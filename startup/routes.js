const methodOverride  = require('method-override')
const helmet          = require('helmet')
const layout          = require('express-layout')
const morgan          = require('morgan');
const bodyParser      = require('body-parser')
const validator       = require('express-validator')
const cookieParser    = require('cookie-parser')
const session         = require('express-session')
const flash           = require('express-flash')
const csrf            = require('csurf')
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

module.exports = () => {

  app.locals.title  = process.env.SME_TITLE;
  app.locals.email  = process.env.SME_EMAIL;
  app.locals.moment = require('moment');
  app.set('views', path.join(__dirname, '../views'))
  app.set('view engine', 'ejs')

  const middlewares = [
    methodOverride('_method'),
    helmet(),
    layout(),
    morgan('dev', { stream: logger.stream }), // TODO: make default logger dependent on environment
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
}
