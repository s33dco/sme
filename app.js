const logger	= require('./server/startup/logger');
const config 	= require('config');
const express	= require('express')
const app     = express();

require('./server/startup/config')();
require('./server/startup/db')();
require('./server/startup/routes')(app);

if (config.util.getEnv('NODE_ENV') === 'production') {
    require('./server/startup/prod')(app);
}


module.exports = app;
