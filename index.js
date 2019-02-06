const logger  = require('./server/startup/logger');
const express = require('express')
const app     = express();

require('./server/startup/config/config')();
require('./server/startup/db')();
require('./server/startup/routes')(app);

const port 	= process.env.PORT;
app.listen(port, () => {
	logger.info(`** server running on port ${port}... **\n`);
});
