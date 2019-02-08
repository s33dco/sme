const config = require('config');
const logger  = require('./logger');

module.exports = function() {

  logger.info(`** reading config values...  **\n`);

  if (!config.get('JWT_SECRET')) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined.');
  }

  if (!config.get('MONGODB_URI')) {
    throw new Error('FATAL ERROR: MONGODB_URI is not defined.');
  }
  if (!config.get('PORT')) {
    throw new Error('FATAL ERROR: PORT is not defined.');
  }

  if (!config.get('SUPER_SECRET_KEY')) {
    throw new Error('FATAL ERROR: SUPER_SECRET_KEY is not defined.');
  }

  if (!config.get('SUPER_SECRET_COOKIE')) {
    throw new Error('FATAL ERROR: SUPER_SECRET_COOKIE is not defined.');
  }

  if (!config.get('SME_TITLE')) {
    throw new Error('FATAL ERROR: SME_TITLE is not defined.');
  }

  if (!config.get('SME_EMAIL')) {
    throw new Error('FATAL ERROR: SME_EMAIL is not defined.');
  }

  logger.info(`** successfully read ! >;-) **\n`);

}
