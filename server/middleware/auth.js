const {User} = require('../models/user')
const jwt = require('jsonwebtoken');
const config = require('config');
const logger	= require('../startup/logger');

module.exports = async (req, res, next) => {

    const token = req.cookies.token;
    const ip = (req.headers['x-forwarded-for'] || '').split(',').pop() ||
       req.connection.remoteAddress ||
       req.socket.remoteAddress ||
       req.connection.socket.remoteAddress;

    if (!token) {
      req.flash('alert', `You need to log in first.`);
      res.status(401);

      throw ({
        tag : 'Computer says no!',
        message : 'You need to have a valid account to access this area, speak to your administrator if you need these.',
        statusCode : 401
        });
      logger.info(`${e.statusCode} - ${e.tag} - ${e.message} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${ip}`);
      next(Error);
    }
    try {
      const decoded = jwt.verify(token, config.get('JWT_SECRET'));
      req.user = decoded;

// check req.user is in database
      let foundUser = await User.findById(req.user._id);

      if(!foundUser){
        req.flash('alert', `Invalid Token!.`);
        throw new Error;
        next(Error);
      }

      res.locals.loggedIn = req.user;
      res.locals.fullAdmin = req.user.isAdmin;
      next();
    }
    catch (e) {
      req.flash('alert', `Somethings gone wrong.`);
      res.status(401);
      throw ({
        tag : "It's just not adding up.",
        message : 'Maybe you should sign in again and take it from there, your credentials are not valid.',
        statusCode: 401
        });
      logger.info(`${e.statusCode} - ${e.tag} - ${e.message} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${ip}`);
      next(Error);
    }
}
