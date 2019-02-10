const logger	= require('./server/startup/logger');
const config 	= require('config');
const express	= require('express')
const app     = express();

require('./server/startup/config')();
require('./server/startup/db')();
require('./server/startup/routes')(app);

const port 	= process.env.PORT || config.get('PORT');

const server = app.listen(port, () => {
	logger.info(`** listening on port ${port}.... 👂🏻`);
});

module.exports = server;
