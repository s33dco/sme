const mongoose  = require('mongoose');
const logger    = require('./logger');

module.exports = () => {

  mongoose.set('useCreateIndex', true);

  mongoose.set("debug", (collectionName, method, query, doc) => {
      logger.info(`[Mongoose] ${collectionName}.${method} ${JSON.stringify(query)} ${JSON.stringify(doc)}\n`);
  });

  mongoose.Promise = global.Promise;

  mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true })
    .then(() => logger.info(`** Connected to MongoDB >;-) **\n`))
    .catch((e) => logger.error(`** Could not connect to DB :-( ${e.message} **`));

};
