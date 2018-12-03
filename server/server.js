require('./config/config');

const express     = require('express');
const hbs         = require('hbs');
const morgan      = require('morgan');


const {mongoose}  = require('./db/mongoose');
const {Invoice}   = require("./models/invoice");
const {User}      = require("./models/user");


let app = express();
const port = process.env.PORT;

app.locals.title = process.env.SME_TITLE;
app.locals.email = process.env.SME_EMAIL;
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/../views/partials');


app.use(morgan('dev'));
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json({ extended: true }));

hbs.registerHelper('getCurrentYear', () => {
	return new Date().getFullYear();
});

app.get('/',(req, res) => {
  res.render('home.hbs', {
		pageTitle       : `Home | ${app.locals.title}`,
    pageDescription : `Welcome to ${app.locals.title}`
	});
});





app.use((req, res, next) => {
    res.status(404).render('404.hbs', {title: "Sorry, page not found"});
});


app.listen(port, () => {
	console.log(`server running on ${port}`);
  console.log(`process.env`)
});

module.exports = {app};
