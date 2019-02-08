const config   = require('config');
const logger  = require('./server/startup/logger');
const express = require('express')
const app     = express();

require('./server/startup/config')();
require('./server/startup/db')();
require('./server/startup/routes')(app);

const port 	= config.get('PORT');

app.listen(port, () => {
	logger.info(`** starting in ${config.util.getEnv('NODE_ENV')}, server running on port ${port}... **\n`);
});
