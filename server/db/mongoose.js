const mongoose  = require('mongoose');

mongoose.set('useCreateIndex', true);

// show debug in console

mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true })
  .then(() => console.log('Connected to MongoDB >;-)'))
  .catch((e) => console.log('oh noes could not connect', e.message));

module.exports = {mongoose};
