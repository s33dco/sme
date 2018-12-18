const {User} = require('./../models/user');

let authenticate = (req, res, next) => {
  let token = req.header('x-auth');

  User.findByToken(token).then((user) => {
    if (!user) {
      return Promise.reject();                  // no user so send to catch block
    }
    req.user = user;
    req.token = token;
    next();
  }).catch((e) => {                             // catch error from try block in UserSchema jwt.verify
    res.status(401).send();                     // send back 401 error and empty body
  });
};

module.exports = { authenticate };
