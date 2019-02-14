const logger	= require('./server/startup/logger');
const config 	= require('config');
const express	= require('express')
const app     = express();

require('./server/startup/config')();
require('./server/startup/db')();
require('./server/startup/routes')(app);


module.exports = app;
