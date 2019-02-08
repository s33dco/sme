const logger  = require('./server/startup/logger');
const express = require('express')
const app     = express();

require('./server/startup/config')();
require('./server/startup/db')();
require('./server/startup/routes')(app);

const port 	= process.env.PORT || 3000;

app.listen(port, () => {
	logger.info(`** listening on port ${port}.... **`);
});
