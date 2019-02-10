const mongoose  = require('mongoose');
const logger    = require('./logger');
const config    = require('config');

module.exports = () => {

  mongoose.set('useCreateIndex', true);

  mongoose.set("debug", (collectionName, method, query, doc) => {
      logger.info(`[Mongoose] ${collectionName}.${method} ${JSON.stringify(query)} ${JSON.stringify(doc)}\n`);
  });

  mongoose.Promise = global.Promise;

  const mongoDatabase = config.get('MONGODB_URI');

  mongoose.connect(mongoDatabase, { useNewUrlParser: true })
    .then(() => {
      logger.info(`** connected to ${mongoDatabase} 😁\n`);
    })
    .catch((e) => logger.error(`** Could not connect to DB :-( **\n ${e.message} `));

};
