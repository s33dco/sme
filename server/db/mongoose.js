const mongoose  = require('mongoose');

mongoose.set('useCreateIndex', true);

// show debug in console
mongoose.set('debug', true);

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI,  { useNewUrlParser: true });

module.exports = {mongoose};
