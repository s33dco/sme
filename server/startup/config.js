const config = require('config');
const logger = require('./logger');

module.exports = () => {
	logger.info(`** reading config values..... 🤞🏼`);

	try {
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
		if (!config.get('SENDGRID_API_PASSWORD')) {
			throw new Error('FATAL ERROR: SENDGRID_API_PASSWORD is not defined.');
		}
		if (!config.get('SME_EMAIL')) {
			throw new Error('FATAL ERROR: SME_EMAIL is not defined.');
		}
		logger.info(`** successfully read......... 👍🏻`);
		logger.info(`** starting in ${config.util.getEnv('NODE_ENV')}... 👉🏻`);
	} catch (e) {
		logger.error(`Missing config setting\n${e.message}\n${e.stack}`);
		process.exit(1);
	}
};
