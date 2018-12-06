require('./config/config');

const fs            = require('fs')                 // logging
const path          = require('path')
const rfs           = require('rotating-file-stream')
const morgan        = require('morgan')
const express       = require('express')
const layout        = require('express-layout')     // ejs
const bodyParser    = require('body-parser')
const validator     = require('express-validator')
const cookieParser  = require('cookie-parser')      // for flash messaging
const session       = require('express-session')    //
const flash         = require('express-flash')      //
const helmet        = require('helmet')             // prevent tampering with headers
const csrf          = require('csurf')              // protect against csrf
const port 				  = process.env.PORT;

const routes        = require('./routes')
const app           = express();

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

app.set('views', path.join(__dirname, '../views'))
app.set('view engine', 'ejs')

const middlewares = [
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

app.use('/', routes)

app.use((req, res, next) => {
  res.status(404).render('404', {
    pageTitle: "404",
    pageDescription: "Err, What?"
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
});

app.listen(port, () => {
	console.log(`server running on ${port}`);
});

module.exports = {app};
