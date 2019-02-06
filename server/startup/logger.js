require('winston-daily-rotate-file');
require('winston-mongodb');
require('express-async-errors');
const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');
const database = process.env.MONGODB_URI;
const env = process.env.NODE_ENV || 'development';
const logDir = 'log';


// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const dailyRotateFileTransport = new transports.DailyRotateFile({
  filename: `${logDir}/%DATE%.log`,
  datePattern: 'DD-MM-YYYY',
  handleExceptions: true,
  exitOnError: true
});

const logger = createLogger({
  // change level if in dev environment versus production
  level: env === 'development' ? 'debug' : 'info',
  format: format.combine(
    format.timestamp({
      format: 'DD-MM-YY HH:mm:ss'
    }),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`) // standard includes timestamp
  ),
  transports: [
    dailyRotateFileTransport,                     // log to rotating file

    new transports.Console({
      handleExceptions: true,
      exitOnError: true,
      format: format.combine(
        format.colorize(),
        format.printf(
          info => `${info.level}: ${info.message}` // not printing timestamp to console
        )
      )
    }),

    new transports.MongoDB({
      handleExceptions: true,
      exitOnError: true,
      db: "mongodb://localhost:27017/sme",
      collection: 'log',
      level: 'error',                            // send errors to db
      storeHost: true,
      expireAfterSeconds: 172800,   //48 hours
      capped: true,
      options: { poolSize: 2, autoReconnect: true, useNewUrlParser: true }
    })
  ]
});


logger.stream = {                                 // stream for morgan
  write: function(message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    logger.info(message);
  },
};

process.on('unhandledRejection', (e) => {
    logger.error(`Unhandled Rejection : ${e.message} ${e.stack}`);
    throw Error(`from unhandled rejection ${e.stack}`);
});


module.exports = logger;
