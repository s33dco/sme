const mongoose  = require('mongoose');
const winston   = require('./config/winston');

mongoose.set('useCreateIndex', true);

mongoose.set("debug", (collectionName, method, query, doc) => {
    winston.info(`Mongoose : ${collectionName}.${method} ${JSON.stringify(query)} ${JSON.stringify(doc)}`);
});

mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true })
  .then(() => console.log('Connected to MongoDB >;-)'))
  .catch((e) => console.log('oh noes could not connect', e.message));

module.exports = {mongoose};
