const mongoose  = require('mongoose');
mongoose.set('useCreateIndex', true);

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI,  { useNewUrlParser: true });

module.exports = {mongoose};
