const mongoose      = require('mongoose');
const config        = require('config');
const mongoDatabase = config.get('MONGODB_URI');

module.exports = {

    connectDb: () => {
        mongoose.Promise = global.Promise;
        mongoose.connect(mongoDatabase, { useNewUrlParser: true });
    },
    disconnectDb: (done) => {
        mongoose.disconnect(done);
        logger.error(`** disconnected to ${mongoDatabase} 😁\n`);
    },
};
